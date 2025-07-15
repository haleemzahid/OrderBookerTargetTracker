import { getDatabase } from '../../../services/database';
import type { SimpleDashboardData, DashboardMetrics, SimplePerformer, DateRangeFilter } from '../types';

/**
 * Simple dashboard data service for fetching key business metrics
 * Provides simplified data aggregation for non-technical users
 */
export class SimpleDashboardService {
  
  /**
   * Get all dashboard metrics and performer data
   */
  static async getDashboardMetrics(filters?: DateRangeFilter): Promise<SimpleDashboardData> {
    try {
      const db = getDatabase();
      
      // Use current month as default if no filters provided
      const now = new Date();
      const startDate = filters?.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = filters?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const dateStart = startDate.toISOString().split('T')[0];
      const dateEnd = endDate.toISOString().split('T')[0];
      
      // Get core metrics in parallel for better performance
      const [metrics, topPerformers, needsAttention] = await Promise.all([
        this.getBasicMetrics(db, dateStart, dateEnd),
        this.getTopPerformers(db, dateStart, dateEnd),
        this.getNeedsAttention(db, dateStart, dateEnd)
      ]);
      
      return {
        metrics,
        topPerformers,
        needsAttention,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }
  
  /**
   * Get basic dashboard metrics
   */
  private static async getBasicMetrics(db: any, dateStart: string, dateEnd: string): Promise<DashboardMetrics> {
    // 1. Total Order Bookers
    const orderBookersQuery = `SELECT COUNT(*) as count FROM order_bookers WHERE is_active = 1`;
    const orderBookersResult = await db.select(orderBookersQuery);
    const totalOrderBookers = orderBookersResult[0]?.count || 0;
    
    // 2. This Month Sales and Returns
    const salesQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalSales,
        COALESCE(SUM(return_amount), 0) as totalReturns
      FROM orders 
      WHERE order_date >= ? AND order_date <= ?
    `;
    const salesResult = await db.select(salesQuery, [dateStart, dateEnd]);
    const thisMonthSales = salesResult[0]?.totalSales || 0;
    const thisMonthReturns = salesResult[0]?.totalReturns || 0;
    
    // 3. Cartons data
    const cartonsQuery = `
      SELECT 
        COALESCE(SUM(oi.cartons), 0) as totalCartons,
        COALESCE(SUM(oi.return_cartons), 0) as returnCartons
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date >= ? AND o.order_date <= ?
    `;
    const cartonsResult = await db.select(cartonsQuery, [dateStart, dateEnd]);
    const totalCartons = cartonsResult[0]?.totalCartons || 0;
    const returnCartons = cartonsResult[0]?.returnCartons || 0;
    
    // 4. Target Achievement calculation
    const targetAchievement = await this.calculateTargetAchievement(db, dateStart, dateEnd);
    
    return {
      totalOrderBookers,
      thisMonthSales,
      thisMonthReturns,
      targetAchievement,
      totalCartons,
      returnCartons,
      netCartons: totalCartons - returnCartons,
      netSales: thisMonthSales - thisMonthReturns
    };
  }
  
  /**
   * Calculate average target achievement across all order bookers
   */
  private static async calculateTargetAchievement(db: any, dateStart: string, dateEnd: string): Promise<number> {
    const date = new Date(dateStart);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const achievementQuery = `
      SELECT 
        ob.id,
        ob.name,
        mt.target_amount,
        COALESCE(SUM(o.total_amount), 0) as actual_sales
      FROM order_bookers ob
      LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
        AND mt.year = ? AND mt.month = ?
      LEFT JOIN orders o ON ob.id = o.order_booker_id 
        AND o.order_date >= ? AND o.order_date <= ?
      WHERE ob.is_active = 1
      GROUP BY ob.id, ob.name, mt.target_amount
    `;
    
    const result = await db.select(achievementQuery, [year, month, dateStart, dateEnd]);
    
    if (result.length === 0) return 0;
    
    let totalAchievement = 0;
    let validBookers = 0;
    
    result.forEach((row: any) => {
      const targetAmount = row.target_amount || 0;
      const actualSales = row.actual_sales || 0;
      
      if (targetAmount > 0) {
        totalAchievement += (actualSales / targetAmount) * 100;
        validBookers++;
      }
    });
    
    return validBookers > 0 ? totalAchievement / validBookers : 0;
  }
  
  /**
   * Get top performing order bookers
   */
  private static async getTopPerformers(db: any, dateStart: string, dateEnd: string): Promise<SimplePerformer[]> {
    const performers = await this.getOrderBookerPerformance(db, dateStart, dateEnd);
    
    return performers
      .filter(p => p.achievementPercentage >= 80) // Consider 80%+ as top performers
      .sort((a, b) => b.achievementPercentage - a.achievementPercentage)
      .slice(0, 5) // Top 5 performers
      .map(p => ({ ...p, isTopPerformer: true }));
  }
  
  /**
   * Get order bookers that need attention
   */
  private static async getNeedsAttention(db: any, dateStart: string, dateEnd: string): Promise<SimplePerformer[]> {
    const performers = await this.getOrderBookerPerformance(db, dateStart, dateEnd);
    
    return performers
      .filter(p => p.achievementPercentage < 50) // Consider <50% as needs attention
      .sort((a, b) => a.achievementPercentage - b.achievementPercentage)
      .slice(0, 10) // Up to 10 that need attention
      .map(p => ({ ...p, isTopPerformer: false }));
  }
  
  /**
   * Get performance data for all order bookers
   */
  private static async getOrderBookerPerformance(db: any, dateStart: string, dateEnd: string): Promise<SimplePerformer[]> {
    const date = new Date(dateStart);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const performanceQuery = `
      SELECT 
        ob.id as orderBookerId,
        ob.name as orderBookerName,
        mt.target_amount,
        COALESCE(SUM(o.total_amount), 0) as actual_sales
      FROM order_bookers ob
      LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
        AND mt.year = ? AND mt.month = ?
      LEFT JOIN orders o ON ob.id = o.order_booker_id 
        AND o.order_date >= ? AND o.order_date <= ?
      WHERE ob.is_active = 1
      GROUP BY ob.id, ob.name, mt.target_amount
      ORDER BY ob.name
    `;
    
    const result = await db.select(performanceQuery, [year, month, dateStart, dateEnd]);
    
    return result.map((row: any) => {
      const targetAmount = row.target_amount || 0;
      const actualSales = row.actual_sales || 0;
      const achievementPercentage = targetAmount > 0 ? (actualSales / targetAmount) * 100 : 0;
      
      return {
        orderBookerId: row.orderBookerId,
        orderBookerName: row.orderBookerName,
        achievementPercentage: Math.round(achievementPercentage * 10) / 10, // Round to 1 decimal
        isTopPerformer: false // Will be set by calling functions
      };
    });
  }
}

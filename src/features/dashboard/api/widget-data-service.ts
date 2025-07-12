import { getDatabase } from '../../../services/database';
import type {
  RevenueMetricData,
  ProfitMarginData,
  TopPerformerData,
  SalesTrendData,
  ProductPerformanceData,
  ReturnRateData,
  TargetProgressData,
  CashFlowData,
  OrderVelocityData,
  AlertCenterData,
  DashboardAlert,
  GlobalDashboardFilters,
  DashboardApiResponse
} from '../types';

/**
 * Main widget data service that aggregates data from all dashboard widgets
 * Handles database queries and data transformation for business intelligence
 */
export class WidgetDataService {
  
  /**
   * Get revenue performance metrics
   */
  static async getRevenueMetrics(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<RevenueMetricData>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      // Calculate current month revenue
      const currentMonthQuery = `
        SELECT 
          COALESCE(SUM(total_amount), 0) as currentRevenue,
          COUNT(DISTINCT id) as orderCount
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
      `;
      
      const currentMonthParams = [
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const currentResult = await db.select<any[]>(currentMonthQuery, currentMonthParams);
      const currentRevenue = currentResult[0]?.currentRevenue || 0;
      
      // Calculate last month revenue for comparison
      const lastMonthStart = new Date(dateRange.start);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const lastMonthEnd = new Date(dateRange.end);
      lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
      
      const lastMonthQuery = `
        SELECT COALESCE(SUM(total_amount), 0) as lastRevenue
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
      `;
      
      const lastMonthParams = [
        lastMonthStart.toISOString().split('T')[0],
        lastMonthEnd.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const lastResult = await db.select<any[]>(lastMonthQuery, lastMonthParams);
      const lastMonthRevenue = lastResult[0]?.lastRevenue || 0;
      
      // Get target from monthly_targets
      const targetQuery = `
        SELECT COALESCE(SUM(target_amount), 0) as targetRevenue
        FROM monthly_targets 
        WHERE year = ? AND month = ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
      `;
      
      const targetParams = [
        dateRange.start.getFullYear(),
        dateRange.start.getMonth() + 1,
        ...(filters.orderBookerIds || [])
      ];
      
      const targetResult = await db.select<any[]>(targetQuery, targetParams);
      const targetRevenue = targetResult[0]?.targetRevenue || 0;
      
      // Get daily trend data
      const trendQuery = `
        SELECT 
          order_date as date,
          SUM(total_amount) as revenue
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
        GROUP BY order_date
        ORDER BY order_date
      `;
      
      const trendResult = await db.select<any[]>(trendQuery, currentMonthParams);
      
      const growthPercentage = lastMonthRevenue > 0 
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      const achievementPercentage = targetRevenue > 0 
        ? (currentRevenue / targetRevenue) * 100 
        : 0;
      
      const data: RevenueMetricData = {
        currentMonthRevenue: currentRevenue,
        targetRevenue: targetRevenue,
        achievementPercentage: achievementPercentage,
        growthPercentage: growthPercentage,
        lastMonthRevenue: lastMonthRevenue,
        trendData: trendResult.map(row => ({
          date: row.date,
          revenue: row.revenue || 0
        }))
      };
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        data: {
          currentMonthRevenue: 0,
          targetRevenue: 0,
          achievementPercentage: 0,
          growthPercentage: 0,
          lastMonthRevenue: 0,
          trendData: []
        },
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get profit margin metrics
   */
  static async getProfitMargins(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<ProfitMarginData>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      const query = `
        SELECT 
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COALESCE(SUM(total_profit), 0) as totalProfit,
          COALESCE(SUM(total_cost), 0) as totalCost
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
      `;
      
      const params = [
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const result = await db.select<any[]>(query, params);
      const { totalRevenue, totalProfit } = result[0] || { totalRevenue: 0, totalProfit: 0 };
      
      const currentMarginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const targetMarginPercentage = 20; // Default target of 20%
      const variance = currentMarginPercentage - targetMarginPercentage;
      
      // Determine status and trend
      let status: 'healthy' | 'warning' | 'critical';
      if (currentMarginPercentage >= 25) status = 'healthy';
      else if (currentMarginPercentage >= 15) status = 'warning';
      else status = 'critical';
      
      const data: ProfitMarginData = {
        currentMarginPercentage,
        targetMarginPercentage,
        marginTrend: variance > 0 ? 'up' : variance < 0 ? 'down' : 'stable',
        totalRevenue,
        totalProfit,
        variance,
        status
      };
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching profit margins:', error);
      return {
        data: {
          currentMarginPercentage: 0,
          targetMarginPercentage: 20,
          marginTrend: 'stable',
          totalRevenue: 0,
          totalProfit: 0,
          variance: 0,
          status: 'critical'
        },
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get top performers data
   */
  static async getTopPerformers(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<TopPerformerData[]>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      const query = `
        SELECT 
          ob.id as orderBookerId,
          ob.name as orderBookerName,
          COALESCE(mt.target_amount, 0) as targetAmount,
          COALESCE(SUM(o.total_amount), 0) as achievedAmount,
          COUNT(DISTINCT o.id) as ordersCount
        FROM order_bookers ob
        LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
          AND mt.year = ? AND mt.month = ?
        LEFT JOIN orders o ON ob.id = o.order_booker_id 
          AND o.order_date >= ? AND o.order_date <= ?
        WHERE 1=1
        ${filters.orderBookerIds?.length ? `AND ob.id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
        GROUP BY ob.id, ob.name, mt.target_amount
        ORDER BY (COALESCE(SUM(o.total_amount), 0) / NULLIF(COALESCE(mt.target_amount, 1), 0)) DESC
        LIMIT 10
      `;
      
      const params = [
        dateRange.start.getFullYear(),
        dateRange.start.getMonth() + 1,
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const result = await db.select<any[]>(query, params);
      
      const data: TopPerformerData[] = result.map((row, index) => {
        const achievementPercentage = row.targetAmount > 0 
          ? (row.achievedAmount / row.targetAmount) * 100 
          : 0;
        
        return {
          orderBookerId: row.orderBookerId,
          orderBookerName: row.orderBookerName,
          targetAmount: row.targetAmount || 0,
          achievedAmount: row.achievedAmount || 0,
          achievementPercentage,
          trend: 'stable', // TODO: Calculate trend from historical data
          rank: index + 1,
          ordersCount: row.ordersCount || 0
        };
      });
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return {
        data: [],
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get alerts for alert center
   */
  static async getAlerts(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<AlertCenterData>> {
    try {
      const alerts: DashboardAlert[] = [];
      
      // Check for high return rates
      const returnRateData = await this.getReturnRates(filters);
      if (returnRateData.status === 'success' && returnRateData.data.overallReturnRate > 5) {
        alerts.push({
          id: 'high-return-rate-overall',
          type: 'high-return-rate',
          severity: returnRateData.data.overallReturnRate > 10 ? 'critical' : 'high',
          title: 'High Return Rate Detected',
          description: `Overall return rate is ${returnRateData.data.overallReturnRate.toFixed(1)}%`,
          value: returnRateData.data.overallReturnRate,
          threshold: 5,
          timestamp: new Date(),
          actionRequired: true,
          isRead: false
        });
      }
      
      // Check for target miss risks
      const performersData = await this.getTopPerformers(filters);
      if (performersData.status === 'success') {
        performersData.data.forEach(performer => {
          if (performer.achievementPercentage < 70) {
            alerts.push({
              id: `target-risk-${performer.orderBookerId}`,
              type: 'target-miss-risk',
              severity: performer.achievementPercentage < 50 ? 'critical' : 'high',
              title: 'Target Achievement Risk',
              description: `${performer.orderBookerName} is at ${performer.achievementPercentage.toFixed(1)}% of target`,
              value: performer.achievementPercentage,
              threshold: 70,
              timestamp: new Date(),
              relatedEntity: {
                type: 'order-booker',
                id: performer.orderBookerId,
                name: performer.orderBookerName
              },
              actionRequired: true,
              isRead: false
            });
          }
        });
      }
      
      const criticalCount = alerts.filter(a => a.severity === 'critical').length;
      const unreadCount = alerts.filter(a => !a.isRead).length;
      
      const data: AlertCenterData = {
        alerts,
        unreadCount,
        criticalCount,
        summary: {
          highReturnRateAlerts: alerts.filter(a => a.type === 'high-return-rate').length,
          targetMissRiskAlerts: alerts.filter(a => a.type === 'target-miss-risk').length,
          unusualPatternAlerts: alerts.filter(a => a.type === 'unusual-pattern').length,
          systemHealthAlerts: alerts.filter(a => a.type === 'system-health').length
        }
      };
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return {
        data: {
          alerts: [],
          unreadCount: 0,
          criticalCount: 0,
          summary: {
            highReturnRateAlerts: 0,
            targetMissRiskAlerts: 0,
            unusualPatternAlerts: 0,
            systemHealthAlerts: 0
          }
        },
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get return rate data
   */
  static async getReturnRates(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<ReturnRateData>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      // Overall return rate
      const overallQuery = `
        SELECT 
          COALESCE(SUM(total_cartons), 0) as totalCartons,
          COALESCE(SUM(return_cartons), 0) as returnCartons
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
      `;
      
      const params = [
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const overallResult = await db.select<any[]>(overallQuery, params);
      const { totalCartons, returnCartons } = overallResult[0] || { totalCartons: 0, returnCartons: 0 };
      const overallReturnRate = totalCartons > 0 ? (returnCartons / totalCartons) * 100 : 0;
      
      // Return rate by product
      const productQuery = `
        SELECT 
          p.id as productId,
          p.name as productName,
          SUM(oi.quantity) as totalCartons,
          SUM(oi.return_cartons) as returnCartons
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date >= ? AND o.order_date <= ?
        ${filters.orderBookerIds?.length ? `AND o.order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
        GROUP BY p.id, p.name
        HAVING SUM(oi.return_cartons) > 0
        ORDER BY (SUM(oi.return_cartons) / NULLIF(SUM(oi.quantity), 0)) DESC
        LIMIT 5
      `;
      
      const productResult = await db.select<any[]>(productQuery, params);
      
      const data: ReturnRateData = {
        overallReturnRate,
        threshold: 5,
        status: overallReturnRate > 10 ? 'critical' : overallReturnRate > 5 ? 'warning' : 'normal',
        trend: 'stable', // TODO: Calculate from historical data
        byProduct: productResult.map(row => ({
          productId: row.productId,
          productName: row.productName,
          returnRate: row.totalCartons > 0 ? (row.returnCartons / row.totalCartons) * 100 : 0,
          returnCartons: row.returnCartons || 0,
          totalCartons: row.totalCartons || 0
        })),
        byOrderBooker: [] // TODO: Implement if needed
      };
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching return rates:', error);
      return {
        data: {
          overallReturnRate: 0,
          threshold: 5,
          status: 'normal',
          trend: 'stable',
          byProduct: [],
          byOrderBooker: []
        },
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get target progress for all order bookers
   */
  static async getTargetProgress(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<TargetProgressData[]>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      // Get current month and year for target lookup
      const currentMonth = dateRange.start.getMonth() + 1;
      const currentYear = dateRange.start.getFullYear();
      
      // Calculate days in month and days remaining
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentDay = dateRange.end.getDate();
      const daysRemaining = Math.max(0, daysInMonth - currentDay);
      
      const query = `
        SELECT 
          mt.order_booker_id as orderBookerId,
          ob.name as orderBookerName,
          mt.target_amount as targetAmount,
          COALESCE(SUM(o.total_amount), 0) as achievedAmount,
          COUNT(DISTINCT o.id) as orderCount
        FROM monthly_targets mt
        JOIN order_bookers ob ON mt.order_booker_id = ob.id
        LEFT JOIN orders o ON o.order_booker_id = mt.order_booker_id 
          AND o.order_date >= ? 
          AND o.order_date <= ?
        WHERE mt.year = ? AND mt.month = ?
        ${filters.orderBookerIds?.length ? `AND mt.order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
        GROUP BY mt.order_booker_id, ob.name, mt.target_amount
        ORDER BY (COALESCE(SUM(o.total_amount), 0) / NULLIF(mt.target_amount, 0)) DESC
      `;
      
      const params = [
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        currentYear,
        currentMonth,
        ...(filters.orderBookerIds || [])
      ];
      
      const result = await db.select<any[]>(query, params);
      
      const data: TargetProgressData[] = result.map(row => {
        const achievementPercentage = row.targetAmount > 0 ? (row.achievedAmount / row.targetAmount) * 100 : 0;
        const currentDailyAverage = currentDay > 0 ? row.achievedAmount / currentDay : 0;
        const requiredDailyAverage = daysRemaining > 0 ? (row.targetAmount - row.achievedAmount) / daysRemaining : 0;
        
        // Project final achievement based on current pace
        const projectedAchievement = currentDailyAverage > 0 ? 
          ((currentDailyAverage * daysInMonth) / row.targetAmount) * 100 : achievementPercentage;
        
        // Determine status based on achievement and pace
        let status: 'ahead' | 'on-track' | 'at-risk' | 'behind';
        if (achievementPercentage >= 100) {
          status = 'ahead';
        } else if (currentDailyAverage >= requiredDailyAverage * 1.1) {
          status = 'ahead';
        } else if (currentDailyAverage >= requiredDailyAverage * 0.9) {
          status = 'on-track';
        } else if (currentDailyAverage >= requiredDailyAverage * 0.7) {
          status = 'at-risk';
        } else {
          status = 'behind';
        }
        
        return {
          orderBookerId: row.orderBookerId,
          orderBookerName: row.orderBookerName,
          targetAmount: row.targetAmount,
          achievedAmount: row.achievedAmount,
          achievementPercentage,
          daysRemaining,
          requiredDailyAverage,
          currentDailyAverage,
          status,
          projectedAchievement
        };
      });
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching target progress:', error);
      return {
        data: [],
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get sales trend data for time series analysis
   */
  static async getSalesTrends(filters: GlobalDashboardFilters): Promise<DashboardApiResponse<SalesTrendData>> {
    try {
      const db = getDatabase();
      const { dateRange } = filters;
      
      const query = `
        SELECT 
          order_date as date,
          COALESCE(SUM(total_amount), 0) as sales,
          COUNT(DISTINCT id) as orders
        FROM orders 
        WHERE order_date >= ? AND order_date <= ?
        ${filters.orderBookerIds?.length ? `AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(',')})` : ''}
        GROUP BY order_date
        ORDER BY order_date
      `;
      
      const params = [
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0],
        ...(filters.orderBookerIds || [])
      ];
      
      const result = await db.select<any[]>(query, params);
      
      const dailySales = result.map(row => ({
        date: row.date,
        sales: row.sales || 0,
        orders: row.orders || 0
      }));
      
      // Calculate moving averages
      const calculateMovingAverage = (data: number[], window: number) => {
        if (data.length < window) return 0;
        const recent = data.slice(-window);
        return recent.reduce((sum, val) => sum + val, 0) / window;
      };
      
      const salesValues = dailySales.map(d => d.sales);
      const sevenDay = calculateMovingAverage(salesValues, 7);
      const thirtyDay = calculateMovingAverage(salesValues, 30);
      
      // Basic seasonal pattern detection
      let seasonalPattern: 'weekend-low' | 'midweek-peak' | 'end-month-rush' | undefined;
      
      if (dailySales.length >= 7) {
        // Check for weekend patterns (assuming dates are in YYYY-MM-DD format)
        const weekendSales = dailySales
          .filter(d => {
            const dayOfWeek = new Date(d.date).getDay();
            return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
          })
          .reduce((sum, d) => sum + d.sales, 0);
        
        const weekdaySales = dailySales
          .filter(d => {
            const dayOfWeek = new Date(d.date).getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
          })
          .reduce((sum, d) => sum + d.sales, 0);
        
        if (weekendSales > 0 && weekdaySales > 0) {
          const weekendAvg = weekendSales / Math.max(1, dailySales.filter(d => {
            const dayOfWeek = new Date(d.date).getDay();
            return dayOfWeek === 0 || dayOfWeek === 6;
          }).length);
          
          const weekdayAvg = weekdaySales / Math.max(1, dailySales.filter(d => {
            const dayOfWeek = new Date(d.date).getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5;
          }).length);
          
          if (weekdayAvg > weekendAvg * 1.2) {
            seasonalPattern = 'weekend-low';
          }
        }
      }
      
      const data: SalesTrendData = {
        dailySales,
        movingAverages: {
          sevenDay,
          thirtyDay
        },
        seasonalPattern
      };
      
      return {
        data,
        lastUpdated: new Date(),
        status: 'success'
      };
      
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      return {
        data: {
          dailySales: [],
          movingAverages: { sevenDay: 0, thirtyDay: 0 }
        },
        lastUpdated: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

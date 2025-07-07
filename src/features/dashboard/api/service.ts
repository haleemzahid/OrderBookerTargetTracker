import { orderBookerService } from '../../order-bookers/api/service';
import { dailyEntryService } from '../../daily-entries/api/service';
import { monthlyTargetService } from '../../monthly-targets/api/service';
import type { DashboardData, DashboardFilters } from '../types';

export interface IDashboardService {
  getDashboardData(filters?: DashboardFilters): Promise<DashboardData>;
  refreshDashboard(): Promise<void>;
}

export const dashboardService: IDashboardService = {
  getDashboardData: async (filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get all order bookers
    const orderBookers = await orderBookerService.getAll();

    // Get filtered order bookers if IDs are specified
    const filteredOrderBookers = filters?.orderBookerIds?.length
      ? orderBookers.filter(ob => filters.orderBookerIds!.includes(ob.id))
      : orderBookers;

    const totalOrderBookers = filteredOrderBookers.length;
    const activeOrderBookers = filteredOrderBookers.filter(ob => ob.isActive).length;
    const inactiveOrderBookers = totalOrderBookers - activeOrderBookers;

    // Get current month data
    const currentMonthEntries = await dailyEntryService.getByMonth(currentYear, currentMonth);
    const filteredCurrentEntries = filters?.orderBookerIds?.length
      ? currentMonthEntries.filter(entry => filters.orderBookerIds!.includes(entry.orderBookerId))
      : currentMonthEntries;

    // Get previous month data for comparison
    const previousMonthEntries = await dailyEntryService.getByMonth(previousYear, previousMonth);
    const filteredPreviousEntries = filters?.orderBookerIds?.length
      ? previousMonthEntries.filter(entry => filters.orderBookerIds!.includes(entry.orderBookerId))
      : previousMonthEntries;

    // Calculate current month totals
    const currentMonthSales = filteredCurrentEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const currentMonthReturns = filteredCurrentEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const currentMonthNetSales = filteredCurrentEntries.reduce((sum, entry) => sum + entry.netSales, 0);
    const currentMonthCartons = filteredCurrentEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
    const currentMonthReturnCartons = filteredCurrentEntries.reduce((sum, entry) => sum + entry.returnCarton, 0);
    const currentMonthNetCartons = currentMonthCartons - currentMonthReturnCartons;

    // Calculate previous month totals
    const previousMonthSales = filteredPreviousEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const previousMonthReturns = filteredPreviousEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const previousMonthNetSales = filteredPreviousEntries.reduce((sum, entry) => sum + entry.netSales, 0);

    // Calculate growth percentages
    const salesGrowth = previousMonthSales > 0 
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 
      : 0;
    const returnsGrowth = previousMonthReturns > 0 
      ? ((currentMonthReturns - previousMonthReturns) / previousMonthReturns) * 100 
      : 0;
    const netSalesGrowth = previousMonthNetSales > 0 
      ? ((currentMonthNetSales - previousMonthNetSales) / previousMonthNetSales) * 100 
      : 0;

    // Get monthly targets for current month
    const monthlyTargets = await monthlyTargetService.getByMonth(currentYear, currentMonth);
    const filteredTargets = filters?.orderBookerIds?.length
      ? monthlyTargets.filter(target => filters.orderBookerIds!.includes(target.orderBookerId))
      : monthlyTargets;

    const totalTarget = filteredTargets.reduce((sum, target) => sum + target.targetAmount, 0);
    const totalAchieved = filteredTargets.reduce((sum, target) => sum + target.achievedAmount, 0);
    const totalRemaining = totalTarget - totalAchieved;
    const achievementPercentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

    const onTrackCount = filteredTargets.filter(target => target.achievementPercentage >= 80).length;
    const exceededCount = filteredTargets.filter(target => target.achievementPercentage >= 100).length;
    const behindCount = filteredTargets.filter(target => target.achievementPercentage < 80).length;

    // Get top performers (order bookers with highest sales)
    const orderBookerSales = new Map<string, number>();
    const orderBookerReturns = new Map<string, number>();
    const orderBookerCartons = new Map<string, number>();

    filteredCurrentEntries.forEach(entry => {
      const currentSales = orderBookerSales.get(entry.orderBookerId) || 0;
      const currentReturns = orderBookerReturns.get(entry.orderBookerId) || 0;
      const currentCartons = orderBookerCartons.get(entry.orderBookerId) || 0;

      orderBookerSales.set(entry.orderBookerId, currentSales + entry.sales);
      orderBookerReturns.set(entry.orderBookerId, currentReturns + entry.returns);
      orderBookerCartons.set(entry.orderBookerId, currentCartons + entry.totalCarton);
    });

    const topPerformers = Array.from(orderBookerSales.entries())
      .map(([orderBookerId, sales]) => {
        const orderBooker = filteredOrderBookers.find(ob => ob.id === orderBookerId);
        const returns = orderBookerReturns.get(orderBookerId) || 0;
        const cartons = orderBookerCartons.get(orderBookerId) || 0;
        const target = filteredTargets.find(t => t.orderBookerId === orderBookerId);
        const achievementPercentage = target ? target.achievementPercentage : 0;

        return {
          id: orderBookerId,
          name: orderBooker?.name || '',
          nameUrdu: orderBooker?.nameUrdu || '',
          sales,
          returns,
          netSales: sales - returns,
          cartons,
          achievementPercentage,
        };
      })
      .sort((a, b) => b.netSales - a.netSales)
      .slice(0, 5);

    // Get recent activities (last 10 daily entries)
    const recentEntries = await dailyEntryService.getAll({
      orderBookerIds: filters?.orderBookerIds,
      dateRange: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
      },
    });

    const recentActivities = recentEntries
      .slice(0, 10)
      .map(entry => {
        const orderBooker = filteredOrderBookers.find(ob => ob.id === entry.orderBookerId);
        const activityType: 'sale' | 'return' | 'target-set' | 'order-booker-added' = entry.returns > 0 ? 'return' : 'sale';
        
        return {
          id: entry.id,
          type: activityType,
          description: entry.returns > 0 
            ? `${orderBooker?.name || 'Unknown'} returned ${entry.returns} worth of products`
            : `${orderBooker?.name || 'Unknown'} made sales of ${entry.sales}`,
          timestamp: entry.createdAt,
          orderBookerId: entry.orderBookerId,
          orderBookerName: orderBooker?.name,
          amount: entry.netSales,
          cartons: entry.totalCarton,
        };
      });

    // Generate sales trends for the last 30 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const trendEntries = await dailyEntryService.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const filteredTrendEntries = filters?.orderBookerIds?.length
      ? trendEntries.filter(entry => filters.orderBookerIds!.includes(entry.orderBookerId))
      : trendEntries;

    // Group by date
    const salesByDate = new Map<string, { sales: number; returns: number; cartons: number; activeBookers: Set<string> }>();
    
    filteredTrendEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      const current = salesByDate.get(dateKey) || { sales: 0, returns: 0, cartons: 0, activeBookers: new Set() };
      
      current.sales += entry.sales;
      current.returns += entry.returns;
      current.cartons += entry.totalCarton;
      current.activeBookers.add(entry.orderBookerId);
      
      salesByDate.set(dateKey, current);
    });

    const salesTrends = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        sales: data.sales,
        returns: data.returns,
        netSales: data.sales - data.returns,
        cartons: data.cartons,
        activeOrderBookers: data.activeBookers.size,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Generate simple alerts
    const alerts = [];
    
    // Check for order bookers with low achievement
    filteredTargets.forEach(target => {
      if (target.achievementPercentage < 50) {
        const orderBooker = filteredOrderBookers.find(ob => ob.id === target.orderBookerId);
        alerts.push({
          id: `low-achievement-${target.orderBookerId}`,
          type: 'warning' as const,
          title: 'Low Achievement',
          message: `${orderBooker?.name || 'Order Booker'} has achieved only ${target.achievementPercentage.toFixed(1)}% of their target`,
          timestamp: new Date(),
          priority: 'medium' as const,
          dismissed: false,
        });
      }
    });

    // Check for inactive order bookers
    const inactiveCount = filteredOrderBookers.filter(ob => !ob.isActive).length;
    if (inactiveCount > 0) {
      alerts.push({
        id: 'inactive-order-bookers',
        type: 'info' as const,
        title: 'Inactive Order Bookers',
        message: `${inactiveCount} order bookers are currently inactive`,
        timestamp: new Date(),
        priority: 'low' as const,
        dismissed: false,
      });
    }

    return {
      totalOrderBookers,
      activeOrderBookers,
      inactiveOrderBookers,
      totalSales: currentMonthSales,
      totalReturns: currentMonthReturns,
      netSales: currentMonthNetSales,
      totalCartons: currentMonthCartons,
      returnCartons: currentMonthReturnCartons,
      netCartons: currentMonthNetCartons,
      currentMonthSales,
      currentMonthReturns,
      currentMonthNetSales,
      previousMonthSales,
      previousMonthReturns,
      previousMonthNetSales,
      salesGrowth,
      returnsGrowth,
      netSalesGrowth,
      topPerformers,
      recentActivities,
      monthlyTargets: {
        totalTarget,
        totalAchieved,
        totalRemaining,
        achievementPercentage,
        onTrackCount,
        behindCount,
        exceededCount,
      },
      salesTrends,
      alerts,
    };
  },

  refreshDashboard: async () => {
    
    return Promise.resolve();
  },
};

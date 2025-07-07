import { orderBookerService } from '../../order-bookers/api/service';
import { dailyEntryService } from '../../daily-entries/api/service';
import { monthlyTargetService } from '../../monthly-targets/api/service';
import type { 
  PerformanceData, 
  ReportFilters, 
  DailyReportData, 
  MonthlyReportData, 
  ComparisonReportData, 
  ReportAnalytics, 
  ReportDashboard,
  ReportExportOptions 
} from '../types';

export interface IReportsService {
  getPerformanceReport(filters?: ReportFilters): Promise<PerformanceData[]>;
  getDailyReport(filters?: ReportFilters): Promise<DailyReportData[]>;
  getMonthlyReport(filters?: ReportFilters): Promise<MonthlyReportData[]>;
  getComparisonReport(filters?: ReportFilters): Promise<ComparisonReportData>;
  getReportAnalytics(filters?: ReportFilters): Promise<ReportAnalytics>;
  getReportDashboard(filters?: ReportFilters): Promise<ReportDashboard>;
  exportReport(data: any[], options: ReportExportOptions): Promise<string>;
  getReportTemplate(type: 'performance' | 'target-achievement' | 'daily-summary' | 'monthly-overview'): Promise<any>;
}

export const reportsService: IReportsService = {
  getPerformanceReport: async (filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get date range
    const startDate = filters?.dateRange?.[0] || new Date(currentYear, currentMonth - 1, 1);
    const endDate = filters?.dateRange?.[1] || new Date(currentYear, currentMonth, 0);

    // Get all order bookers
    const orderBookers = await orderBookerService.getAll();
    const filteredOrderBookers = filters?.orderBookerIds?.length
      ? orderBookers.filter(ob => filters.orderBookerIds!.includes(ob.id))
      : orderBookers;

    // Get daily entries for the period
    const dailyEntries = await dailyEntryService.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Get monthly targets
    const monthlyTargets = await monthlyTargetService.getByMonth(currentYear, currentMonth);

    // Calculate performance for each order booker
    const performanceData: PerformanceData[] = filteredOrderBookers.map(orderBooker => {
      const obEntries = dailyEntries.filter(entry => entry.orderBookerId === orderBooker.id);
      const obTarget = monthlyTargets.find(target => target.orderBookerId === orderBooker.id);

      const totalSales = obEntries.reduce((sum, entry) => sum + entry.sales, 0);
      const totalReturns = obEntries.reduce((sum, entry) => sum + entry.returns, 0);
      const netSales = totalSales - totalReturns;
      const totalCarton = obEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
      const returnCarton = obEntries.reduce((sum, entry) => sum + entry.returnCarton, 0);
      const netCarton = totalCarton - returnCarton;

      const targetAmount = obTarget?.targetAmount || 0;
      const achievementPercentage = targetAmount > 0 ? (netSales / targetAmount) * 100 : 0;

      // Calculate performance metrics
      const totalDaysWithSales = obEntries.filter(entry => entry.sales > 0).length;
      const lastSaleDate = obEntries.length > 0 ? new Date(Math.max(...obEntries.map(e => e.date.getTime()))) : undefined;
      const averageDailySales = totalDaysWithSales > 0 ? netSales / totalDaysWithSales : 0;

      const totalDaysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysWorked = obEntries.length;
      const daysInactive = totalDaysInPeriod - daysWorked;

      // Calculate performance status
      let status: PerformanceData['status'] = 'poor';
      if (achievementPercentage >= 100) status = 'excellent';
      else if (achievementPercentage >= 80) status = 'good';
      else if (achievementPercentage >= 60) status = 'average';
      else if (achievementPercentage >= 40) status = 'below-average';

      // Calculate growth (simplified - comparing first half vs second half of period)
      const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
      const firstHalfEntries = obEntries.filter(entry => entry.date < midPoint);
      const secondHalfEntries = obEntries.filter(entry => entry.date >= midPoint);
      
      const firstHalfSales = firstHalfEntries.reduce((sum, entry) => sum + entry.netSales, 0);
      const secondHalfSales = secondHalfEntries.reduce((sum, entry) => sum + entry.netSales, 0);
      const salesGrowth = firstHalfSales > 0 ? ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100 : 0;

      // Calculate consistency (coefficient of variation)
      const dailySales = obEntries.map(entry => entry.netSales);
      const avgDaily = dailySales.reduce((sum, val) => sum + val, 0) / dailySales.length;
      const variance = dailySales.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / dailySales.length;
      const stdDev = Math.sqrt(variance);
      const consistency = avgDaily > 0 ? (1 - (stdDev / avgDaily)) * 100 : 0;

      // Calculate efficiency (sales per day worked)
      const efficiency = daysWorked > 0 ? netSales / daysWorked : 0;

      return {
        orderBooker: {
          id: orderBooker.id,
          name: orderBooker.name,
          nameUrdu: orderBooker.nameUrdu,
          phone: orderBooker.phone,
          email: orderBooker.email,
          joinDate: orderBooker.joinDate,
          isActive: orderBooker.isActive,
          createdAt: orderBooker.createdAt,
          updatedAt: orderBooker.updatedAt,
          currentMonthTarget: obTarget?.targetAmount,
          currentMonthAchieved: obTarget?.achievedAmount,
          currentMonthRemaining: obTarget?.remainingAmount,
          currentMonthAchievementPercentage: obTarget?.achievementPercentage,
        },
        totalSales,
        totalReturns,
        netSales,
        totalCarton,
        returnCarton,
        netCarton,
        achievementPercentage,
        status,
        rank: 0, // Will be calculated after sorting
        totalDaysWithSales,
        lastSaleDate,
        averageDailySales,
        daysWorked,
        daysInactive,
        performance: {
          salesGrowth,
          consistency: Math.max(0, consistency),
          efficiency,
        },
      };
    });

    // Sort by net sales and assign ranks
    performanceData.sort((a, b) => b.netSales - a.netSales);
    performanceData.forEach((item, index) => {
      item.rank = index + 1;
    });

    return performanceData;
  },

  getDailyReport: async (filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get date range
    const startDate = filters?.dateRange?.[0] || new Date(currentYear, currentMonth - 1, 1);
    const endDate = filters?.dateRange?.[1] || new Date(currentYear, currentMonth, 0);

    // Get daily entries for the period
    const dailyEntries = await dailyEntryService.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Get order bookers for names
    const orderBookers = await orderBookerService.getAll();
    const orderBookerMap = new Map(orderBookers.map(ob => [ob.id, ob]));

    // Group entries by date
    const dailyData = new Map<string, DailyReportData>();

    dailyEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: entry.date,
          totalSales: 0,
          totalReturns: 0,
          netSales: 0,
          totalCarton: 0,
          returnCarton: 0,
          netCarton: 0,
          activeOrderBookers: 0,
          avgSalesPerOrderBooker: 0,
          topPerformer: { name: '', sales: 0 },
          lowestPerformer: { name: '', sales: Number.MAX_VALUE },
        });
      }

      const dayData = dailyData.get(dateKey)!;
      dayData.totalSales += entry.sales;
      dayData.totalReturns += entry.returns;
      dayData.netSales += entry.netSales;
      dayData.totalCarton += entry.totalCarton;
      dayData.returnCarton += entry.returnCarton;
      dayData.netCarton += (entry.totalCarton - entry.returnCarton);

      // Track performers
      const orderBooker = orderBookerMap.get(entry.orderBookerId);
      if (orderBooker) {
        if (entry.netSales > dayData.topPerformer.sales) {
          dayData.topPerformer = { name: orderBooker.name, sales: entry.netSales };
        }
        if (entry.netSales < dayData.lowestPerformer.sales) {
          dayData.lowestPerformer = { name: orderBooker.name, sales: entry.netSales };
        }
      }
    });

    // Calculate active order bookers and averages for each day
    const result: DailyReportData[] = [];
    for (const [dateKey, dayData] of dailyData) {
      const dayEntries = dailyEntries.filter(entry => entry.date.toISOString().split('T')[0] === dateKey);
      const uniqueOrderBookers = new Set(dayEntries.map(entry => entry.orderBookerId));
      
      dayData.activeOrderBookers = uniqueOrderBookers.size;
      dayData.avgSalesPerOrderBooker = dayData.activeOrderBookers > 0 ? dayData.netSales / dayData.activeOrderBookers : 0;
      
      // Fix lowest performer if no valid minimum was found
      if (dayData.lowestPerformer.sales === Number.MAX_VALUE) {
        dayData.lowestPerformer = { name: '', sales: 0 };
      }

      result.push(dayData);
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  getMonthlyReport: async (filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get date range or default to current month
    const startDate = filters?.dateRange?.[0] || new Date(currentYear, currentMonth - 1, 1);
    const endDate = filters?.dateRange?.[1] || new Date(currentYear, currentMonth, 0);

    // Get monthly data
    const monthlyEntries = await dailyEntryService.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const monthlyTargets = await monthlyTargetService.getByMonth(currentYear, currentMonth);
    const orderBookers = await orderBookerService.getAll();

    // Calculate monthly aggregates
    const totalSales = monthlyEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const totalReturns = monthlyEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const netSales = totalSales - totalReturns;
    const totalCarton = monthlyEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
    const returnCarton = monthlyEntries.reduce((sum, entry) => sum + entry.returnCarton, 0);
    const netCarton = totalCarton - returnCarton;

    const totalTarget = monthlyTargets.reduce((sum, target) => sum + target.targetAmount, 0);
    const targetAchievement = monthlyTargets.reduce((sum, target) => sum + target.achievedAmount, 0);
    const targetAchievementPercentage = totalTarget > 0 ? (targetAchievement / totalTarget) * 100 : 0;

    // Get unique active order bookers
    const activeOrderBookers = new Set(monthlyEntries.map(entry => entry.orderBookerId)).size;
    const avgSalesPerOrderBooker = activeOrderBookers > 0 ? netSales / activeOrderBookers : 0;

    // Get top performers
    const performerMap = new Map<string, { sales: number; achievement: number }>();
    monthlyEntries.forEach(entry => {
      const current = performerMap.get(entry.orderBookerId) || { sales: 0, achievement: 0 };
      current.sales += entry.netSales;
      performerMap.set(entry.orderBookerId, current);
    });

    // Add achievement data
    monthlyTargets.forEach(target => {
      const current = performerMap.get(target.orderBookerId);
      if (current) {
        current.achievement = target.achievementPercentage;
      }
    });

    const topPerformers = Array.from(performerMap.entries())
      .map(([orderBookerId, data]) => {
        const orderBooker = orderBookers.find(ob => ob.id === orderBookerId);
        return {
          name: orderBooker?.name || 'Unknown',
          sales: data.sales,
          achievement: data.achievement,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Calculate growth rate (simplified - compare with previous month)
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonthEntries = await dailyEntryService.getByMonth(previousYear, previousMonth);
    const previousMonthSales = previousMonthEntries.reduce((sum, entry) => sum + entry.netSales, 0);
    const growthRate = previousMonthSales > 0 ? ((netSales - previousMonthSales) / previousMonthSales) * 100 : 0;

    // Calculate consistency score (based on daily variance)
    const dailySales = new Map<string, number>();
    monthlyEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      const current = dailySales.get(dateKey) || 0;
      dailySales.set(dateKey, current + entry.netSales);
    });

    const dailyValues = Array.from(dailySales.values());
    const avgDaily = dailyValues.reduce((sum, val) => sum + val, 0) / dailyValues.length;
    const variance = dailyValues.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / dailyValues.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = avgDaily > 0 ? Math.max(0, (1 - (stdDev / avgDaily)) * 100) : 0;

    return [{
      month: startDate,
      totalSales,
      totalReturns,
      netSales,
      totalCarton,
      returnCarton,
      netCarton,
      totalTarget,
      targetAchievement,
      targetAchievementPercentage,
      activeOrderBookers,
      avgSalesPerOrderBooker,
      topPerformers,
      growthRate,
      consistencyScore,
    }];
  },

  getComparisonReport: async (_filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get current month data
    const currentMonthEntries = await dailyEntryService.getByMonth(currentYear, currentMonth);
    const currentMonthTargets = await monthlyTargetService.getByMonth(currentYear, currentMonth);

    // Get previous month data
    const previousMonthEntries = await dailyEntryService.getByMonth(previousYear, previousMonth);
    const previousMonthTargets = await monthlyTargetService.getByMonth(previousYear, previousMonth);

    // Calculate current month metrics
    const currentSales = currentMonthEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const currentReturns = currentMonthEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const currentNetSales = currentSales - currentReturns;
    const currentCarton = currentMonthEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
    const currentTarget = currentMonthTargets.reduce((sum, target) => sum + target.targetAmount, 0);
    const currentAchievement = currentTarget > 0 ? (currentNetSales / currentTarget) * 100 : 0;

    // Calculate previous month metrics
    const previousSales = previousMonthEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const previousReturns = previousMonthEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const previousNetSales = previousSales - previousReturns;
    const previousCarton = previousMonthEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
    const previousTarget = previousMonthTargets.reduce((sum, target) => sum + target.targetAmount, 0);
    const previousAchievement = previousTarget > 0 ? (previousNetSales / previousTarget) * 100 : 0;

    // Calculate growth
    const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;
    const returnsGrowth = previousReturns > 0 ? ((currentReturns - previousReturns) / previousReturns) * 100 : 0;
    const netSalesGrowth = previousNetSales > 0 ? ((currentNetSales - previousNetSales) / previousNetSales) * 100 : 0;
    const cartonGrowth = previousCarton > 0 ? ((currentCarton - previousCarton) / previousCarton) * 100 : 0;
    const achievementGrowth = previousAchievement > 0 ? ((currentAchievement - previousAchievement) / previousAchievement) * 100 : 0;

    // Determine trends
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (netSalesGrowth > 5) direction = 'up';
    else if (netSalesGrowth < -5) direction = 'down';

    const insights = [];
    if (salesGrowth > 10) insights.push('Strong sales growth this month');
    if (returnsGrowth > 20) insights.push('Returns have increased significantly');
    if (currentAchievement > 90) insights.push('Target achievement is excellent');
    if (currentAchievement < 50) insights.push('Target achievement needs improvement');

    return {
      current: {
        period: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        sales: currentSales,
        returns: currentReturns,
        netSales: currentNetSales,
        carton: currentCarton,
        achievementPercentage: currentAchievement,
      },
      previous: {
        period: `${previousYear}-${String(previousMonth).padStart(2, '0')}`,
        sales: previousSales,
        returns: previousReturns,
        netSales: previousNetSales,
        carton: previousCarton,
        achievementPercentage: previousAchievement,
      },
      growth: {
        sales: salesGrowth,
        returns: returnsGrowth,
        netSales: netSalesGrowth,
        carton: cartonGrowth,
        achievement: achievementGrowth,
      },
      trends: {
        direction,
        confidence: Math.min(100, Math.abs(netSalesGrowth) * 2), // Simple confidence calculation
        insights,
      },
    };
  },

  getReportAnalytics: async (filters) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get date range
    const startDate = filters?.dateRange?.[0] || new Date(currentYear, currentMonth - 1, 1);
    const endDate = filters?.dateRange?.[1] || new Date(currentYear, currentMonth, 0);

    // Get data
    const dailyEntries = await dailyEntryService.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    const orderBookers = await orderBookerService.getAll();

    // Calculate analytics
    const totalRevenue = dailyEntries.reduce((sum, entry) => sum + entry.sales, 0);
    const totalReturns = dailyEntries.reduce((sum, entry) => sum + entry.returns, 0);
    const netRevenue = totalRevenue - totalReturns;
    const totalCartons = dailyEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
    const returnCartons = dailyEntries.reduce((sum, entry) => sum + entry.returnCarton, 0);
    const netCartons = totalCartons - returnCartons;

    const orderBookerCount = orderBookers.length;
    const activeOrderBookerCount = new Set(dailyEntries.map(entry => entry.orderBookerId)).size;
    const avgRevenuePerOrderBooker = activeOrderBookerCount > 0 ? netRevenue / activeOrderBookerCount : 0;
    const avgCartonsPerOrderBooker = activeOrderBookerCount > 0 ? netCartons / activeOrderBookerCount : 0;

    // Get top and low performers
    const performerMap = new Map<string, number>();
    dailyEntries.forEach(entry => {
      const current = performerMap.get(entry.orderBookerId) || 0;
      performerMap.set(entry.orderBookerId, current + entry.netSales);
    });

    const revenues = Array.from(performerMap.values());
    const topPerformerRevenue = revenues.length > 0 ? Math.max(...revenues) : 0;
    const lowPerformerRevenue = revenues.length > 0 ? Math.min(...revenues) : 0;

    // Calculate metrics
    const returnRate = totalRevenue > 0 ? (totalReturns / totalRevenue) * 100 : 0;
    const efficiency = totalCartons > 0 ? (netRevenue / totalCartons) : 0;

    // Simple calculations for complex metrics
    const consistencyScore = 75; // Placeholder - would need more complex calculation
    const growthRate = 5; // Placeholder - would need historical data
    const marketPenetration = 60; // Placeholder - would need market data
    const customerSatisfaction = 85; // Placeholder - would need customer data

    return {
      totalRevenue,
      totalReturns,
      netRevenue,
      totalCartons,
      returnCartons,
      netCartons,
      orderBookerCount,
      activeOrderBookerCount,
      avgRevenuePerOrderBooker,
      avgCartonsPerOrderBooker,
      topPerformerRevenue,
      lowPerformerRevenue,
      consistencyScore,
      growthRate,
      returnRate,
      efficiency,
      marketPenetration,
      customerSatisfaction,
    };
  },

  getReportDashboard: async (filters) => {
    const analytics = await reportsService.getReportAnalytics(filters);
    const performanceData = await reportsService.getPerformanceReport(filters);

    return {
      title: 'Business Intelligence Dashboard',
      subtitle: 'Comprehensive business performance overview',
      period: new Date().toLocaleDateString(),
      lastUpdated: new Date(),
      analytics,
      charts: [
        {
          type: 'bar' as const,
          title: 'Sales Performance',
          data: performanceData.slice(0, 10).map(p => ({
            x: p.orderBooker.name,
            y: p.netSales,
            label: p.orderBooker.name,
          })),
          xAxis: 'Order Booker',
          yAxis: 'Net Sales',
        },
      ],
      tables: [
        {
          title: 'Top Performers',
          data: performanceData.slice(0, 5),
          columns: [
            { title: 'Name', dataIndex: ['orderBooker', 'name'] },
            { title: 'Net Sales', dataIndex: 'netSales' },
            { title: 'Achievement %', dataIndex: 'achievementPercentage' },
          ],
        },
      ],
      alerts: [
        {
          type: 'warning' as const,
          message: 'High Return Rate',
          description: analytics.returnRate > 15 ? 'Return rate is above threshold' : undefined,
        },
      ].filter(alert => alert.description),
      recommendations: [
        {
          title: 'Optimize Low Performers',
          description: 'Focus on training and support for underperforming order bookers',
          priority: 'high' as const,
          actionable: true,
        },
      ],
    };
  },

  exportReport: async (_data, options) => {
    // For now, return a placeholder
    // In a real implementation, this would generate the actual file
    return `report_${Date.now()}.${options.format}`;
  },

  getReportTemplate: async (type) => {
    // Return a basic template structure
    return {
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      sections: ['summary', 'details', 'charts'],
      format: 'standard',
    };
  },
};

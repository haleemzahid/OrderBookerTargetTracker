import { useOrderBookers } from './useOrderBookers';
import { useMonthlyAnalytics } from './useAnalytics';
import { useMemo } from 'react';

export interface DashboardStats {
  totalOrderBookers: number;
  activeOrderBookers: number;
  thisMonthSales: number;
  thisMonthReturns: number;
  thisMonthNetSales: number;
  thisMonthCarton: number;
  thisMonthReturnCarton: number;
  thisMonthNetCarton: number;
  targetAchievement: number;
  topPerformers: Array<{
    orderBookerId: string;
    name: string;
    sales: number;
    achievementPercentage: number;
  }>;
  needsAttention: Array<{
    orderBookerId: string;
    name: string;
    sales: number;
    achievementPercentage: number;
  }>;
}

export const useDashboard = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Get all order bookers
  const { data: orderBookers = [], isLoading: isLoadingOrderBookers } = useOrderBookers();

  // Get monthly analytics for current month
  const { data: monthlyAnalytics, isLoading: isLoadingAnalytics } = useMonthlyAnalytics(currentYear, currentMonth);

  const dashboardStats = useMemo<DashboardStats>(() => {
    const totalOrderBookers = orderBookers.length;
    const activeOrderBookers = orderBookers.filter(ob => ob.isActive).length;

    if (!monthlyAnalytics) {
      return {
        totalOrderBookers,
        activeOrderBookers,
        thisMonthSales: 0,
        thisMonthReturns: 0,
        thisMonthNetSales: 0,
        thisMonthCarton: 0,
        thisMonthReturnCarton: 0,
        thisMonthNetCarton: 0,
        targetAchievement: 0,
        topPerformers: [],
        needsAttention: [],
      };
    }

    const targetAchievement = monthlyAnalytics.averageAchievementPercentage;

    return {
      totalOrderBookers,
      activeOrderBookers,
      thisMonthSales: monthlyAnalytics.totalSales,
      thisMonthReturns: monthlyAnalytics.totalReturns,
      thisMonthNetSales: monthlyAnalytics.totalNetSales,
      thisMonthCarton: monthlyAnalytics.totalCarton,
      thisMonthReturnCarton: monthlyAnalytics.totalReturnCarton,
      thisMonthNetCarton: monthlyAnalytics.totalNetCarton,
      targetAchievement,
      topPerformers: monthlyAnalytics.topPerformers.slice(0, 5),
      needsAttention: monthlyAnalytics.underPerformers.slice(0, 5),
    };
  }, [orderBookers, monthlyAnalytics]);

  return {
    data: dashboardStats,
    isLoading: isLoadingOrderBookers || isLoadingAnalytics,
    error: null,
  };
};

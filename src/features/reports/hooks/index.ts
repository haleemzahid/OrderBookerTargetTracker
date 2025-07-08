import { useState, useMemo } from 'react';
import { usePerformanceReport, useDailyReport, useMonthlyReport } from '../api/queries';
import { useExportReport, useRefreshReports } from '../api/mutations';
import type { ReportFilters } from '../types';
import { format } from 'date-fns';

export const useReportFilters = (initialFilters?: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters || {});

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    setFilters,
  };
};

export const usePerformanceAnalysis = (filters?: ReportFilters) => {
  const { data: performanceData, isLoading, error } = usePerformanceReport(filters);

  const analysis = useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return null;
    }

    const totalSales = performanceData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalReturns = performanceData.reduce((sum, item) => sum + item.totalReturns, 0);
    const totalNetSales = performanceData.reduce((sum, item) => sum + item.netSales, 0);
    const totalCartons = performanceData.reduce((sum, item) => sum + item.totalCarton, 0);
    const totalReturnCartons = performanceData.reduce((sum, item) => sum + item.returnCarton, 0);

    const topPerformer = performanceData.reduce((max, item) => 
      item.netSales > max.netSales ? item : max
    );

    const lowPerformer = performanceData.reduce((min, item) => 
      item.netSales < min.netSales ? item : min
    );

    const avgSales = totalSales / performanceData.length;
    const avgNetSales = totalNetSales / performanceData.length;
    const returnRate = totalReturns / totalSales * 100;
    const netCartonRate = (totalCartons - totalReturnCartons) / totalCartons * 100;

    return {
      totalSales,
      totalReturns,
      totalNetSales,
      totalCartons,
      totalReturnCartons,
      avgSales,
      avgNetSales,
      returnRate,
      netCartonRate,
      topPerformer,
      lowPerformer,
      performerCount: performanceData.length,
    };
  }, [performanceData]);

  return {
    performanceData,
    analysis,
    isLoading,
    error,
  };
};

export const useDailyTrends = (filters?: ReportFilters) => {
  const { data: dailyData, isLoading, error } = useDailyReport(filters);

  const trends = useMemo(() => {
    if (!dailyData || dailyData.length === 0) {
      return null;
    }

    const sortedData = [...dailyData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const salesTrend = sortedData.map(item => ({
      date: format(new Date(item.date), 'yyyy-MM-dd'),
      sales: item.totalSales,
      netSales: item.netSales,
      returns: item.totalReturns,
      cartons: item.totalCarton,
    }));

    const avgDailySales = sortedData.reduce((sum, item) => sum + item.totalSales, 0) / sortedData.length;
    const avgDailyReturns = sortedData.reduce((sum, item) => sum + item.totalReturns, 0) / sortedData.length;
    const avgDailyCartons = sortedData.reduce((sum, item) => sum + item.totalCarton, 0) / sortedData.length;

    // Calculate growth rate (last 7 days vs previous 7 days)
    const recentDays = sortedData.slice(-7);
    const previousDays = sortedData.slice(-14, -7);
    
    const recentAvg = recentDays.length > 0 ? 
      recentDays.reduce((sum, item) => sum + item.totalSales, 0) / recentDays.length : 0;
    const previousAvg = previousDays.length > 0 ? 
      previousDays.reduce((sum, item) => sum + item.totalSales, 0) / previousDays.length : 0;
    
    const growthRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      salesTrend,
      avgDailySales,
      avgDailyReturns,
      avgDailyCartons,
      growthRate,
      totalDays: sortedData.length,
      bestDay: sortedData.reduce((max, item) => item.totalSales > max.totalSales ? item : max),
      worstDay: sortedData.reduce((min, item) => item.totalSales < min.totalSales ? item : min),
    };
  }, [dailyData]);

  return {
    dailyData,
    trends,
    isLoading,
    error,
  };
};

export const useMonthlyComparison = (filters?: ReportFilters) => {
  const { data: monthlyData, isLoading, error } = useMonthlyReport(filters);

  const comparison = useMemo(() => {
    if (!monthlyData || monthlyData.length < 2) {
      return null;
    }

    const sortedData = [...monthlyData].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    const currentMonth = sortedData[sortedData.length - 1];
    const previousMonth = sortedData[sortedData.length - 2];

    const salesGrowth = ((currentMonth.totalSales - previousMonth.totalSales) / previousMonth.totalSales) * 100;
    const returnsGrowth = ((currentMonth.totalReturns - previousMonth.totalReturns) / previousMonth.totalReturns) * 100;
    const cartonGrowth = ((currentMonth.totalCarton - previousMonth.totalCarton) / previousMonth.totalCarton) * 100;
    const targetGrowth = ((currentMonth.targetAchievementPercentage - previousMonth.targetAchievementPercentage));

    return {
      currentMonth,
      previousMonth,
      growth: {
        sales: salesGrowth,
        returns: returnsGrowth,
        cartons: cartonGrowth,
        targetAchievement: targetGrowth,
      },
      monthlyTrend: sortedData.map(item => ({
        month: format(new Date(item.month), 'yyyy-MM'),
        sales: item.totalSales,
        returns: item.totalReturns,
        netSales: item.netSales,
        cartons: item.totalCarton,
        targetAchievement: item.targetAchievementPercentage,
      })),
    };
  }, [monthlyData]);

  return {
    monthlyData,
    comparison,
    isLoading,
    error,
  };
};

export const useReportExport = () => {
  const exportMutation = useExportReport();
  const refreshMutation = useRefreshReports();

  const exportReport = (data: any[], options: any) => {
    exportMutation.mutate({ data, options });
  };

  const refreshReports = () => {
    refreshMutation.mutate();
  };

  return {
    exportReport,
    refreshReports,
    isExporting: exportMutation.isPending,
    isRefreshing: refreshMutation.isPending,
    exportError: exportMutation.error,
    refreshError: refreshMutation.error,
  };
};

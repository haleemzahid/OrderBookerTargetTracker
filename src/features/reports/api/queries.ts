import { useQuery } from '@tanstack/react-query';
import { reportsService } from './service';
import { reportQueryKeys } from './keys';
import type { ReportFilters } from '../types';

export const usePerformanceReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.performanceFiltered(filters),
    queryFn: () => reportsService.getPerformanceReport(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useDailyReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.dailyFiltered(filters),
    queryFn: () => reportsService.getDailyReport(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useMonthlyReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.monthlyFiltered(filters),
    queryFn: () => reportsService.getMonthlyReport(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes for monthly data
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useComparisonReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.comparisonFiltered(filters),
    queryFn: () => reportsService.getComparisonReport(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useReportAnalytics = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.analyticsFiltered(filters),
    queryFn: () => reportsService.getReportAnalytics(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useReportDashboard = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: reportQueryKeys.reports.dashboardFiltered(filters),
    queryFn: () => reportsService.getReportDashboard(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useReportTemplate = (type: 'performance' | 'target-achievement' | 'daily-summary' | 'monthly-overview') => {
  return useQuery({
    queryKey: reportQueryKeys.reports.template(type),
    queryFn: () => reportsService.getReportTemplate(type),
    staleTime: 30 * 60 * 1000, // 30 minutes for templates
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

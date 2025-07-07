import type { ReportFilters } from '../types';

export const reportQueryKeys = {
  reports: {
    all: ['reports'] as const,
    performance: () => [...reportQueryKeys.reports.all, 'performance'] as const,
    performanceFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.performance(), filters] as const,
    daily: () => [...reportQueryKeys.reports.all, 'daily'] as const,
    dailyFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.daily(), filters] as const,
    monthly: () => [...reportQueryKeys.reports.all, 'monthly'] as const,
    monthlyFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.monthly(), filters] as const,
    comparison: () => [...reportQueryKeys.reports.all, 'comparison'] as const,
    comparisonFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.comparison(), filters] as const,
    analytics: () => [...reportQueryKeys.reports.all, 'analytics'] as const,
    analyticsFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.analytics(), filters] as const,
    dashboard: () => [...reportQueryKeys.reports.all, 'dashboard'] as const,
    dashboardFiltered: (filters?: ReportFilters) => [...reportQueryKeys.reports.dashboard(), filters] as const,
    templates: () => [...reportQueryKeys.reports.all, 'templates'] as const,
    template: (type: string) => [...reportQueryKeys.reports.templates(), type] as const,
  },
};

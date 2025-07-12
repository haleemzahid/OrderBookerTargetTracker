import type { DailySalesReportFilters } from '../types';

export const queryKeys = {
  dailySalesReport: {
    all: ['daily-sales-report'] as const,
    lists: () => [...queryKeys.dailySalesReport.all, 'list'] as const,
    list: (filters?: DailySalesReportFilters) => [...queryKeys.dailySalesReport.lists(), filters] as const,
    summaries: () => [...queryKeys.dailySalesReport.all, 'summary'] as const,
    summary: (filters?: DailySalesReportFilters) => [...queryKeys.dailySalesReport.summaries(), filters] as const,
  },
};

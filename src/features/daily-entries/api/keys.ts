import type { DailyEntryFilters } from '../types';

export const queryKeys = {
  dailyEntries: {
    all: ['daily-entries'] as const,
    lists: () => [...queryKeys.dailyEntries.all, 'list'] as const,
    list: (filters?: DailyEntryFilters) => [...queryKeys.dailyEntries.lists(), filters] as const,
    byMonth: (year: number, month: number) => [...queryKeys.dailyEntries.all, 'month', year, month] as const,
    byOrderBooker: (orderBookerId: string) => [...queryKeys.dailyEntries.all, 'orderBooker', orderBookerId] as const,
    byDateRange: (startDate: string, endDate: string) => [...queryKeys.dailyEntries.all, 'dateRange', startDate, endDate] as const,
    details: () => [...queryKeys.dailyEntries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.dailyEntries.details(), id] as const,
    withItems: (id: string) => [...queryKeys.dailyEntries.details(), id, 'withItems'] as const,
    analytics: () => [...queryKeys.dailyEntries.all, 'analytics'] as const,
    monthlyAnalytics: (year: number, month: number) => [...queryKeys.dailyEntries.analytics(), 'monthly', year, month] as const,
  },
};

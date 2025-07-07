import type { MonthlyTargetFilters } from '../types';

export const queryKeys = {
  monthlyTargets: {
    all: ['monthly-targets'] as const,
    lists: () => [...queryKeys.monthlyTargets.all, 'list'] as const,
    list: (filters?: MonthlyTargetFilters) => [...queryKeys.monthlyTargets.lists(), filters] as const,
    byMonth: (year: number, month: number) => [...queryKeys.monthlyTargets.all, 'month', year, month] as const,
    byOrderBooker: (orderBookerId: string) => [...queryKeys.monthlyTargets.all, 'orderBooker', orderBookerId] as const,
    details: () => [...queryKeys.monthlyTargets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.monthlyTargets.details(), id] as const,
  },
};

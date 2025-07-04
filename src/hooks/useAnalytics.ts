import { useQuery } from '@tanstack/react-query';
import { dailyEntryService } from '../services/api/dailyEntryService';
import { queryKeys } from './useOrderBookers';

export const useMonthlyAnalytics = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.monthlyAnalytics(year, month),
    queryFn: () => dailyEntryService.getMonthlyAnalytics(year, month),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

import { useQuery } from '@tanstack/react-query';
import { dailyEntryService } from './service';
import { queryKeys } from './keys';
import type { DailyEntryFilters } from '../types';

export const useDailyEntries = (filters?: DailyEntryFilters) => {
  return useQuery({
    queryKey: queryKeys.dailyEntries.list(filters),
    queryFn: () => dailyEntryService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDailyEntry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.dailyEntries.detail(id),
    queryFn: () => dailyEntryService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDailyEntriesByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.dailyEntries.byMonth(year, month),
    queryFn: () => dailyEntryService.getByMonth(year, month),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useDailyEntriesByOrderBooker = (orderBookerId: string, dateRange?: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: [...queryKeys.dailyEntries.byOrderBooker(orderBookerId), dateRange],
    queryFn: () => dailyEntryService.getByOrderBooker(orderBookerId, dateRange),
    enabled: !!orderBookerId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDailyEntriesByDateRange = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: queryKeys.dailyEntries.byDateRange(startDate || '', endDate || ''),
    queryFn: () => dailyEntryService.getByDateRange(startDate!, endDate!),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useMonthlyAnalytics = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month),
    queryFn: () => dailyEntryService.getMonthlyAnalytics(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

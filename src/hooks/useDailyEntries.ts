import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyEntryService } from '../services/api/dailyEntryService';
import { queryKeys } from './useOrderBookers';
import type { CreateDailyEntryRequest, UpdateDailyEntryRequest, DateRange } from '../types';

export const useDailyEntriesByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.dailyEntriesByMonth(year, month),
    queryFn: () => dailyEntryService.getByMonth(year, month),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDailyEntriesByOrderBooker = (orderBookerId: string, dateRange?: DateRange) => {
  return useQuery({
    queryKey: [...queryKeys.dailyEntriesByOrderBooker(orderBookerId), dateRange],
    queryFn: () => dailyEntryService.getByOrderBooker(orderBookerId, dateRange),
    enabled: !!orderBookerId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: CreateDailyEntryRequest) => dailyEntryService.create(entry),
    onSuccess: (newEntry) => {
      const entryDate = new Date(newEntry.date);
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntriesByMonth(entryDate.getFullYear(), entryDate.getMonth() + 1) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntriesByOrderBooker(newEntry.orderBookerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyAnalytics(entryDate.getFullYear(), entryDate.getMonth() + 1) 
      });
    },
    onError: (error) => {
      console.error('Failed to create daily entry:', error);
    },
  });
};

export const useBatchCreateDailyEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entries: CreateDailyEntryRequest[]) => dailyEntryService.batchCreate(entries),
    onSuccess: (newEntries) => {
      const months = new Set<string>();
      const orderBookerIds = new Set<string>();
      
      newEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        months.add(`${entryDate.getFullYear()}-${entryDate.getMonth() + 1}`);
        orderBookerIds.add(entry.orderBookerId);
      });

      months.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dailyEntriesByMonth(year, month) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.monthlyAnalytics(year, month) 
        });
      });

      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dailyEntriesByOrderBooker(orderBookerId) 
        });
      });
    },
    onError: (error) => {
      console.error('Failed to batch create daily entries:', error);
    },
  });
};

export const useUpdateDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: UpdateDailyEntryRequest }) => 
      dailyEntryService.update(id, entry),
    onSuccess: (updatedEntry) => {
      const entryDate = new Date(updatedEntry.date);
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntriesByMonth(entryDate.getFullYear(), entryDate.getMonth() + 1) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntriesByOrderBooker(updatedEntry.orderBookerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyAnalytics(entryDate.getFullYear(), entryDate.getMonth() + 1) 
      });
    },
    onError: (error) => {
      console.error('Failed to update daily entry:', error);
    },
  });
};

export const useDeleteDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dailyEntryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
    onError: (error) => {
      console.error('Failed to delete daily entry:', error);
    },
  });
};

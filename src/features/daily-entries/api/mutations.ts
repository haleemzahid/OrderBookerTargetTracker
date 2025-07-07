import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyEntryService } from './service';
import { queryKeys } from './keys';
import type { CreateDailyEntryRequest, UpdateDailyEntryRequest } from '../types';

export const useCreateDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: CreateDailyEntryRequest) => dailyEntryService.create(entry),
    onSuccess: (newEntry) => {
      const entryDate = new Date(newEntry.date);
      const year = entryDate.getFullYear();
      const month = entryDate.getMonth() + 1;

      // Invalidate various query patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byOrderBooker(newEntry.orderBookerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      
      // Set the new entry in cache
      queryClient.setQueryData(queryKeys.dailyEntries.detail(newEntry.id), newEntry);
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
        
        // Set each entry in cache
        queryClient.setQueryData(queryKeys.dailyEntries.detail(entry.id), entry);
      });

      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      
      months.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      });

      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byOrderBooker(orderBookerId) });
      });
    },
  });
};

export const useUpdateDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDailyEntryRequest }) =>
      dailyEntryService.update(id, data),
    onSuccess: (updatedEntry) => {
      const entryDate = new Date(updatedEntry.date);
      const year = entryDate.getFullYear();
      const month = entryDate.getMonth() + 1;

      // Invalidate various query patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byOrderBooker(updatedEntry.orderBookerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      
      // Update the entry in cache
      queryClient.setQueryData(queryKeys.dailyEntries.detail(updatedEntry.id), updatedEntry);
    },
  });
};

export const useDeleteDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dailyEntryService.delete(id),
    onSuccess: (_, id) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.all });
      
      // Remove the entry from cache
      queryClient.removeQueries({ queryKey: queryKeys.dailyEntries.detail(id) });
    },
  });
};

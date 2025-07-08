import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyEntryService } from './service';
import { queryKeys } from './keys';
import type { 
  CreateDailyEntryRequest, 
  UpdateDailyEntryRequest, 
  DateRange,
  DailyEntryWithItems
} from '../types';

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
      queryClient.setQueryData(queryKeys.dailyEntries.withItems(newEntry.id), newEntry);
    },
  });
};

export const useUpdateDailyEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDailyEntryRequest }) => 
      dailyEntryService.update(id, data),
    onSuccess: (updatedEntry) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      
      // Set the updated entry in cache
      queryClient.setQueryData(queryKeys.dailyEntries.detail(updatedEntry.id), updatedEntry);
      queryClient.setQueryData(queryKeys.dailyEntries.withItems(updatedEntry.id), updatedEntry);
      
      // Invalidate month analytics
      const entryDate = new Date(updatedEntry.date);
      const year = entryDate.getFullYear();
      const month = entryDate.getMonth() + 1;
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.byMonth(year, month) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) 
      });
      
      // Invalidate order booker queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.byOrderBooker(updatedEntry.orderBookerId) 
      });
    },
  });
};

export const useUpdateItemQuantityReturned = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantityReturned }: { itemId: string; quantityReturned: number }) => 
      dailyEntryService.updateItemQuantityReturned(itemId, quantityReturned),
    onSuccess: (updatedItem) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.detail(updatedItem.dailyEntryId) 
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.withItems(updatedItem.dailyEntryId) 
      });
    },
  });
};

export const useBatchUpdateDailyEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entries }: { entries: Array<{ id: string; data: UpdateDailyEntryRequest }> }) => 
      Promise.all(entries.map(({ id, data }) => dailyEntryService.update(id, data))),
    onSuccess: (updatedEntries: DailyEntryWithItems[]) => {
      // Track unique years, months, and orderBookerIds to invalidate
      const uniqueYearMonths = new Set<string>();
      const orderBookerIds = new Set<string>();
      
      updatedEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const year = entryDate.getFullYear();
        const month = entryDate.getMonth() + 1;
        
        uniqueYearMonths.add(`${year}-${month}`);
        orderBookerIds.add(entry.orderBookerId);
        
        // Update individual entry caches
        queryClient.setQueryData(queryKeys.dailyEntries.detail(entry.id), entry);
        queryClient.setQueryData(queryKeys.dailyEntries.withItems(entry.id), entry);
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      
      // Invalidate each year-month combination
      uniqueYearMonths.forEach(yearMonth => {
        const [year, month] = yearMonth.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      });
      
      // Invalidate each order booker's entries
      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byOrderBooker(orderBookerId) });
      });
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

export const useBatchCreateDailyEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entries: CreateDailyEntryRequest[]) => 
      Promise.all(entries.map(entry => dailyEntryService.create(entry))),
    onSuccess: (newEntries: DailyEntryWithItems[]) => {
      // Track unique years, months, and orderBookerIds to invalidate
      const uniqueYearMonths = new Set<string>();
      const orderBookerIds = new Set<string>();
      
      newEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const year = entryDate.getFullYear();
        const month = entryDate.getMonth() + 1;
        
        uniqueYearMonths.add(`${year}-${month}`);
        orderBookerIds.add(entry.orderBookerId);
        
        // Set individual entry caches
        queryClient.setQueryData(queryKeys.dailyEntries.detail(entry.id), entry);
        queryClient.setQueryData(queryKeys.dailyEntries.withItems(entry.id), entry);
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      
      // Invalidate each year-month combination
      uniqueYearMonths.forEach(yearMonth => {
        const [year, month] = yearMonth.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      });
      
      // Invalidate each order booker's entries
      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byOrderBooker(orderBookerId) });
      });
    },
  });
};

export const useDeleteEntriesByDateRange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dateRange: DateRange) => {
      // Convert dates to ISO string format for the service
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate.toISOString().split('T')[0];
      
      return dailyEntryService.getByDateRange(startDate, endDate)
        .then(entries => {
          const ids = entries.map(entry => entry.id);
          return Promise.all(ids.map(id => dailyEntryService.delete(id)));
        });
    },
    onSuccess: (_, dateRange) => {
      // Invalidate all the relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.all });
      
      // Calculate all the months in the date range to invalidate
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const yearMonths = new Set<string>();
      
      let current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        yearMonths.add(`${year}-${month}`);
        
        // Move to next month
        current.setMonth(current.getMonth() + 1);
      }
      
      // Invalidate each year-month combination
      yearMonths.forEach(yearMonth => {
        const [year, month] = yearMonth.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.byMonth(year, month) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyEntries.monthlyAnalytics(year, month) });
      });
      
      // Also invalidate date range queries that might overlap
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dailyEntries.byDateRange(startDateStr, endDateStr)
      });
    },
  });
};

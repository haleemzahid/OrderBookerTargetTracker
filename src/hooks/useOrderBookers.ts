import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderBookerService } from '../services/api/orderBookerService';
import type { OrderBookerFilters, CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

export const queryKeys = {
  orderBookers: ['orderBookers'] as const,
  orderBooker: (id: string) => ['orderBookers', id] as const,
  orderBookersByFilters: (filters?: OrderBookerFilters) => ['orderBookers', filters] as const,
  dailyEntries: ['dailyEntries'] as const,
  dailyEntry: (id: string) => ['dailyEntries', id] as const,
  dailyEntriesByMonth: (year: number, month: number) => ['dailyEntries', 'month', year, month] as const,
  dailyEntriesByOrderBooker: (orderBookerId: string) => ['dailyEntries', 'orderBooker', orderBookerId] as const,
  monthlyTargets: ['monthlyTargets'] as const,
  monthlyTarget: (id: string) => ['monthlyTargets', id] as const,
  monthlyTargetsByMonth: (year: number, month: number) => ['monthlyTargets', 'month', year, month] as const,
  monthlyTargetsByOrderBooker: (orderBookerId: string) => ['monthlyTargets', 'orderBooker', orderBookerId] as const,
  analytics: ['analytics'] as const,
  monthlyAnalytics: (year: number, month: number) => ['analytics', 'monthly', year, month] as const,
};

export const useOrderBookers = (filters?: OrderBookerFilters) => {
  return useQuery({
    queryKey: queryKeys.orderBookersByFilters(filters),
    queryFn: () => orderBookerService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useOrderBooker = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orderBooker(id),
    queryFn: () => orderBookerService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderBookerRequest) => orderBookerService.create(data),
    onSuccess: (newOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers });
      queryClient.setQueryData(queryKeys.orderBooker(newOrderBooker.id), newOrderBooker);
    },
    onError: (error) => {
      console.error('Failed to create order booker:', error);
    },
  });
};

export const useUpdateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBookerRequest }) => 
      orderBookerService.update(id, data),
    onSuccess: (updatedOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers });
      queryClient.setQueryData(queryKeys.orderBooker(updatedOrderBooker.id), updatedOrderBooker);
    },
    onError: (error) => {
      console.error('Failed to update order booker:', error);
    },
  });
};

export const useDeleteOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderBookerService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers });
      queryClient.removeQueries({ queryKey: queryKeys.orderBooker(id) });
    },
    onError: (error) => {
      console.error('Failed to delete order booker:', error);
    },
  });
};

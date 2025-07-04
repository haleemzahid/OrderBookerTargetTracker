import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monthlyTargetService } from '../services/api/monthlyTargetService';
import { queryKeys } from './useOrderBookers';
import type { CreateMonthlyTargetRequest, UpdateMonthlyTargetRequest } from '../types';

export const useMonthlyTargetsByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargetsByMonth(year, month),
    queryFn: () => monthlyTargetService.getByMonth(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMonthlyTargetsByOrderBooker = (orderBookerId: string) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargetsByOrderBooker(orderBookerId),
    queryFn: () => monthlyTargetService.getByOrderBooker(orderBookerId),
    enabled: !!orderBookerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: CreateMonthlyTargetRequest) => monthlyTargetService.create(target),
    onSuccess: (newTarget) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyTargetsByMonth(newTarget.year, newTarget.month) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyTargetsByOrderBooker(newTarget.orderBookerId) 
      });
    },
    onError: (error) => {
      console.error('Failed to create monthly target:', error);
    },
  });
};

export const useBatchCreateMonthlyTargets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targets: CreateMonthlyTargetRequest[]) => monthlyTargetService.batchCreate(targets),
    onSuccess: (newTargets) => {
      const months = new Set<string>();
      const orderBookerIds = new Set<string>();
      
      newTargets.forEach(target => {
        months.add(`${target.year}-${target.month}`);
        orderBookerIds.add(target.orderBookerId);
      });

      months.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.monthlyTargetsByMonth(year, month) 
        });
      });

      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.monthlyTargetsByOrderBooker(orderBookerId) 
        });
      });
    },
    onError: (error) => {
      console.error('Failed to batch create monthly targets:', error);
    },
  });
};

export const useUpdateMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, target }: { id: string; target: UpdateMonthlyTargetRequest }) => 
      monthlyTargetService.update(id, target),
    onSuccess: (updatedTarget) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyTargetsByMonth(updatedTarget.year, updatedTarget.month) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.monthlyTargetsByOrderBooker(updatedTarget.orderBookerId) 
      });
    },
    onError: (error) => {
      console.error('Failed to update monthly target:', error);
    },
  });
};

export const useDeleteMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monthlyTargetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets });
    },
    onError: (error) => {
      console.error('Failed to delete monthly target:', error);
    },
  });
};

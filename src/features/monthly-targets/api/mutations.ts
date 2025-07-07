import { useMutation, useQueryClient } from '@tanstack/react-query';
import { monthlyTargetService } from './service';
import { queryKeys } from './keys';
import type { CreateMonthlyTargetRequest, UpdateMonthlyTargetRequest, CopyTargetsRequest } from '../types';

export const useCreateMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: CreateMonthlyTargetRequest) => monthlyTargetService.create(target),
    onSuccess: (newTarget) => {
      // Invalidate various query patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byMonth(newTarget.year, newTarget.month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byOrderBooker(newTarget.orderBookerId) });
      
      // Set the new target in cache
      queryClient.setQueryData(queryKeys.monthlyTargets.detail(newTarget.id), newTarget);
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
        
        // Set each target in cache
        queryClient.setQueryData(queryKeys.monthlyTargets.detail(target.id), target);
      });

      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      
      months.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byMonth(year, month) });
      });

      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byOrderBooker(orderBookerId) });
      });
    },
  });
};

export const useBatchUpsertMonthlyTargets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targets: CreateMonthlyTargetRequest[]) => monthlyTargetService.batchUpsert(targets),
    onSuccess: (upsertedTargets) => {
      const months = new Set<string>();
      const orderBookerIds = new Set<string>();
      
      upsertedTargets.forEach(target => {
        months.add(`${target.year}-${target.month}`);
        orderBookerIds.add(target.orderBookerId);
        
        // Set each target in cache
        queryClient.setQueryData(queryKeys.monthlyTargets.detail(target.id), target);
      });

      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      
      months.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byMonth(year, month) });
      });

      orderBookerIds.forEach(orderBookerId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byOrderBooker(orderBookerId) });
      });
    },
  });
};

export const useUpdateMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMonthlyTargetRequest }) =>
      monthlyTargetService.update(id, data),
    onSuccess: (updatedTarget) => {
      // Invalidate various query patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byMonth(updatedTarget.year, updatedTarget.month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byOrderBooker(updatedTarget.orderBookerId) });
      
      // Update the target in cache
      queryClient.setQueryData(queryKeys.monthlyTargets.detail(updatedTarget.id), updatedTarget);
    },
  });
};

export const useDeleteMonthlyTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monthlyTargetService.delete(id),
    onSuccess: (_, id) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      
      // Remove the target from cache
      queryClient.removeQueries({ queryKey: queryKeys.monthlyTargets.detail(id) });
    },
  });
};

export const useCopyFromPreviousMonth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CopyTargetsRequest) => monthlyTargetService.copyFromPreviousMonth(params),
    onSuccess: (newTargets) => {
      // Invalidate queries for the target month
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.lists() });
      
      if (newTargets.length > 0) {
        const targetYear = newTargets[0].year;
        const targetMonth = newTargets[0].month;
        queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byMonth(targetYear, targetMonth) });
        
        newTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTargets.byOrderBooker(target.orderBookerId) });
          queryClient.setQueryData(queryKeys.monthlyTargets.detail(target.id), target);
        });
      }
    },
  });
};

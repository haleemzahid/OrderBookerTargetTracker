import { useQuery } from '@tanstack/react-query';
import { monthlyTargetService } from './service';
import { queryKeys } from './keys';
import type { MonthlyTargetFilters } from '../types';

export const useMonthlyTargets = (filters?: MonthlyTargetFilters) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.list(filters),
    queryFn: () => monthlyTargetService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMonthlyTarget = (id: string) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.detail(id),
    queryFn: () => monthlyTargetService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMonthlyTargetsByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.byMonth(year, month),
    queryFn: () => monthlyTargetService.getByMonth(year, month),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useMonthlyTargetsByOrderBooker = (orderBookerId: string) => {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.byOrderBooker(orderBookerId),
    queryFn: () => monthlyTargetService.getByOrderBooker(orderBookerId),
    enabled: !!orderBookerId,
    staleTime: 5 * 60 * 1000,
  });
};

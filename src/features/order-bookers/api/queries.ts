import { useQuery } from '@tanstack/react-query';
import { orderBookerService } from './service';
import { queryKeys } from './keys';
import type { OrderBookerFilters } from '../types';

export const useOrderBookers = (filters?: OrderBookerFilters) => {
  return useQuery({
    queryKey: queryKeys.orderBookers.list(filters),
    queryFn: () => orderBookerService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useOrderBooker = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orderBookers.detail(id),
    queryFn: () => orderBookerService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderBookerService } from './service';
import { queryKeys } from './keys';
import type { CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

export const useCreateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderBookerRequest) => orderBookerService.create(data),
    onSuccess: (newOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.setQueryData(queryKeys.orderBookers.detail(newOrderBooker.id), newOrderBooker);
    },
  });
};

export const useUpdateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBookerRequest }) =>
      orderBookerService.update(id, data),
    onSuccess: (updatedOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.setQueryData(queryKeys.orderBookers.detail(updatedOrderBooker.id), updatedOrderBooker);
    },
  });
};

export const useDeleteOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderBookerService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.orderBookers.detail(id) });
    },
  });
};

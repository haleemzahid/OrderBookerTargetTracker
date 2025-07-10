import { useQuery } from '@tanstack/react-query';
import { 
  getOrderById, 
  getOrders, 
  getOrderItems,
  getOrderSummary
} from './service';
import { queryKeys } from './keys';
import type { OrderFilters } from '../types';

export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => getOrders(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrderById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.orderItems.byOrder(orderId),
    queryFn: () => getOrderItems(orderId),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute - order items change frequently
  });
};

export const useOrdersByOrderBooker = (orderBookerId: string, additionalFilters?: Omit<OrderFilters, 'orderBookerId'>) => {
  const filters = { ...additionalFilters, orderBookerId };
  return useQuery({
    queryKey: queryKeys.orders.byOrderBooker(orderBookerId),
    queryFn: () => getOrders(filters),
    enabled: !!orderBookerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOrdersByStatus = (status: 'pending' | 'supplied' | 'completed', additionalFilters?: Omit<OrderFilters, 'status'>) => {
  const filters = { ...additionalFilters, status };
  return useQuery({
    queryKey: queryKeys.orders.byStatus(status),
    queryFn: () => getOrders(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOrderSummary = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: queryKeys.orders.summary(filters),
    queryFn: () => getOrderSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

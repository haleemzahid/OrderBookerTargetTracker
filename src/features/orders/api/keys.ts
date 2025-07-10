import type { OrderFilters } from '../types';

export const queryKeys = {
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: OrderFilters) => [...queryKeys.orders.lists(), filters] as const,
    byOrderBooker: (orderBookerId: string) => [...queryKeys.orders.all, 'orderBooker', orderBookerId] as const,
    byStatus: (status: string) => [...queryKeys.orders.all, 'status', status] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    summary: (filters?: OrderFilters) => [...queryKeys.orders.all, 'summary', filters] as const,
  },
  orderItems: {
    all: ['orderItems'] as const,
    byOrder: (orderId: string) => [...queryKeys.orderItems.all, 'order', orderId] as const,
    detail: (id: string) => [...queryKeys.orderItems.all, 'detail', id] as const,
  },
};

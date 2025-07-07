import type { OrderBookerFilters } from '../types';

export const queryKeys = {
  orderBookers: {
    all: ['order-bookers'] as const,
    lists: () => [...queryKeys.orderBookers.all, 'list'] as const,
    list: (filters?: OrderBookerFilters) => [...queryKeys.orderBookers.lists(), filters] as const,
    details: () => [...queryKeys.orderBookers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orderBookers.details(), id] as const,
  },
};

import type { ProductFilterOptions } from '../types';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: ProductFilterOptions) => [...queryKeys.products.lists(), filters] as const,
    byCompany: (companyId: string) => [...queryKeys.products.all, 'company', companyId] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
};

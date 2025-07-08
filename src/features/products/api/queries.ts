export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    byCompany: (companyId: string) => [...queryKeys.products.all, 'byCompany', companyId] as const,
    withCompany: (filters?: any) => [...queryKeys.products.all, 'withCompany', { filters }] as const,
  },
} as const;

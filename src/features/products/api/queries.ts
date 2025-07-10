import { useQuery } from '@tanstack/react-query';
import { getProductById, getProducts, getProductsByCompany } from './service';
import { queryKeys } from './keys';
import type { ProductFilterOptions } from '../types';

export const useProducts = (filters?: ProductFilterOptions) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProductsByCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.products.byCompany(companyId),
    queryFn: () => getProductsByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

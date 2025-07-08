import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/service';
import { queryKeys } from '../api/queries';
import type { ProductFilters } from '../types';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProductsWithCompany = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: queryKeys.products.withCompany(filters),
    queryFn: () => productService.getAllWithCompany(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProductsByCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.products.byCompany(companyId),
    queryFn: () => productService.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

import { useQuery } from '@tanstack/react-query';
import { companyService } from '../api/service';
import { queryKeys } from '../api/queries';
import type { CompanyFilters } from '../types';

export const useCompanies = (filters?: CompanyFilters) => {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => companyService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companyService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

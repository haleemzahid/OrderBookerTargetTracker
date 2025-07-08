import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from './service';
import { queryKeys } from './queries';
import type { CreateCompanyRequest, UpdateCompanyRequest } from '../types';

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => companyService.create(data),
    onSuccess: (newCompany) => {
      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      
      // Set the new company in cache
      queryClient.setQueryData(queryKeys.companies.detail(newCompany.id), newCompany);
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyRequest }) =>
      companyService.update(id, data),
    onSuccess: (updatedCompany) => {
      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      
      // Update the company in cache
      queryClient.setQueryData(queryKeys.companies.detail(updatedCompany.id), updatedCompany);
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.delete(id),
    onSuccess: (_, id) => {
      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      
      // Remove the company from cache
      queryClient.removeQueries({ queryKey: queryKeys.companies.detail(id) });
    },
  });
};

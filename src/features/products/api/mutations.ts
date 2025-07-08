import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from './service';
import { queryKeys } from './queries';
import type { CreateProductRequest, UpdateProductRequest } from '../types';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productService.create(data),
    onSuccess: (newProduct) => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.withCompany() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(newProduct.companyId) });
      
      // Set the new product in cache
      queryClient.setQueryData(queryKeys.products.detail(newProduct.id), newProduct);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productService.update(id, data),
    onSuccess: (updatedProduct) => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.withCompany() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(updatedProduct.companyId) });
      
      // Update the product in cache
      queryClient.setQueryData(queryKeys.products.detail(updatedProduct.id), updatedProduct);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: (_, id) => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.withCompany() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      
      // Remove the product from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
};

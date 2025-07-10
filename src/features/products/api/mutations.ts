import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, deleteProduct } from './service';
import { queryKeys } from './keys';
import type { CreateProductRequest, UpdateProductRequest, Product } from '../types';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: CreateProductRequest) => createProduct(product),
    onSuccess: (newProduct: Product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(newProduct.companyId) });
      queryClient.setQueryData(queryKeys.products.detail(newProduct.id), newProduct);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) => updateProduct(id, data),
    onSuccess: (updatedProduct: Product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(updatedProduct.companyId) });
      queryClient.setQueryData(queryKeys.products.detail(updatedProduct.id), updatedProduct);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
};

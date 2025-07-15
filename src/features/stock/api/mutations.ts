import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createStockTransaction, 
  adjustStock, 
  addStock, 
  updateProductStock 
} from './service';
import { stockQueryKeys } from './keys';
import { queryKeys as productQueryKeys } from '../../products/api/keys';
import type { CreateStockTransactionRequest, StockAdjustmentRequest } from '../types';

export const useCreateStockTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateStockTransactionRequest) => createStockTransaction(data),
    onSuccess: (_, variables) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all });
      
      // Invalidate product queries to update stock levels
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products.all });
      
      // Invalidate specific product stock
      queryClient.invalidateQueries({ 
        queryKey: stockQueryKeys.productStock(variables.productId) 
      });
      
      // Invalidate product-specific transactions
      queryClient.invalidateQueries({ 
        queryKey: stockQueryKeys.transactionsByProduct(variables.productId) 
      });
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: StockAdjustmentRequest) => adjustStock(data),
    onSuccess: (_, variables) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all });
      
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products.all });
      
      // Invalidate specific product stock
      queryClient.invalidateQueries({ 
        queryKey: stockQueryKeys.productStock(variables.productId) 
      });
    },
  });
};

export const useAddStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      productId, 
      quantity, 
      purchaseCost, 
      expiryDate, 
      comments 
    }: {
      productId: string;
      quantity: number;
      purchaseCost: number;
      expiryDate?: Date;
      comments?: string;
    }) => addStock(productId, quantity, purchaseCost, expiryDate, comments),
    onSuccess: (_, variables) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all });
      
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products.all });
      
      // Invalidate specific product stock
      queryClient.invalidateQueries({ 
        queryKey: stockQueryKeys.productStock(variables.productId) 
      });
    },
  });
};

export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => updateProductStock(productId),
    onSuccess: (_, productId) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all });
      
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products.all });
      
      // Invalidate specific product stock
      queryClient.invalidateQueries({ 
        queryKey: stockQueryKeys.productStock(productId) 
      });
    },
  });
};

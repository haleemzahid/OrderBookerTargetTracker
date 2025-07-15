import { useQuery } from '@tanstack/react-query';
import { 
  getStockTransactions, 
  getStockOverview, 
  getLowStockProducts, 
  getProductStock,
  getStockTransactionById
} from './service';
import { stockQueryKeys } from './keys';
import type { StockFilterOptions } from '../types';

export const useStockTransactions = (filters?: StockFilterOptions) => {
  return useQuery({
    queryKey: stockQueryKeys.transactionsList(filters),
    queryFn: () => getStockTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStockTransaction = (id: string) => {
  return useQuery({
    queryKey: ['stock', 'transaction', id],
    queryFn: () => getStockTransactionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStockTransactionsByProduct = (productId: string) => {
  return useQuery({
    queryKey: stockQueryKeys.transactionsByProduct(productId),
    queryFn: () => getStockTransactions({ productId }),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStockOverview = () => {
  return useQuery({
    queryKey: stockQueryKeys.overview(),
    queryFn: () => getStockOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: stockQueryKeys.lowStock(),
    queryFn: () => getLowStockProducts(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useProductStock = (productId: string) => {
  return useQuery({
    queryKey: stockQueryKeys.productStock(productId),
    queryFn: () => getProductStock(productId),
    enabled: !!productId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useStockSummary = () => {
  return useQuery({
    queryKey: stockQueryKeys.stockSummary(),
    queryFn: async () => {
      const overview = await getStockOverview();
      const lowStock = await getLowStockProducts();
      
      const totalProducts = overview.length;
      const lowStockCount = lowStock.length;
      const outOfStockCount = overview.filter(p => p.currentStock <= 0).length;
      const inStockCount = totalProducts - lowStockCount - outOfStockCount;
      
      return {
        totalProducts,
        inStockCount,
        lowStockCount,
        outOfStockCount,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

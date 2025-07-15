import { useState, useCallback } from 'react';
import { useStockOverview, useLowStockProducts } from '../api/queries';
import { useCreateStockTransaction, useAdjustStock } from '../api/mutations';
import type { CreateStockTransactionRequest, StockAdjustmentRequest } from '../types';

export const useStockManagement = () => {
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  
  const stockOverviewQuery = useStockOverview();
  const lowStockQuery = useLowStockProducts();
  const createTransactionMutation = useCreateStockTransaction();
  const adjustStockMutation = useAdjustStock();

  const openAdjustmentModal = useCallback(() => {
    setIsAdjustmentModalOpen(true);
  }, []);

  const closeAdjustmentModal = useCallback(() => {
    setIsAdjustmentModalOpen(false);
  }, []);

  const createStockTransaction = useCallback(async (data: CreateStockTransactionRequest) => {
    try {
      const result = await createTransactionMutation.mutateAsync(data);
      return result;
    } catch (error) {
      console.error('Failed to create stock transaction:', error);
      throw error;
    }
  }, [createTransactionMutation]);

  const adjustStock = useCallback(async (data: StockAdjustmentRequest) => {
    try {
      const result = await adjustStockMutation.mutateAsync(data);
      return result;
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  }, [adjustStockMutation]);

  return {
    // Data
    stockOverview: stockOverviewQuery.data,
    lowStockProducts: lowStockQuery.data,
    
    // Loading states
    isLoadingOverview: stockOverviewQuery.isLoading,
    isLoadingLowStock: lowStockQuery.isLoading,
    isCreatingTransaction: createTransactionMutation.isPending,
    isAdjustingStock: adjustStockMutation.isPending,
    
    // Modal state
    isAdjustmentModalOpen,
    openAdjustmentModal,
    closeAdjustmentModal,
    
    // Actions
    createStockTransaction,
    adjustStock,
    
    // Refresh functions
    refetchOverview: stockOverviewQuery.refetch,
    refetchLowStock: lowStockQuery.refetch,
  };
};

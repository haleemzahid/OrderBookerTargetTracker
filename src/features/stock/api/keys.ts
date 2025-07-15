import type { StockFilterOptions } from '../types';

export const stockQueryKeys = {
  all: ['stock'] as const,
  transactions: () => [...stockQueryKeys.all, 'transactions'] as const,
  transactionsByProduct: (productId: string) => [...stockQueryKeys.transactions(), productId] as const,
  transactionsList: (filters?: StockFilterOptions) => [...stockQueryKeys.transactions(), 'list', filters] as const,
  overview: () => [...stockQueryKeys.all, 'overview'] as const,
  lowStock: () => [...stockQueryKeys.all, 'low-stock'] as const,
  productStock: (productId: string) => [...stockQueryKeys.all, 'product', productId] as const,
  stockSummary: () => [...stockQueryKeys.all, 'summary'] as const,
};

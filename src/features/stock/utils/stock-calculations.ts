import type { StockTransaction, ProductStock } from '../types';

/**
 * Calculate current stock level from transactions
 */
export const calculateStockFromTransactions = (transactions: StockTransaction[]): number => {
  return transactions.reduce((stock, transaction) => {
    switch (transaction.transactionType) {
      case 'IN':
        return stock + transaction.quantity;
      case 'OUT':
        return stock - transaction.quantity;
      case 'ADJUSTMENT':
        // For adjustments, negative reasons reduce stock, positive adjustments increase stock
        if (['EXPIRED', 'DAMAGED', 'LOST'].includes(transaction.reason)) {
          return stock - transaction.quantity;
        } else {
          return stock + transaction.quantity;
        }
      default:
        return stock;
    }
  }, 0);
};

/**
 * Determine stock status based on current stock and threshold
 */
export const getStockStatus = (
  currentStock: number,
  lowStockThreshold: number
): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' => {
  if (currentStock <= 0) {
    return 'OUT_OF_STOCK';
  } else if (currentStock <= lowStockThreshold) {
    return 'LOW_STOCK';
  } else {
    return 'IN_STOCK';
  }
};

/**
 * Calculate stock value based on transactions with purchase costs
 */
export const calculateStockValue = (transactions: StockTransaction[]): number => {
  // Use FIFO (First In, First Out) for stock valuation
  const inTransactions = transactions
    .filter(t => t.transactionType === 'IN' && t.purchaseCost !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  const outTransactions = transactions
    .filter(t => t.transactionType === 'OUT' || 
      (t.transactionType === 'ADJUSTMENT' && ['EXPIRED', 'DAMAGED', 'LOST'].includes(t.reason)))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let remainingIn = [...inTransactions];
  let totalOutQuantity = outTransactions.reduce((sum, t) => sum + t.quantity, 0);
  
  // Remove quantities that have been consumed (FIFO)
  let consumedQuantity = 0;
  for (const inTransaction of remainingIn) {
    if (consumedQuantity >= totalOutQuantity) break;
    
    const availableQuantity = inTransaction.quantity;
    const toConsume = Math.min(availableQuantity, totalOutQuantity - consumedQuantity);
    
    inTransaction.quantity -= toConsume;
    consumedQuantity += toConsume;
  }
  
  // Calculate value from remaining stock
  return remainingIn
    .filter(t => t.quantity > 0)
    .reduce((value, t) => value + (t.quantity * (t.purchaseCost || 0)), 0);
};

/**
 * Get stock trend based on recent transactions
 */
export const getStockTrend = (
  transactions: StockTransaction[],
  daysBack: number = 30
): 'INCREASING' | 'DECREASING' | 'STABLE' => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const recentTransactions = transactions.filter(
    t => new Date(t.createdAt) >= cutoffDate
  );
  
  if (recentTransactions.length === 0) return 'STABLE';
  
  const netChange = recentTransactions.reduce((change, transaction) => {
    switch (transaction.transactionType) {
      case 'IN':
        return change + transaction.quantity;
      case 'OUT':
        return change - transaction.quantity;
      case 'ADJUSTMENT':
        if (['EXPIRED', 'DAMAGED', 'LOST'].includes(transaction.reason)) {
          return change - transaction.quantity;
        } else {
          return change + transaction.quantity;
        }
      default:
        return change;
    }
  }, 0);
  
  if (netChange > 0) return 'INCREASING';
  if (netChange < 0) return 'DECREASING';
  return 'STABLE';
};

/**
 * Validate if stock operation is possible
 */
export const canPerformStockOperation = (
  currentStock: number,
  operation: 'ADD' | 'REMOVE',
  quantity: number
): boolean => {
  if (operation === 'ADD') {
    return quantity > 0;
  } else {
    return quantity > 0 && currentStock >= quantity;
  }
};

/**
 * Calculate low stock products from a list
 */
export const getLowStockProducts = (products: ProductStock[]): ProductStock[] => {
  return products.filter(product => 
    product.currentStock <= product.lowStockThreshold &&
    product.currentStock > 0
  );
};

/**
 * Calculate out of stock products from a list
 */
export const getOutOfStockProducts = (products: ProductStock[]): ProductStock[] => {
  return products.filter(product => product.currentStock <= 0);
};

/**
 * Format stock level for display
 */
export const formatStockLevel = (
  currentStock: number,
  lowStockThreshold: number
): string => {
  const status = getStockStatus(currentStock, lowStockThreshold);
  
  switch (status) {
    case 'OUT_OF_STOCK':
      return `${currentStock} (Out of Stock)`;
    case 'LOW_STOCK':
      return `${currentStock} (Low Stock)`;
    case 'IN_STOCK':
      return `${currentStock}`;
    default:
      return `${currentStock}`;
  }
};

import type { StockValidationResult, StockAdjustmentRequest, CreateStockTransactionRequest } from '../types';

/**
 * Validate stock adjustment request
 */
export const validateStockAdjustment = (
  request: StockAdjustmentRequest,
  currentStock: number
): StockValidationResult => {
  const result: StockValidationResult = {
    isValid: true,
    canProceed: true,
    warnings: [],
    errors: []
  };

  // Basic validation
  if (request.quantity <= 0) {
    result.errors.push('Quantity must be greater than 0');
    result.isValid = false;
    result.canProceed = false;
  }

  if (!request.productId) {
    result.errors.push('Product ID is required');
    result.isValid = false;
    result.canProceed = false;
  }

  // Stock level validation
  if (request.adjustmentType === 'REMOVE') {
    if (request.quantity > currentStock) {
      result.warnings.push(
        `Removing ${request.quantity} units will result in negative stock (current: ${currentStock})`
      );
      // Don't block the operation, just warn
    }
    
    if (currentStock - request.quantity < 0) {
      result.warnings.push('This operation will result in negative stock levels');
    }
  }

  // Reason validation
  if (request.adjustmentType === 'REMOVE' && !['EXPIRED', 'DAMAGED', 'LOST', 'OTHER'].includes(request.reason)) {
    result.errors.push('Invalid reason for stock removal');
    result.isValid = false;
    result.canProceed = false;
  }

  return result;
};

/**
 * Validate stock transaction request
 */
export const validateStockTransaction = (
  request: CreateStockTransactionRequest,
  currentStock?: number
): StockValidationResult => {
  const result: StockValidationResult = {
    isValid: true,
    canProceed: true,
    warnings: [],
    errors: []
  };

  // Basic validation
  if (request.quantity <= 0) {
    result.errors.push('Quantity must be greater than 0');
    result.isValid = false;
    result.canProceed = false;
  }

  if (!request.productId) {
    result.errors.push('Product ID is required');
    result.isValid = false;
    result.canProceed = false;
  }

  // Transaction type specific validation
  switch (request.transactionType) {
    case 'IN':
      if (request.reason !== 'PURCHASE') {
        result.warnings.push('IN transactions should typically have PURCHASE reason');
      }
      if (request.purchaseCost !== undefined && request.purchaseCost < 0) {
        result.errors.push('Purchase cost cannot be negative');
        result.isValid = false;
        result.canProceed = false;
      }
      break;
      
    case 'OUT':
      if (request.reason !== 'SALE') {
        result.warnings.push('OUT transactions should typically have SALE reason');
      }
      if (currentStock !== undefined && request.quantity > currentStock) {
        result.warnings.push(
          `Insufficient stock: requested ${request.quantity}, available ${currentStock}`
        );
      }
      if (request.purchaseCost !== undefined) {
        result.warnings.push('Purchase cost is not relevant for OUT transactions');
      }
      break;
      
    case 'ADJUSTMENT':
      if (!['EXPIRED', 'DAMAGED', 'LOST', 'OTHER'].includes(request.reason)) {
        result.warnings.push('ADJUSTMENT transactions should have appropriate reason');
      }
      break;
      
    default:
      result.errors.push('Invalid transaction type');
      result.isValid = false;
      result.canProceed = false;
  }

  // Expiry date validation
  if (request.expiryDate && request.expiryDate <= new Date()) {
    result.warnings.push('Expiry date is in the past');
  }

  if (request.expiryDate && request.transactionType !== 'IN') {
    result.warnings.push('Expiry date is only relevant for IN transactions');
  }

  return result;
};

/**
 * Validate bulk stock operations
 */
export const validateBulkStockOperation = (
  requests: CreateStockTransactionRequest[]
): StockValidationResult => {
  const result: StockValidationResult = {
    isValid: true,
    canProceed: true,
    warnings: [],
    errors: []
  };

  if (requests.length === 0) {
    result.errors.push('No transactions to process');
    result.isValid = false;
    result.canProceed = false;
    return result;
  }

  if (requests.length > 100) {
    result.warnings.push('Processing many transactions at once may be slow');
  }

  // Validate each request
  for (let i = 0; i < requests.length; i++) {
    const requestResult = validateStockTransaction(requests[i]);
    
    if (!requestResult.isValid) {
      result.errors.push(`Transaction ${i + 1}: ${requestResult.errors.join(', ')}`);
      result.isValid = false;
      result.canProceed = false;
    }
    
    if (requestResult.warnings.length > 0) {
      result.warnings.push(`Transaction ${i + 1}: ${requestResult.warnings.join(', ')}`);
    }
  }

  return result;
};

/**
 * Validate stock operation permissions
 */
export const validateStockPermissions = (
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  userId?: string
): StockValidationResult => {
  const result: StockValidationResult = {
    isValid: true,
    canProceed: true,
    warnings: [],
    errors: []
  };

  // For now, allow all operations
  // In the future, this could check user roles and permissions
  if (!userId) {
    result.warnings.push('User ID not provided for audit trail');
  }

  return result;
};

/**
 * Check if stock operation would result in negative stock
 */
export const wouldResultInNegativeStock = (
  currentStock: number,
  operation: 'ADD' | 'REMOVE',
  quantity: number
): boolean => {
  if (operation === 'ADD') {
    return false;
  } else {
    return currentStock - quantity < 0;
  }
};

/**
 * Get stock level warning message
 */
export const getStockLevelWarning = (
  currentStock: number,
  lowStockThreshold: number,
  operation: 'ADD' | 'REMOVE',
  quantity: number
): string | null => {
  const newStock = operation === 'ADD' ? currentStock + quantity : currentStock - quantity;
  
  if (newStock < 0) {
    return `This operation will result in negative stock (${newStock})`;
  }
  
  if (newStock <= lowStockThreshold && currentStock > lowStockThreshold) {
    return `This operation will bring stock below low stock threshold (${lowStockThreshold})`;
  }
  
  if (newStock === 0) {
    return 'This operation will result in zero stock';
  }
  
  return null;
};

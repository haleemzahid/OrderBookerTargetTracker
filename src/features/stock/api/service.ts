import { getDatabase } from '../../../services/database';
import type { 
  StockTransaction, 
  CreateStockTransactionRequest, 
  StockAdjustmentRequest, 
  ProductStock,
  StockValidationResult,
  StockFilterOptions
} from '../types';
import { validateStockTransaction, validateStockAdjustment } from '../utils/stock-validation';
import { getStockStatus } from '../utils/stock-calculations';
import { v4 as uuidv4 } from 'uuid';

// Stock transaction operations
export const createStockTransaction = async (data: CreateStockTransactionRequest): Promise<StockTransaction> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();
  
  // Validate the transaction
  const currentStock = await getProductStock(data.productId);
  const validation = validateStockTransaction(data, currentStock);
  
  if (!validation.canProceed) {
    throw new Error(`Stock transaction validation failed: ${validation.errors.join(', ')}`);
  }

  const query = `
    INSERT INTO stock_transactions (
      id, product_id, transaction_type, quantity, reason, 
      reference_id, purchase_cost, expiry_date, comments, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id,
    data.productId,
    data.transactionType,
    data.quantity,
    data.reason,
    data.referenceId || null,
    data.purchaseCost || null,
    data.expiryDate?.toISOString() || null,
    data.comments || null,
    now,
    now
  ];

  await db.execute(query, params);

  // Get the created transaction
  const createdTransaction = await getStockTransactionById(id);
  if (!createdTransaction) {
    throw new Error(`Failed to retrieve created stock transaction with ID ${id}`);
  }

  return createdTransaction;
};

export const getStockTransactions = async (filters?: StockFilterOptions): Promise<StockTransaction[]> => {
  const db = getDatabase();
  let query = `
    SELECT 
      id, product_id as productId, transaction_type as transactionType, 
      quantity, reason, reference_id as referenceId, purchase_cost as purchaseCost,
      expiry_date as expiryDate, comments, created_at as createdAt, updated_at as updatedAt
    FROM stock_transactions 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.productId) {
    query += ` AND product_id = ?`;
    params.push(filters.productId);
  }

  if (filters?.transactionType) {
    query += ` AND transaction_type = ?`;
    params.push(filters.transactionType);
  }

  if (filters?.reason) {
    query += ` AND reason = ?`;
    params.push(filters.reason);
  }

  if (filters?.dateFrom) {
    query += ` AND created_at >= ?`;
    params.push(filters.dateFrom.toISOString());
  }

  if (filters?.dateTo) {
    query += ` AND created_at <= ?`;
    params.push(filters.dateTo.toISOString());
  }

  if (filters?.sortBy) {
    const sortColumn = getSortColumn(filters.sortBy);
    const sortDirection = filters.sortOrder === 'descend' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }

  const result = await db.select<any[]>(query, params);
  return result.map(parseStockTransaction);
};

export const getStockTransactionById = async (id: string): Promise<StockTransaction | null> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      id, product_id as productId, transaction_type as transactionType, 
      quantity, reason, reference_id as referenceId, purchase_cost as purchaseCost,
      expiry_date as expiryDate, comments, created_at as createdAt, updated_at as updatedAt
     FROM stock_transactions 
     WHERE id = ?`,
    [id]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return parseStockTransaction(result[0]);
};

export const getProductStock = async (productId: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT current_stock FROM products WHERE id = ?`,
    [productId]
  );
  
  if (result.length === 0) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  
  return result[0].current_stock || 0;
};

export const updateProductStock = async (productId: string): Promise<void> => {
  // The triggers will handle this automatically, but we can implement 
  // a manual recalculation if needed
  const db = getDatabase();
  
  // Calculate stock from all transactions
  const transactions = await getStockTransactions({ productId });
  let calculatedStock = 0;
  
  for (const transaction of transactions) {
    switch (transaction.transactionType) {
      case 'IN':
        calculatedStock += transaction.quantity;
        break;
      case 'OUT':
        calculatedStock -= transaction.quantity;
        break;
      case 'ADJUSTMENT':
        if (['EXPIRED', 'DAMAGED', 'LOST'].includes(transaction.reason)) {
          calculatedStock -= transaction.quantity;
        } else {
          calculatedStock += transaction.quantity;
        }
        break;
    }
  }
  
  // Update the product's current stock
  await db.execute(
    `UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`,
    [calculatedStock, new Date().toISOString(), productId]
  );
};

// Stock adjustment operations
export const adjustStock = async (data: StockAdjustmentRequest): Promise<StockTransaction> => {
  const currentStock = await getProductStock(data.productId);
  const validation = validateStockAdjustment(data, currentStock);
  
  if (!validation.canProceed) {
    throw new Error(`Stock adjustment validation failed: ${validation.errors.join(', ')}`);
  }

  const transactionData: CreateStockTransactionRequest = {
    productId: data.productId,
    transactionType: 'ADJUSTMENT',
    quantity: data.quantity,
    reason: data.reason,
    comments: data.comments,
  };

  return createStockTransaction(transactionData);
};

export const addStock = async (
  productId: string, 
  quantity: number, 
  purchaseCost: number, 
  expiryDate?: Date, 
  comments?: string
): Promise<StockTransaction> => {
  const transactionData: CreateStockTransactionRequest = {
    productId,
    transactionType: 'IN',
    quantity,
    reason: 'PURCHASE',
    purchaseCost,
    expiryDate,
    comments,
  };

  return createStockTransaction(transactionData);
};

// Stock queries
export const getLowStockProducts = async (): Promise<ProductStock[]> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      p.id as productId, p.name as productName, p.current_stock as currentStock,
      p.low_stock_threshold as lowStockThreshold, p.updated_at as lastUpdated
     FROM products p 
     WHERE p.current_stock <= p.low_stock_threshold AND p.current_stock > 0
     ORDER BY p.current_stock ASC`
  );
  
  return result.map(row => ({
    productId: row.productId,
    productName: row.productName,
    currentStock: row.currentStock,
    lowStockThreshold: row.lowStockThreshold,
    isLowStock: true,
    stockStatus: getStockStatus(row.currentStock, row.lowStockThreshold),
    lastUpdated: new Date(row.lastUpdated)
  }));
};

export const getStockOverview = async (): Promise<ProductStock[]> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      p.id as productId, p.name as productName, p.current_stock as currentStock,
      p.low_stock_threshold as lowStockThreshold, p.updated_at as lastUpdated
     FROM products p 
     ORDER BY p.name ASC`
  );
  
  return result.map(row => ({
    productId: row.productId,
    productName: row.productName,
    currentStock: row.currentStock,
    lowStockThreshold: row.lowStockThreshold,
    isLowStock: row.currentStock <= row.lowStockThreshold,
    stockStatus: getStockStatus(row.currentStock, row.lowStockThreshold),
    lastUpdated: new Date(row.lastUpdated)
  }));
};

// Stock validation
export const validateStockOperation = async (
  productId: string, 
  quantity: number, 
  operation: 'ADD' | 'REMOVE'
): Promise<StockValidationResult> => {
  const currentStock = await getProductStock(productId);
  
  const result: StockValidationResult = {
    isValid: true,
    canProceed: true,
    warnings: [],
    errors: []
  };

  if (quantity <= 0) {
    result.errors.push('Quantity must be greater than 0');
    result.isValid = false;
    result.canProceed = false;
  }

  if (operation === 'REMOVE' && quantity > currentStock) {
    result.warnings.push(`Insufficient stock: requested ${quantity}, available ${currentStock}`);
    // Allow the operation but show warning
  }

  return result;
};

// Helper functions
function parseStockTransaction(row: any): StockTransaction {
  return {
    id: row.id,
    productId: row.productId,
    transactionType: row.transactionType,
    quantity: row.quantity,
    reason: row.reason,
    referenceId: row.referenceId,
    purchaseCost: row.purchaseCost,
    expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
    comments: row.comments,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function getSortColumn(sortField: string): string {
  const columnMap: Record<string, string> = {
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'transactionType': 'transaction_type',
    'quantity': 'quantity',
    'reason': 'reason',
    'purchaseCost': 'purchase_cost'
  };
  
  return columnMap[sortField] || 'created_at';
}

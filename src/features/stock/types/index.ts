export interface StockTransaction {
  id: string;
  productId: string;
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: 'PURCHASE' | 'SALE' | 'EXPIRED' | 'DAMAGED' | 'LOST' | 'OTHER';
  referenceId?: string;
  purchaseCost?: number;
  expiryDate?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockTransactionRequest {
  productId: string;
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: 'PURCHASE' | 'SALE' | 'EXPIRED' | 'DAMAGED' | 'LOST' | 'OTHER';
  referenceId?: string;
  purchaseCost?: number;
  expiryDate?: Date;
  comments?: string;
}

export interface StockAdjustmentRequest {
  productId: string;
  quantity: number;
  adjustmentType: 'ADD' | 'REMOVE';
  reason: 'EXPIRED' | 'DAMAGED' | 'LOST' | 'OTHER';
  comments?: string;
}

export interface ProductStock {
  productId: string;
  productName: string;
  currentStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: Date;
}

export interface StockValidationResult {
  isValid: boolean;
  canProceed: boolean;
  warnings: string[];
  errors: string[];
}

export interface StockFilterOptions {
  productId?: string;
  transactionType?: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason?: 'PURCHASE' | 'SALE' | 'EXPIRED' | 'DAMAGED' | 'LOST' | 'OTHER';
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

export interface StockAdjustmentFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
}

export interface StockTransactionsTableProps {
  data: StockTransaction[];
  loading?: boolean;
  productFilter?: boolean;
}

export interface StockLevelIndicatorProps {
  currentStock: number;
  lowStockThreshold: number;
  size?: 'small' | 'default' | 'large';
  showText?: boolean;
}

export interface LowStockAlertProps {
  productCount: number;
  onClick?: () => void;
}

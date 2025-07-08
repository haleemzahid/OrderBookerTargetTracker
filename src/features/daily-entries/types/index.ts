import type { OrderBooker } from '../../order-bookers/types';
import type { Product } from '../../products/types';

export interface DailyEntry {
  id: string;
  orderBookerId: string;
  date: Date;
  notes?: string;
  totalAmount: number;
  totalReturnAmount: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  orderBooker?: OrderBooker;
  items?: DailyEntryItem[];
}

export interface DailyEntryItem {
  id: string;
  dailyEntryId: string;
  productId: string;
  quantitySold: number;
  quantityReturned: number;
  netQuantity: number;
  costPriceOverride?: number;
  sellPriceOverride?: number;
  totalCost: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  product?: Product;
}

export interface CreateDailyEntryRequest {
  orderBookerId: string;
  date: Date | string;
  notes?: string;
  items: CreateDailyEntryItemRequest[];
}

export interface CreateDailyEntryItemRequest {
  productId: string;
  quantitySold: number;
  quantityReturned?: number;
  costPriceOverride?: number;
  sellPriceOverride?: number;
}

export interface UpdateDailyEntryRequest {
  notes?: string;
  items?: UpdateDailyEntryItemRequest[];
}

export interface UpdateDailyEntryItemRequest {
  id?: string; // If provided, update existing; if not, create new
  productId: string;
  quantitySold: number;
  quantityReturned?: number;
  costPriceOverride?: number;
  sellPriceOverride?: number;
}

export interface DailyEntryFilters {
  orderBookerIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  month?: number;
  year?: number;
}

export interface MonthlyAnalytics {
  totalAmount: number;
  totalReturnAmount: number;
  netAmount: number;
  totalQuantitySold: number;
  totalQuantityReturned: number;
  netQuantity: number;
  entriesCount: number;
  itemsCount: number;
  averageDailyAmount: number;
  returnRate: number;
  quantityReturnRate: number;
}

export interface DailyEntryWithOrderBooker extends Omit<DailyEntry, 'orderBooker'> {
  orderBooker?: {
    id: string;
    name: string;
    nameUrdu: string;
    phone: string;
    email?: string;
  };
}

export interface DailyEntryWithItems extends DailyEntry {
  items: DailyEntryItem[];
}

export interface ReturnEntryRequest {
  originalEntryId: string;
  returns: Array<{
    productId: string;
    returnQuantity: number;
    reason?: string;
  }>;
}

export interface QuantityInput {
  cartons: number;
  units: number;
  totalUnits: number; // Auto-calculated
}

// Legacy interfaces for migration compatibility
export interface LegacyDailyEntry {
  id: string;
  orderBookerId: string;
  date: Date;
  sales: number;
  returns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegacyCreateDailyEntryRequest {
  orderBookerId: string;
  date: Date;
  sales: number;
  returns: number;
  totalCarton: number;
  returnCarton: number;
  notes?: string;
}

export interface LegacyUpdateDailyEntryRequest {
  sales?: number;
  returns?: number;
  totalCarton?: number;
  returnCarton?: number;
  notes?: string;
}

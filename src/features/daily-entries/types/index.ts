export interface DailyEntry {
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

export interface CreateDailyEntryRequest {
  orderBookerId: string;
  date: Date;
  sales: number;
  returns: number;
  totalCarton: number;
  returnCarton: number;
  notes?: string;
}

export interface UpdateDailyEntryRequest {
  sales?: number;
  returns?: number;
  totalCarton?: number;
  returnCarton?: number;
  notes?: string;
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
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  entriesCount: number;
  averageDailySales: number;
  returnRate: number;
  cartonReturnRate: number;
}

export interface DailyEntryWithOrderBooker extends DailyEntry {
  orderBooker?: {
    id: string;
    name: string;
    nameUrdu: string;
    phone: string;
    email?: string;
  };
}

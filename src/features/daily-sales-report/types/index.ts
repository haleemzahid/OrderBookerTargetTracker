export interface DailySalesReportItem {
  productId: string;
  productName: string;
  sellPrice: number;
  costPrice: number;
  totalCartons: number;
  returnCartons: number;
  netCartons: number; // calculated: totalCartons - returnCartons
  totalAmount: number;
  returnAmount: number;
  netAmount: number; // calculated: totalAmount - returnAmount
  profit: number; // calculated: netAmount - (costPrice * netCartons)
  profitMargin: number; // calculated percentage: (profit / netAmount) * 100
}

export interface DailySalesReportFilters {
  fromDate?: Date;
  toDate?: Date;
}

export interface DailySalesReportSummary {
  totalCartons: number;
  totalReturnCartons: number;
  totalNetCartons: number;
  totalAmount: number;
  totalReturnAmount: number;
  totalNetAmount: number;
  totalProfit: number;
  overallProfitMargin: number;
}

export interface DailySalesReportTableProps {
  data: DailySalesReportItem[];
  loading?: boolean;
  summary?: DailySalesReportSummary;
}

export interface DailySalesReportPageProps {
  filters?: DailySalesReportFilters;
}

export interface DateFilterProps {
  value?: DailySalesReportFilters;
  onChange: (filters: DailySalesReportFilters) => void;
  loading?: boolean;
}

// Internal database row interface (before transformation)
export interface DailySalesReportRow {
  product_id: string;
  product_name: string;
  sell_price: number;
  cost_price: number;
  total_cartons: number;
  return_cartons: number;
  total_amount: number;
  return_amount: number;
  profit: number;
}

import { getDatabase } from '../../../services/database';
import type {
  DailySalesReportItem,
  DailySalesReportFilters,
  DailySalesReportSummary,
  DailySalesReportRow,
} from '../types';

export interface IDailySalesReportService {
  getDailySalesReport(filters?: DailySalesReportFilters): Promise<DailySalesReportItem[]>;
  getDailySalesReportSummary(filters?: DailySalesReportFilters): Promise<DailySalesReportSummary>;
}

/**
 * Transform database row to DailySalesReportItem with calculated fields
 */
const transformRowToItem = (row: DailySalesReportRow): DailySalesReportItem => {
  const netCartons = row.total_cartons - row.return_cartons;
  const netAmount = row.total_amount - row.return_amount;
  const profit = netAmount - (row.cost_price * netCartons);
  const profitMargin = netAmount > 0 ? (profit / netAmount) * 100 : 0;

  return {
    productId: row.product_id,
    productName: row.product_name,
    sellPrice: row.sell_price,
    costPrice: row.cost_price,
    totalCartons: row.total_cartons,
    returnCartons: row.return_cartons,
    netCartons,
    totalAmount: row.total_amount,
    returnAmount: row.return_amount,
    netAmount,
    profit,
    profitMargin,
  };
};

/**
 * Build WHERE clause for date filtering
 */
const buildDateFilter = (filters?: DailySalesReportFilters): { clause: string; params: any[] } => {
  const params: any[] = [];
  let clause = '';

  if (filters?.fromDate) {
    clause += ' AND o.order_date >= ?';
    params.push(filters.fromDate.toISOString().split('T')[0]); // Convert to YYYY-MM-DD format
  }

  if (filters?.toDate) {
    clause += ' AND o.order_date <= ?';
    params.push(filters.toDate.toISOString().split('T')[0]); // Convert to YYYY-MM-DD format
  }

  return { clause, params };
};

export const dailySalesReportService: IDailySalesReportService = {
  getDailySalesReport: async (filters?: DailySalesReportFilters): Promise<DailySalesReportItem[]> => {
    const db = getDatabase();
    
    const { clause: dateClause, params: dateParams } = buildDateFilter(filters);

    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        oi.sell_price,
        oi.cost_price,
        SUM(oi.cartons) as total_cartons,
        SUM(oi.return_cartons) as return_cartons,
        SUM(oi.total_amount) as total_amount,
        SUM(oi.return_amount) as return_amount,
        SUM(oi.profit) as profit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${dateClause}
      GROUP BY p.id, oi.sell_price, oi.cost_price
      ORDER BY p.name, oi.sell_price
    `;

    const result = await db.select<DailySalesReportRow[]>(query, dateParams);
    return result.map(transformRowToItem);
  },

  getDailySalesReportSummary: async (filters?: DailySalesReportFilters): Promise<DailySalesReportSummary> => {
    const db = getDatabase();
    
    const { clause: dateClause, params: dateParams } = buildDateFilter(filters);

    const query = `
      SELECT 
        SUM(oi.cartons) as total_cartons,
        SUM(oi.return_cartons) as total_return_cartons,
        SUM(oi.total_amount) as total_amount,
        SUM(oi.return_amount) as total_return_amount,
        SUM(oi.profit) as total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${dateClause}
    `;

    const result = await db.select<any[]>(query, dateParams);
    const row = result[0] || {};

    const totalCartons = row.total_cartons || 0;
    const totalReturnCartons = row.total_return_cartons || 0;
    const totalNetCartons = totalCartons - totalReturnCartons;
    const totalAmount = row.total_amount || 0;
    const totalReturnAmount = row.total_return_amount || 0;
    const totalNetAmount = totalAmount - totalReturnAmount;
    const totalProfit = row.total_profit || 0;
    const overallProfitMargin = totalNetAmount > 0 ? (totalProfit / totalNetAmount) * 100 : 0;

    return {
      totalCartons,
      totalReturnCartons,
      totalNetCartons,
      totalAmount,
      totalReturnAmount,
      totalNetAmount,
      totalProfit,
      overallProfitMargin,
    };
  },
};

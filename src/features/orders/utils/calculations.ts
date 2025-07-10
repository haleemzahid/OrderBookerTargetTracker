import Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '../../../services/database';

export interface OrderItemCalculation {
  totalCost: number;
  totalAmount: number;
  profit: number;
  cartons: number;
  returnAmount: number;
  returnCartons: number;
}

export interface OrderCalculation {
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  totalCartons: number;
  returnCartons: number;
  returnAmount: number;
}

/**
 * Calculate totals for an order item
 */
export const calculateOrderItemTotals = async (
  productId: string,
  quantity: number,
  costPrice: number,
  sellPrice: number,
  db: Database,
  returnQuantity: number = 0
): Promise<OrderItemCalculation> => {
  // Get unit per carton from product
  const productResult = await db.select<any[]>(
    'SELECT unit_per_carton FROM products WHERE id = ?',
    [productId]
  );
  
  const unitPerCarton = productResult[0]?.unit_per_carton || 1;
  
  const totalCost = quantity * costPrice;
  const totalAmount = quantity * sellPrice;
  const profit = totalAmount - totalCost;
  const cartons = unitPerCarton > 0 ? quantity / unitPerCarton : 0;
  const returnAmount = returnQuantity * sellPrice;
  const returnCartons = unitPerCarton > 0 ? returnQuantity / unitPerCarton : 0;
  
  return {
    totalCost,
    totalAmount,
    profit,
    cartons,
    returnAmount,
    returnCartons
  };
};

/**
 * Calculate totals for an entire order based on its order items
 */
export const calculateOrderTotals = async (orderId: string): Promise<OrderCalculation> => {
  const db = getDatabase();
  
  const result = await db.select<any[]>(
    `SELECT 
      COALESCE(SUM(total_amount), 0) as totalAmount,
      COALESCE(SUM(total_cost), 0) as totalCost,
      COALESCE(SUM(profit), 0) as totalProfit,
      COALESCE(SUM(cartons), 0) as totalCartons,
      COALESCE(SUM(return_cartons), 0) as returnCartons,
      COALESCE(SUM(return_amount), 0) as returnAmount
     FROM order_items 
     WHERE order_id = ?`,
    [orderId]
  );
  
  const row = result[0] || {};
  
  return {
    totalAmount: row.totalAmount || 0,
    totalCost: row.totalCost || 0,
    totalProfit: row.totalProfit || 0,
    totalCartons: row.totalCartons || 0,
    returnCartons: row.returnCartons || 0,
    returnAmount: row.returnAmount || 0
  };
};

/**
 * Update order totals in the database
 */
export const updateOrderTotals = async (orderId: string): Promise<void> => {
  const db = getDatabase();
  const totals = await calculateOrderTotals(orderId);
  
  await db.execute(
    `UPDATE orders SET
      total_amount = ?,
      total_cost = ?,
      total_profit = ?,
      total_cartons = ?,
      return_cartons = ?,
      return_amount = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
    [
      totals.totalAmount,
      totals.totalCost,
      totals.totalProfit,
      totals.totalCartons,
      totals.returnCartons,
      totals.returnAmount,
      orderId
    ]
  );
};

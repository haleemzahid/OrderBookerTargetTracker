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
  returnQuantity: number = 0
): Promise<OrderItemCalculation> => {
  const db = getDatabase();
  
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

/**
 * Recalculate all order item totals and order totals
 * Useful for fixing data that might have missing calculations
 */
export const recalculateAllOrderTotals = async (): Promise<void> => {
  const db = getDatabase();
  
  console.log('Starting recalculation of all order totals...');
  
  try {
    // Get all order items that need recalculation
    const orderItems = await db.select<any[]>(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, 
              oi.cost_price, oi.sell_price, oi.return_quantity,
              p.unit_per_carton
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id`
    );
    
    console.log(`Found ${orderItems.length} order items to recalculate`);
    
    // Update each order item with calculated totals
    for (const item of orderItems) {
      const totals = await calculateOrderItemTotals(
        item.product_id,
        item.quantity,
        item.cost_price,
        item.sell_price,
        item.return_quantity || 0
      );
      
      await db.execute(
        `UPDATE order_items SET
          total_cost = ?,
          total_amount = ?,
          profit = ?,
          cartons = ?,
          return_amount = ?,
          return_cartons = ?,
          updated_at = datetime('now')
         WHERE id = ?`,
        [
          totals.totalCost,
          totals.totalAmount,
          totals.profit,
          totals.cartons,
          totals.returnAmount,
          totals.returnCartons,
          item.id
        ]
      );
    }
    
    // Get all orders and update their totals
    const orders = await db.select<any[]>('SELECT id FROM orders');
    console.log(`Found ${orders.length} orders to recalculate`);
    
    for (const order of orders) {
      await updateOrderTotals(order.id);
    }
    
    console.log('Finished recalculating all order totals');
  } catch (error) {
    console.error('Error recalculating order totals:', error);
    throw error;
  }
};

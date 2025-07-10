import { getDatabase } from '../../../services/database';
import { 
  Order, 
  OrderItem, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  CreateOrderItemRequest,
  UpdateOrderItemRequest,
  OrderFilters,
  OrderSummary 
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { updateOrderTotals } from '../utils/calculations';

// Order CRUD Operations
export const getOrderById = async (id: string): Promise<Order | null> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      id, order_booker_id as orderBookerId, order_date as orderDate,
      supply_date as supplyDate, total_amount as totalAmount, total_cost as totalCost,
      total_profit as totalProfit, total_cartons as totalCartons, 
      return_cartons as returnCartons, return_amount as returnAmount,
      status, notes, created_at as createdAt, updated_at as updatedAt
     FROM orders 
     WHERE id = ?`,
    [id]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return parseOrder(result[0]);
};

export const getOrders = async (options?: OrderFilters): Promise<Order[]> => {
  const db = getDatabase();
  let query = `
    SELECT 
      id, order_booker_id as orderBookerId, order_date as orderDate,
      supply_date as supplyDate, total_amount as totalAmount, total_cost as totalCost,
      total_profit as totalProfit, total_cartons as totalCartons, 
      return_cartons as returnCartons, return_amount as returnAmount,
      status, notes, created_at as createdAt, updated_at as updatedAt
    FROM orders
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (options?.orderBookerId) {
    query += ` AND order_booker_id = ?`;
    params.push(options.orderBookerId);
  }
  
  if (options?.status) {
    query += ` AND status = ?`;
    params.push(options.status);
  }
  
  if (options?.dateFrom) {
    query += ` AND order_date >= ?`;
    params.push(options.dateFrom.toISOString().split('T')[0]);
  }
  
  if (options?.dateTo) {
    query += ` AND order_date <= ?`;
    params.push(options.dateTo.toISOString().split('T')[0]);
  }
  
  if (options?.searchTerm) {
    query += ` AND notes LIKE ?`;
    params.push(`%${options.searchTerm}%`);
  }
  
  if (options?.sortBy) {
    const sortColumn = getSortColumn(options.sortBy);
    const sortDirection = options.sortOrder === 'descend' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
  } else {
    query += ` ORDER BY order_date DESC, created_at DESC`;
  }
  console.log(query);
  const result = await db.select<any[]>(query, params);
  return result.map(row => parseOrder(row));
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const orderId = uuidv4();
  
  try {
    // Use just BEGIN for SQLite
    await db.execute('BEGIN');
    console.log("Transaction started");
    
    // Calculate order item totals first
    const orderItemsWithTotals = [];
    let orderTotalAmount = 0;
    let orderTotalCost = 0;
    let orderTotalProfit = 0;
    let orderTotalCartons = 0;
    let orderReturnCartons = 0;
    let orderReturnAmount = 0;
    
    for (const item of orderData.items) {
      const itemId = uuidv4();
      
      // Simple inline calculations without external method calls
      const totalCost = item.quantity * item.costPrice;
      const totalAmount = item.quantity * item.sellPrice;
      const profit = totalAmount - totalCost;
      const cartons = Math.floor(item.quantity / 12); // Assuming 12 units per carton
      const returnCartons = 0; // No returns for new orders
      const returnAmount = 0; // No returns for new orders
      
      const totals = {
        totalCost,
        totalAmount,
        profit,
        cartons,
        returnCartons,
        returnAmount
      };
      
      orderItemsWithTotals.push({
        itemId,
        item,
        totals
      });
      
      // Accumulate order totals
      orderTotalAmount += totals.totalAmount;
      orderTotalCost += totals.totalCost;
      orderTotalProfit += totals.profit;
      orderTotalCartons += totals.cartons;
      orderReturnCartons += totals.returnCartons;
      orderReturnAmount += totals.returnAmount;
    }
    
    // Create the order with calculated totals
    await db.execute(
      `INSERT INTO orders (
        id, order_booker_id, order_date, supply_date, status, notes,
        total_amount, total_cost, total_profit, total_cartons,
        return_cartons, return_amount, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderData.orderBookerId,
        orderData.orderDate.toISOString().split('T')[0],
        orderData.supplyDate ? orderData.supplyDate.toISOString().split('T')[0] : null,
        'pending',
        orderData.notes || null,
        orderTotalAmount,
        orderTotalCost,
        orderTotalProfit,
        orderTotalCartons,
        orderReturnCartons,
        orderReturnAmount,
        now,
        now
      ]
    );
    
    // Create order items with pre-calculated totals
    for (const { itemId, item, totals } of orderItemsWithTotals) {
      await db.execute(
        `INSERT INTO order_items (
          id, order_id, product_id, quantity, cost_price, sell_price, 
          return_quantity, total_cost, total_amount, profit, cartons, 
          return_amount, return_cartons, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          orderId,
          item.productId,
          item.quantity,
          item.costPrice,
          item.sellPrice,
          0, // No return quantity for new items
          totals.totalCost,
          totals.totalAmount,
          totals.profit,
          totals.cartons,
          totals.returnAmount,
          totals.returnCartons,
          now,
          now
        ]
      );
    }
    
    await db.execute('COMMIT');
    console.log("Transaction committed");
    
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error(`Failed to retrieve created order with ID ${orderId}`);
    }
    
    return order;
  } catch (error) {
    console.log('Error:', error);
    try {
      await db.execute('ROLLBACK');
    } catch (rollbackError) {
      console.log('Rollback error:', rollbackError);
    }
    throw error;
  }
};

export const updateOrder = async (id: string, orderData: UpdateOrderRequest): Promise<Order> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // Build dynamic update query
  const updateFields: string[] = [];
  const params: any[] = [];
  
  if (orderData.orderBookerId !== undefined) {
    updateFields.push(`order_booker_id = ?`);
    params.push(orderData.orderBookerId);
  }
  
  if (orderData.orderDate !== undefined) {
    updateFields.push(`order_date = ?`);
    params.push(orderData.orderDate.toISOString().split('T')[0]);
  }
  
  if (orderData.supplyDate !== undefined) {
    updateFields.push(`supply_date = ?`);
    params.push(orderData.supplyDate ? orderData.supplyDate.toISOString().split('T')[0] : null);
  }
  
  if (orderData.status !== undefined) {
    updateFields.push(`status = ?`);
    params.push(orderData.status);
  }
  
  if (orderData.notes !== undefined) {
    updateFields.push(`notes = ?`);
    params.push(orderData.notes);
  }
  
  // Add updated_at to fields and params
  updateFields.push(`updated_at = ?`);
  params.push(now);
  
  // Add id parameter at the end
  params.push(id);
  
  const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
  await db.execute(query, params);
  
  // Get the updated order
  const updatedOrder = await getOrderById(id);
  if (!updatedOrder) {
    throw new Error(`Failed to retrieve updated order with ID ${id}`);
  }
  
  return updatedOrder;
};

export const deleteOrder = async (id: string): Promise<void> => {
  const db = getDatabase();
  
  // Order items will be deleted automatically via CASCADE
  await db.execute(`DELETE FROM orders WHERE id = ?`, [id]);
};

// Order Items CRUD Operations
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      id, order_id as orderId, product_id as productId, quantity,
      cost_price as costPrice, sell_price as sellPrice, 
      total_cost as totalCost, total_amount as totalAmount, profit,
      cartons, return_quantity as returnQuantity, 
      return_amount as returnAmount, return_cartons as returnCartons,
      created_at as createdAt, updated_at as updatedAt
     FROM order_items 
     WHERE order_id = ?
     ORDER BY created_at ASC`,
    [orderId]
  );
  
  return result.map(row => parseOrderItem(row));
};

export const createOrderItem = async (orderId: string, itemData: CreateOrderItemRequest): Promise<OrderItem> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const itemId = uuidv4();
  
  // Simple inline calculations
  const totalCost = itemData.quantity * itemData.costPrice;
  const totalAmount = itemData.quantity * itemData.sellPrice;
  const profit = totalAmount - totalCost;
  const cartons = Math.floor(itemData.quantity / 12); // Assuming 12 units per carton
  const returnAmount = 0; // No returns for new items
  const returnCartons = 0; // No returns for new items
  
  await db.execute(
    `INSERT INTO order_items (
      id, order_id, product_id, quantity, cost_price, sell_price,
      return_quantity, total_cost, total_amount, profit, cartons,
      return_amount, return_cartons, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      orderId,
      itemData.productId,
      itemData.quantity,
      itemData.costPrice,
      itemData.sellPrice,
      0,
      totalCost,
      totalAmount,
      profit,
      cartons,
      returnAmount,
      returnCartons,
      now,
      now
    ]
  );
  
  // Update order totals
  await updateOrderTotals(orderId);
  
  const items = await getOrderItems(orderId);
  const newItem = items.find(item => item.id === itemId);
  if (!newItem) {
    throw new Error(`Failed to retrieve created order item with ID ${itemId}`);
  }
  
  return newItem;
};

export const updateOrderItem = async (itemId: string, itemData: UpdateOrderItemRequest): Promise<OrderItem> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // Get current item data to calculate totals
  const currentItemResult = await db.select<any[]>(
    `SELECT order_id, product_id, quantity, cost_price, sell_price, return_quantity 
     FROM order_items WHERE id = ?`,
    [itemId]
  );
  
  if (currentItemResult.length === 0) {
    throw new Error(`Order item with ID ${itemId} not found`);
  }
  
  const currentItem = currentItemResult[0];
  const orderId = currentItem.order_id;
  
  // Build dynamic update query
  const updateFields: string[] = [];
  const params: any[] = [];
  
  // Determine new values
  const newQuantity = itemData.quantity !== undefined ? itemData.quantity : currentItem.quantity;
  const newSellPrice = itemData.sellPrice !== undefined ? itemData.sellPrice : currentItem.sell_price;
  const newReturnQuantity = itemData.returnQuantity !== undefined ? itemData.returnQuantity : currentItem.return_quantity;
  
  // Simple inline calculations
  const totalCost = newQuantity * currentItem.cost_price;
  const totalAmount = newQuantity * newSellPrice;
  const profit = totalAmount - totalCost;
  const cartons = Math.floor(newQuantity / 12); // Assuming 12 units per carton
  const returnAmount = newReturnQuantity * newSellPrice;
  const returnCartons = Math.floor(newReturnQuantity / 12);
  
  if (itemData.quantity !== undefined) {
    updateFields.push(`quantity = ?`);
    params.push(itemData.quantity);
  }
  
  if (itemData.sellPrice !== undefined) {
    updateFields.push(`sell_price = ?`);
    params.push(itemData.sellPrice);
  }
  
  if (itemData.returnQuantity !== undefined) {
    updateFields.push(`return_quantity = ?`);
    params.push(itemData.returnQuantity);
  }
  
  // Add calculated fields
  updateFields.push(
    `total_cost = ?`,
    `total_amount = ?`,
    `profit = ?`,
    `cartons = ?`,
    `return_amount = ?`,
    `return_cartons = ?`,
    `updated_at = ?`
  );
  
  params.push(
    totalCost,
    totalAmount,
    profit,
    cartons,
    returnAmount,
    returnCartons,
    now
  );
  
  // Add itemId parameter at the end
  params.push(itemId);
  
  const query = `UPDATE order_items SET ${updateFields.join(', ')} WHERE id = ?`;
  await db.execute(query, params);
  
  // Update order totals
  await updateOrderTotals(orderId);
  
  // Get the updated order item
  const result = await db.select<any[]>(
    `SELECT 
      id, order_id as orderId, product_id as productId, quantity,
      cost_price as costPrice, sell_price as sellPrice, 
      total_cost as totalCost, total_amount as totalAmount, profit,
      cartons, return_quantity as returnQuantity, 
      return_amount as returnAmount, return_cartons as returnCartons,
      created_at as createdAt, updated_at as updatedAt
     FROM order_items 
     WHERE id = ?`,
    [itemId]
  );
  
  if (result.length === 0) {
    throw new Error(`Failed to retrieve updated order item with ID ${itemId}`);
  }
  
  return parseOrderItem(result[0]);
};

export const deleteOrderItem = async (itemId: string): Promise<void> => {
  const db = getDatabase();
  
  // Get the order ID before deleting the item
  const result = await db.select<any[]>(
    'SELECT order_id FROM order_items WHERE id = ?',
    [itemId]
  );
  
  if (result.length === 0) {
    throw new Error(`Order item with ID ${itemId} not found`);
  }
  
  const orderId = result[0].order_id;
  
  // Delete the order item
  await db.execute(`DELETE FROM order_items WHERE id = ?`, [itemId]);
  
  // Update order totals
  await updateOrderTotals(orderId);
};

// Summary and Analytics
export const getOrderSummary = async (filters?: OrderFilters): Promise<OrderSummary> => {
  const orders = await getOrders(filters);
  
  return {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    totalProfit: orders.reduce((sum, order) => sum + order.totalProfit, 0),
    totalCartons: orders.reduce((sum, order) => sum + order.totalCartons, 0),
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    suppliedOrders: orders.filter(order => order.status === 'supplied').length,
    completedOrders: orders.filter(order => order.status === 'completed').length,
  };
};

// Helper functions
function parseOrder(row: any): Order {
  return {
    id: row.id,
    orderBookerId: row.orderBookerId,
    orderDate: new Date(row.orderDate),
    supplyDate: row.supplyDate ? new Date(row.supplyDate) : null,
    totalAmount: row.totalAmount,
    totalCost: row.totalCost,
    totalProfit: row.totalProfit,
    totalCartons: row.totalCartons,
    returnCartons: row.returnCartons,
    returnAmount: row.returnAmount,
    status: row.status,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function parseOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    quantity: row.quantity,
    costPrice: row.costPrice,
    sellPrice: row.sellPrice,
    totalCost: row.totalCost,
    totalAmount: row.totalAmount,
    profit: row.profit,
    cartons: row.cartons,
    returnQuantity: row.returnQuantity,
    returnAmount: row.returnAmount,
    returnCartons: row.returnCartons,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function getSortColumn(sortField: string): string {
  const columnMap: Record<string, string> = {
    'orderDate': 'order_date',
    'supplyDate': 'supply_date',
    'totalAmount': 'total_amount',
    'totalCost': 'total_cost',
    'totalProfit': 'total_profit',
    'totalCartons': 'total_cartons',
    'status': 'status',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  };
  
  return columnMap[sortField] || 'order_date';
}

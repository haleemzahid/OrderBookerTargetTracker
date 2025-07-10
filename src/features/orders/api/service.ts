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
  
  // Start transaction
  await db.execute('BEGIN TRANSACTION');
  
  try {
    // Create the order
    await db.execute(
      `INSERT INTO orders (
        id, order_booker_id, order_date, supply_date, status, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderData.orderBookerId,
        orderData.orderDate.toISOString().split('T')[0],
        orderData.supplyDate ? orderData.supplyDate.toISOString().split('T')[0] : null,
        'pending',
        orderData.notes || null,
        now,
        now
      ]
    );
    
    // Create order items directly in the transaction
    for (const item of orderData.items) {
      const itemId = uuidv4();
      await db.execute(
        `INSERT INTO order_items (
          id, order_id, product_id, quantity, cost_price, sell_price, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          orderId,
          item.productId,
          item.quantity,
          item.costPrice,
          item.sellPrice,
          now,
          now
        ]
      );
    }
    
    await db.execute('COMMIT');
    
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error(`Failed to retrieve created order with ID ${orderId}`);
    }
    
    return order;
  } catch (error) {
    await db.execute('ROLLBACK');
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
  
  await db.execute(
    `INSERT INTO order_items (
      id, order_id, product_id, quantity, cost_price, sell_price, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      orderId,
      itemData.productId,
      itemData.quantity,
      itemData.costPrice,
      itemData.sellPrice,
      now,
      now
    ]
  );
  
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
  
  // Build dynamic update query
  const updateFields: string[] = [];
  const params: any[] = [];
  
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
  
  // Add updated_at to fields and params
  updateFields.push(`updated_at = ?`);
  params.push(now);
  
  // Add itemId parameter at the end
  params.push(itemId);
  
  const query = `UPDATE order_items SET ${updateFields.join(', ')} WHERE id = ?`;
  await db.execute(query, params);
  
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
  await db.execute(`DELETE FROM order_items WHERE id = ?`, [itemId]);
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

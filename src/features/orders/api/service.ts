import { getDatabase } from '../../../services/database';
import {
  Order,
  OrderItem,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderWithItemsRequest,
  CreateOrderItemRequest,
  UpdateOrderItemRequest,
  OrderFilters,
  OrderSummary
} from '../types';
import { getProductById } from '../../products/api/service';
import { orderBookerService } from '../../order-bookers/api/service';
import customerService from '../../customers/api/service';
import { v4 as uuidv4 } from 'uuid';
import { updateOrderTotals, calculateOrderItemTotals } from '../utils/calculations';

// Order CRUD Operations
export const getOrderById = async (id: string): Promise<Order | null> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      o.id, o.order_booker_id as orderBookerId, o.order_date as orderDate,
      o.total_amount as totalAmount, o.total_cost as totalCost,
      o.total_profit as totalProfit, o.total_cartons as totalCartons, 
      o.return_cartons as returnCartons, o.return_amount as returnAmount,
      o.status, o.notes, o.created_at as createdAt, o.updated_at as updatedAt,
      o.customer_id as customerId, o.payment_terms as paymentTerms, 
      o.credit_used as creditUsed, o.payment_due_date as paymentDueDate,
      o.credit_approved_by as creditApprovedBy, o.credit_approval_reason as creditApprovalReason,
      c.name as customerName
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.id = ?`,
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
      o.id, o.order_booker_id as orderBookerId, o.order_date as orderDate,
      o.total_amount as totalAmount, o.total_cost as totalCost,
      o.total_profit as totalProfit, o.total_cartons as totalCartons, 
      o.return_cartons as returnCartons, o.return_amount as returnAmount,
      o.status, o.notes, o.created_at as createdAt, o.updated_at as updatedAt,
      o.customer_id as customerId, o.payment_terms as paymentTerms, 
      o.credit_used as creditUsed, o.payment_due_date as paymentDueDate,
      o.credit_approved_by as creditApprovedBy, o.credit_approval_reason as creditApprovalReason,
      c.name as customerName
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.orderBookerId) {
    query += ` AND o.order_booker_id = ?`;
    params.push(options.orderBookerId);
  }

  if (options?.customerId) {
    query += ` AND o.customer_id = ?`;
    params.push(options.customerId);
  }

  if (options?.paymentTerms) {
    query += ` AND o.payment_terms = ?`;
    params.push(options.paymentTerms);
  }

  if (options?.dateFrom) {
    query += ` AND o.order_date >= ?`;
    params.push(options.dateFrom.toISOString().split('T')[0]);
  }

  if (options?.dateTo) {
    query += ` AND o.order_date <= ?`;
    params.push(options.dateTo.toISOString().split('T')[0]);
  }

  if (options?.searchTerm) {
    query += ` AND (o.notes LIKE ? OR c.name LIKE ?)`;
    params.push(`%${options.searchTerm}%`, `%${options.searchTerm}%`);
  }

  if (options?.sortBy) {
    const sortColumn = getSortColumn(options.sortBy);
    const sortDirection = options.sortOrder === 'descend' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
  } else {
    query += ` ORDER BY o.order_date DESC, o.created_at DESC`;
  }
  console.log(query);
  const result = await db.select<any[]>(query, params);
  return result.map(row => parseOrder(row));
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  const orderId = uuidv4();
  const now = new Date().toISOString();
  const db = getDatabase();
  console.log("Creating order with transaction");

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

    // Get product information to fetch units per carton
    const product = await getProductById(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    // Use centralized calculation function
    const calculatedTotals = await calculateOrderItemTotals(
      item.productId,
      item.cartons,
      item.costPrice,
      item.sellPrice,
      db,
      item.returnCartons || 0
    );

    const totals = {
      ...calculatedTotals,
      cartons: item.cartons,
      returnCartons: item.returnCartons || 0,
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
        id, order_booker_id, order_date, notes,
        total_amount, total_cost, total_profit, total_cartons,
        return_cartons, return_amount, 
        customer_id, payment_terms, credit_used, credit_approved_by, credit_approval_reason,
        created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderData.orderBookerId,
      orderData.orderDate.toISOString().split('T')[0],
      orderData.notes || null,
      orderTotalAmount,
      orderTotalCost,
      orderTotalProfit,
      orderTotalCartons,
      orderReturnCartons,
      orderReturnAmount,
      orderData.customerId || null,
      orderData.paymentTerms,
      orderData.paymentTerms === 'credit' ? orderTotalAmount : 0,
      null, // credit_approved_by - to be implemented with user authentication
      orderData.creditApprovalReason || null,
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
        item.cartons,
        item.costPrice,
        item.sellPrice,
        item.returnCartons,
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

  console.log("Order created successfully");

  // For credit orders, we'll mark the credit amount but only create
  // the actual credit transaction when the order is shipped
  if (orderData.paymentTerms === 'credit' && orderData.customerId) {
    try {
      // Get customer to calculate due date based on their credit terms
      const customer = await customerService.getById(orderData.customerId);
      
      if (customer) {
        // Calculate due date based on customer's credit days
        const orderDate = new Date(orderData.orderDate);
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + (customer.creditDays || 30)); // Default to 30 days if not specified
        
        // Update order with due date
        await db.execute(
          `UPDATE orders 
           SET payment_due_date = ?
           WHERE id = ?`,
          [dueDate.toISOString().split('T')[0], orderId]
        );
        
        console.log("Credit information prepared for order - transaction will be created on shipment");
      }
    } catch (error) {
      console.error("Failed to prepare credit information:", error);
      // Don't fail the order creation if credit transaction fails
      // But log the error for troubleshooting
    }
  }

  // Return the created order
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Failed to retrieve created order with ID ${orderId}`);
  }

  return order;
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

export const updateOrderWithItems = async (id: string, orderData: UpdateOrderWithItemsRequest): Promise<Order> => {
  const db = getDatabase();
  
  // Update order information first
  await updateOrder(id, {
    orderBookerId: orderData.orderBookerId,
    orderDate: orderData.orderDate,
    notes: orderData.notes
  });
  
  // Delete all existing order items for this order
  await db.execute(`DELETE FROM order_items WHERE order_id = ?`, [id]);
  
  // Create new order items
  for (const item of orderData.items) {
    await createOrderItem(id, item);
  }
  
  // Get the updated order with new totals
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
  const itemId = uuidv4();
  const now = new Date().toISOString();
const db = getDatabase();
  const product = await getProductById(itemData.productId);
  if (!product) {
    throw new Error(`Product with ID ${itemData.productId} not found`);
  }

  // Use centralized calculation function
  const calculatedTotals = await calculateOrderItemTotals(
    itemData.productId,
    itemData.cartons,
    itemData.costPrice,
    itemData.sellPrice,
    db,
    itemData.returnCartons || 0
  );

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
      itemData.cartons,
      itemData.costPrice,
      itemData.sellPrice,
      itemData.returnCartons || 0,
      calculatedTotals.totalCost,
      calculatedTotals.totalAmount,
      calculatedTotals.profit,
      itemData.cartons,
      calculatedTotals.returnAmount,
      itemData.returnCartons || 0,
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

  // Get product information to fetch units per carton
  const product = await getProductById(currentItem.product_id);
  if (!product) {
    throw new Error(`Product with ID ${currentItem.product_id} not found`);
  }

  // Build dynamic update query
  const updateFields: string[] = [];
  const params: any[] = [];

  // Determine new values
  const newQuantity = itemData.cartons !== undefined ? itemData.cartons : currentItem.quantity;
  const newSellPrice = itemData.sellPrice !== undefined ? itemData.sellPrice : currentItem.sell_price;
  const newReturnQuantity = itemData.returnCartons !== undefined ? itemData.returnCartons : currentItem.return_quantity;

  // Use centralized calculation function
  const calculatedTotals = await calculateOrderItemTotals(
    currentItem.product_id,
    newQuantity,
    currentItem.cost_price,
    newSellPrice,
    db,
    newReturnQuantity
  );

  if (itemData.cartons !== undefined) {
    updateFields.push(`quantity = ?`);
    params.push(itemData.cartons);
  }

  if (itemData.sellPrice !== undefined) {
    updateFields.push(`sell_price = ?`);
    params.push(itemData.sellPrice);
  }

  if (itemData.returnCartons !== undefined) {
    updateFields.push(`return_quantity = ?`);
    params.push(itemData.returnCartons);
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
    calculatedTotals.totalCost,
    calculatedTotals.totalAmount,
    calculatedTotals.profit,
    newQuantity,
    calculatedTotals.returnAmount,
    newReturnQuantity,
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
  };
};

// Helper functions
// Order Status Management
export const confirmAndShipOrder = async (orderId: string): Promise<Order> => {
  const db = getDatabase();
  
  try {
    // Get order details first
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status === 'shipped' || order.status === 'completed') {
      throw new Error('Order has already been shipped');
    }
    
    // Get order booker details for the comment
    const orderBooker = await orderBookerService.getById(order.orderBookerId);
    const orderBookerName = orderBooker?.name || 'Unknown Order Booker';
    
    // Get order items
    const orderItems = await getOrderItems(orderId);
    
    // Create stock OUT transactions for each order item
    for (const item of orderItems) {
      // Calculate total quantity to deduct (cartons * unit_per_carton)
      const product = await getProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const totalQuantityToDeduct = item.cartons;
      
      // Create stock transaction
      const transactionId = uuidv4();
      await db.execute(
        `INSERT INTO stock_transactions (
          id, product_id, transaction_type, quantity, reason, reference_id,
          comments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          item.productId,
          'OUT',
          totalQuantityToDeduct,
          'SALE',
          orderId,
          `Order shipment by ${orderBookerName} - ${item.cartons} cartons`,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
    }
    
    // Create credit transaction for credit orders upon shipment
    if (order.paymentTerms === 'credit' && order.customerId) {
      try {
        // Get customer for credit days
        const customer = await customerService.getById(order.customerId);
        
        if (customer) {
          // Calculate due date based on customer's credit days
          const orderDate = new Date(order.orderDate);
          const dueDate = new Date(orderDate);
          dueDate.setDate(dueDate.getDate() + (customer.creditDays || 30));
          
          // Create or update credit transaction for the shipped order
          await customerService.createCreditTransaction({
            customerId: order.customerId,
            transactionType: 'SALE',
            amount: order.totalAmount,
            orderId: order.id,
            dueDate: dueDate,
            notes: `Order #${order.id.substring(0, 8)} shipped by ${orderBookerName}`,
          });
          
          console.log(`Credit transaction updated for shipped order ${order.id}`);
          
          // Update order with payment due date
          await db.execute(
            `UPDATE orders 
             SET payment_due_date = ?,
                 updated_at = ?
             WHERE id = ?`,
            [dueDate.toISOString().split('T')[0], new Date().toISOString(), orderId]
          );
        }
      } catch (error) {
        console.error("Failed to create/update credit transaction for shipped order:", error);
        // Don't fail the order shipment if credit transaction fails
        // But log the error for troubleshooting
      }
    }
    
    // Update order status to shipped
    await db.execute(
      `UPDATE orders 
       SET status = 'shipped',
           updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), orderId]
    );
    
    
    // Return updated order
    const updatedOrder = await getOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Failed to retrieve updated order');
    }
    
    return updatedOrder;
    
  } catch (error) {
    throw error;
  }
};

function parseOrder(row: any): Order {
  return {
    id: row.id,
    orderBookerId: row.orderBookerId,
    orderDate: new Date(row.orderDate),
    totalAmount: row.totalAmount,
    totalCost: row.totalCost,
    totalProfit: row.totalProfit,
    totalCartons: row.totalCartons,
    returnCartons: row.returnCartons,
    returnAmount: row.returnAmount,
    status: row.status || 'pending',
    notes: row.notes,
    customerId: row.customerId,
    customerName: row.customerName,
    paymentTerms: row.paymentTerms || 'cash',
    creditUsed: row.creditUsed || 0,
    paymentDueDate: row.paymentDueDate ? new Date(row.paymentDueDate) : undefined,
    creditApprovedBy: row.creditApprovedBy,
    creditApprovalReason: row.creditApprovalReason,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function parseOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    cartons: row.quantity,
    costPrice: row.costPrice,
    sellPrice: row.sellPrice,
    totalCost: row.totalCost,
    totalAmount: row.totalAmount,
    profit: row.profit,
    returnCartons: row.returnCartons,
    returnAmount: row.returnAmount,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function getSortColumn(sortField: string): string {
  const columnMap: Record<string, string> = {
    'orderDate': 'o.order_date',
    'supplyDate': 'o.supply_date',
    'totalAmount': 'o.total_amount',
    'totalCost': 'o.total_cost',
    'totalProfit': 'o.total_profit',
    'totalCartons': 'o.total_cartons',
    'status': 'o.status',
    'createdAt': 'o.created_at',
    'updatedAt': 'o.updated_at',
    'customerName': 'c.name',
    'paymentTerms': 'o.payment_terms',
    'creditUsed': 'o.credit_used'
  };

  return columnMap[sortField] || 'o.order_date';
}

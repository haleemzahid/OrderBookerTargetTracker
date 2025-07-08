import { getDatabase } from '../../../services/database';
import { v4 as uuidv4 } from 'uuid';
import type {
  DailyEntry,
  DailyEntryItem,
  DailyEntryWithItems,
  CreateDailyEntryRequest,
  UpdateDailyEntryRequest,
  DailyEntryFilters,
  MonthlyAnalytics,
  DateRange
} from '../types';

export interface IDailyEntryService {
  getAll(filters?: DailyEntryFilters): Promise<DailyEntry[]>;
  getAllWithItems(filters?: DailyEntryFilters): Promise<DailyEntryWithItems[]>;
  getById(id: string): Promise<DailyEntry | null>;
  getWithItems(id: string): Promise<DailyEntryWithItems | null>;
  getByMonth(year: number, month: number): Promise<DailyEntry[]>;
  getByOrderBooker(orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]>;
  getByDateRange(startDate: string | Date, endDate: string | Date): Promise<DailyEntry[]>;
  create(entry: CreateDailyEntryRequest): Promise<DailyEntryWithItems>;
  update(id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntryWithItems>;
  delete(id: string): Promise<void>;
  getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalytics>;
  updateItemQuantityReturned(itemId: string, quantityReturned: number): Promise<DailyEntryItem>;
}

export const dailyEntryService: IDailyEntryService = {
  getAll: async (filters?: DailyEntryFilters): Promise<DailyEntry[]> => {
    const db = getDatabase();
    let query = 'SELECT * FROM daily_entries WHERE 1=1';
    const params: any[] = [];

    if (filters?.orderBookerIds && filters.orderBookerIds.length > 0) {
      query += ` AND order_booker_id IN (${filters.orderBookerIds.map(() => '?').join(', ')})`;
      params.push(...filters.orderBookerIds);
    }

    if (filters?.dateRange) {
      query += ' AND date >= ? AND date <= ?';
      params.push(
        filters.dateRange.startDate.toISOString().split('T')[0],
        filters.dateRange.endDate.toISOString().split('T')[0]
      );
    }

    if (filters?.year && filters?.month) {
      const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-31`;
      query += ' AND date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';

    const result = await db.select<any[]>(query, params);
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      notes: row.notes,
      totalAmount: row.total_amount || 0,
      totalReturnAmount: row.total_return_amount || 0,
      netAmount: row.net_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },
  
  getAllWithItems: async (filters?: DailyEntryFilters): Promise<DailyEntryWithItems[]> => {
    const entries = await dailyEntryService.getAll(filters);
    const entriesWithItems: DailyEntryWithItems[] = [];
    const db = getDatabase();
    
    for (const entry of entries) {
      const items = await db.select<any[]>(
        `SELECT dei.*, p.name as product_name, p.cost_price, p.sell_price, p.unit_per_carton, 
                p.company_id, c.name as company_name, p.created_at as product_created_at,
                p.updated_at as product_updated_at
         FROM daily_entry_items dei
         JOIN products p ON dei.product_id = p.id
         JOIN companies c ON p.company_id = c.id
         WHERE dei.daily_entry_id = ?`,
        [entry.id]
      );
      
      const parsedItems: DailyEntryItem[] = items.map((item: any) => ({
        id: item.id,
        dailyEntryId: item.daily_entry_id,
        productId: item.product_id,
        quantitySold: item.quantity_sold || 0,
        quantityReturned: item.quantity_returned || 0,
        netQuantity: item.net_quantity || 0,
        costPriceOverride: item.cost_price_override,
        sellPriceOverride: item.sell_price_override,
        totalCost: item.total_cost || 0,
        totalRevenue: item.total_revenue || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        product: {
          id: item.product_id,
          name: item.product_name,
          costPrice: item.cost_price,
          sellPrice: item.sell_price,
          unitPerCarton: item.unit_per_carton,
          companyId: item.company_id,
          createdAt: new Date(item.product_created_at),
          updatedAt: new Date(item.product_updated_at),
          company: {
            id: item.company_id,
            name: item.company_name,
          }
        }
      }));
      
      entriesWithItems.push({
        ...entry,
        items: parsedItems
      });
    }
    
    return entriesWithItems;
  },

  getById: async (id: string): Promise<DailyEntry | null> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM daily_entries WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      notes: row.notes,
      totalAmount: row.total_amount || 0,
      totalReturnAmount: row.total_return_amount || 0,
      netAmount: row.net_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },
  
  getWithItems: async (id: string): Promise<DailyEntryWithItems | null> => {
    const entry = await dailyEntryService.getById(id);
    if (!entry) return null;
    
    const db = getDatabase();
    const items = await db.select<any[]>(
      `SELECT dei.*, p.name as product_name, p.cost_price, p.sell_price, p.unit_per_carton, 
              p.company_id, c.name as company_name, p.created_at as product_created_at,
              p.updated_at as product_updated_at, c.created_at as company_created_at,
              c.updated_at as company_updated_at
       FROM daily_entry_items dei
       JOIN products p ON dei.product_id = p.id
       JOIN companies c ON p.company_id = c.id
       WHERE dei.daily_entry_id = ?`,
      [id]
    );
    
    const parsedItems: DailyEntryItem[] = items.map((item: any) => ({
      id: item.id,
      dailyEntryId: item.daily_entry_id,
      productId: item.product_id,
      quantitySold: item.quantity_sold || 0,
      quantityReturned: item.quantity_returned || 0,
      netQuantity: item.net_quantity || 0,
      costPriceOverride: item.cost_price_override,
      sellPriceOverride: item.sell_price_override,
      totalCost: item.total_cost || 0,
      totalRevenue: item.total_revenue || 0,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      product: {
        id: item.product_id,
        name: item.product_name,
        costPrice: item.cost_price,
        sellPrice: item.sell_price,
        unitPerCarton: item.unit_per_carton,
        companyId: item.company_id,
        createdAt: new Date(item.product_created_at),
        updatedAt: new Date(item.product_updated_at),
        company: {
          id: item.company_id,
          name: item.company_name,
          createdAt: new Date(item.company_created_at),
          updatedAt: new Date(item.company_updated_at)
        }
      }
    }));
    
    return {
      ...entry,
      items: parsedItems
    };
  },

  getByMonth: async (year: number, month: number): Promise<DailyEntry[]> => {
    const db = getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.select<any[]>(
      'SELECT * FROM daily_entries WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      notes: row.notes,
      totalAmount: row.total_amount || 0,
      totalReturnAmount: row.total_return_amount || 0,
      netAmount: row.net_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getByOrderBooker: async (orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]> => {
    const db = getDatabase();
    let query = 'SELECT * FROM daily_entries WHERE order_booker_id = ?';
    const params: any[] = [orderBookerId];

    if (dateRange) {
      query += ' AND date >= ? AND date <= ?';
      params.push(
        dateRange.startDate.toISOString().split('T')[0],
        dateRange.endDate.toISOString().split('T')[0]
      );
    }

    query += ' ORDER BY date DESC';

    const result = await db.select<any[]>(query, params);
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      notes: row.notes,
      totalAmount: row.total_amount || 0,
      totalReturnAmount: row.total_return_amount || 0,
      netAmount: row.net_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },
  
  getByDateRange: async (startDate: string | Date, endDate: string | Date): Promise<DailyEntry[]> => {
    const db = getDatabase();
    const startDateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
    
    const query = 'SELECT * FROM daily_entries WHERE date >= ? AND date <= ? ORDER BY date DESC';
    const params = [startDateStr, endDateStr];

    const result = await db.select<any[]>(query, params);
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      notes: row.notes,
      totalAmount: row.total_amount || 0,
      totalReturnAmount: row.total_return_amount || 0,
      netAmount: row.net_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntryWithItems> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const dateString = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];
    
    // Calculate totals from items
    let totalAmount = 0;
    let totalReturnAmount = 0;
    
    // Start a transaction to ensure data consistency
    await db.execute('BEGIN TRANSACTION');
    
    try {
      // Insert the daily entry header
      await db.execute(
        `INSERT INTO daily_entries (
          id, 
          order_booker_id, 
          date, 
          notes,
          total_amount,
          total_return_amount,
          net_amount,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.orderBookerId,
          dateString,
          entry.notes || null,
          0, // Initialize with zero, will update after items are inserted
          0,
          0,
          now,
          now,
        ]
      );
      
      // Insert all item entries and calculate totals
      for (const item of entry.items) {
        // Get product information for calculations
        const productResult = await db.select<any[]>(
          'SELECT * FROM products WHERE id = ?', 
          [item.productId]
        );
        
        if (productResult.length === 0) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        
        const product = productResult[0];
        const costPrice = item.costPriceOverride ?? product.cost_price;
        const sellPrice = item.sellPriceOverride ?? product.sell_price;
        
        const quantitySold = item.quantitySold || 0;
        const quantityReturned = item.quantityReturned || 0;
        const netQuantity = quantitySold - quantityReturned;
        
        const totalCost = netQuantity * costPrice;
        const totalRevenue = netQuantity * sellPrice;
        
        const itemAmount = quantitySold * sellPrice;
        const itemReturnAmount = quantityReturned * sellPrice;
        
        totalAmount += itemAmount;
        totalReturnAmount += itemReturnAmount;
        
        const itemId = uuidv4();
        await db.execute(
          `INSERT INTO daily_entry_items (
            id,
            daily_entry_id,
            product_id,
            quantity_sold,
            quantity_returned,
            net_quantity,
            cost_price_override,
            sell_price_override,
            total_cost,
            total_revenue,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.productId,
            quantitySold,
            quantityReturned,
            netQuantity,
            item.costPriceOverride || null,
            item.sellPriceOverride || null,
            totalCost,
            totalRevenue,
            now,
            now
          ]
        );
      }
      
      // Update the daily entry header with totals
      const netAmount = totalAmount - totalReturnAmount;
      await db.execute(
        `UPDATE daily_entries 
         SET total_amount = ?,
             total_return_amount = ?,
             net_amount = ?
         WHERE id = ?`,
        [totalAmount, totalReturnAmount, netAmount, id]
      );
      
      // Commit the transaction
      await db.execute('COMMIT');
      
      // Get the full entry with items
      const created = await dailyEntryService.getWithItems(id);
      if (!created) {
        throw new Error('Failed to retrieve created daily entry');
      }
      
      return created;
    } catch (error) {
      // Rollback transaction in case of error
      await db.execute('ROLLBACK');
      console.error('Error creating daily entry:', error);
      throw error;
    }
  },



  update: async (id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntryWithItems> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Start a transaction to ensure data consistency
    await db.execute('BEGIN TRANSACTION');
    
    try {
      // Update the basic entry information
      if (entry.notes !== undefined) {
        await db.execute(
          'UPDATE daily_entries SET notes = ?, updated_at = ? WHERE id = ?',
          [entry.notes, now, id]
        );
      }
      
      // Handle item updates if provided
      if (entry.items && entry.items.length > 0) {
        // Get the current items to compare
        const currentItems = await db.select<any[]>(
          'SELECT id, product_id FROM daily_entry_items WHERE daily_entry_id = ?',
          [id]
        );
        
        const currentItemMap = new Map();
        currentItems.forEach(item => {
          currentItemMap.set(item.id, item);
        });
        
        // Track totals for the header update
        let totalAmount = 0;
        let totalReturnAmount = 0;
        
        // Process each item in the update request
        for (const item of entry.items) {
          const productResult = await db.select<any[]>(
            'SELECT * FROM products WHERE id = ?', 
            [item.productId]
          );
          
          if (productResult.length === 0) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          
          const product = productResult[0];
          const costPrice = item.costPriceOverride ?? product.cost_price;
          const sellPrice = item.sellPriceOverride ?? product.sell_price;
          
          const quantitySold = item.quantitySold || 0;
          const quantityReturned = item.quantityReturned || 0;
          const netQuantity = quantitySold - quantityReturned;
          
          const totalCost = netQuantity * costPrice;
          const totalRevenue = netQuantity * sellPrice;
          
          const itemAmount = quantitySold * sellPrice;
          const itemReturnAmount = quantityReturned * sellPrice;
          
          totalAmount += itemAmount;
          totalReturnAmount += itemReturnAmount;
          
          if (item.id) {
            // Update existing item
            await db.execute(
              `UPDATE daily_entry_items SET 
                product_id = ?,
                quantity_sold = ?,
                quantity_returned = ?,
                net_quantity = ?,
                cost_price_override = ?,
                sell_price_override = ?,
                total_cost = ?,
                total_revenue = ?,
                updated_at = ?
               WHERE id = ? AND daily_entry_id = ?`,
              [
                item.productId,
                quantitySold,
                quantityReturned,
                netQuantity,
                item.costPriceOverride || null,
                item.sellPriceOverride || null,
                totalCost,
                totalRevenue,
                now,
                item.id,
                id
              ]
            );
          } else {
            // Insert new item
            const itemId = uuidv4();
            await db.execute(
              `INSERT INTO daily_entry_items (
                id,
                daily_entry_id,
                product_id,
                quantity_sold,
                quantity_returned,
                net_quantity,
                cost_price_override,
                sell_price_override,
                total_cost,
                total_revenue,
                created_at,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                itemId,
                id,
                item.productId,
                quantitySold,
                quantityReturned,
                netQuantity,
                item.costPriceOverride || null,
                item.sellPriceOverride || null,
                totalCost,
                totalRevenue,
                now,
                now
              ]
            );
          }
        }
        
        // Update the daily entry header with recalculated totals
        const netAmount = totalAmount - totalReturnAmount;
        await db.execute(
          `UPDATE daily_entries 
           SET total_amount = ?,
               total_return_amount = ?,
               net_amount = ?,
               updated_at = ?
           WHERE id = ?`,
          [totalAmount, totalReturnAmount, netAmount, now, id]
        );
      }
      
      // Commit the transaction
      await db.execute('COMMIT');
      
      // Get the updated entry with items
      const updated = await dailyEntryService.getWithItems(id);
      if (!updated) {
        throw new Error('Updated daily entry not found');
      }
      
      return updated;
    } catch (error) {
      // Rollback in case of error
      await db.execute('ROLLBACK');
      console.error('Error updating daily entry:', error);
      throw error;
    }


  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.execute('DELETE FROM daily_entries WHERE id = ?', [id]);
  },

  getMonthlyAnalytics: async (year: number, month: number): Promise<MonthlyAnalytics> => {
    const db = getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const result = await db.select<Array<{
      totalAmount: number;
      totalReturnAmount: number;
      netAmount: number;
      totalQuantitySold: number;
      totalQuantityReturned: number;
      entriesCount: number;
      itemsCount: number;
    }>>(
      `SELECT 
        COALESCE(SUM(de.total_amount), 0) as totalAmount,
        COALESCE(SUM(de.total_return_amount), 0) as totalReturnAmount,
        COALESCE(SUM(de.net_amount), 0) as netAmount,
        COALESCE(SUM(dei.quantity_sold), 0) as totalQuantitySold,
        COALESCE(SUM(dei.quantity_returned), 0) as totalQuantityReturned,
        COUNT(DISTINCT de.id) as entriesCount,
        COUNT(DISTINCT dei.id) as itemsCount
       FROM daily_entries de
       LEFT JOIN daily_entry_items dei ON de.id = dei.daily_entry_id
       WHERE de.date >= ? AND de.date <= ?`,
      [startDate, endDate]
    );

    const data = result[0] || {
      totalAmount: 0,
      totalReturnAmount: 0,
      netAmount: 0,
      totalQuantitySold: 0,
      totalQuantityReturned: 0,
      entriesCount: 0,
      itemsCount: 0,
    };

    const netQuantity = data.totalQuantitySold - data.totalQuantityReturned;
    const averageDailyAmount = data.entriesCount > 0 ? data.netAmount / data.entriesCount : 0;
    const returnRate = data.totalAmount > 0 ? (data.totalReturnAmount / data.totalAmount) * 100 : 0;
    const quantityReturnRate = data.totalQuantitySold > 0 ? (data.totalQuantityReturned / data.totalQuantitySold) * 100 : 0;

    return {
      totalAmount: data.totalAmount,
      totalReturnAmount: data.totalReturnAmount,
      netAmount: data.netAmount,
      totalQuantitySold: data.totalQuantitySold,
      totalQuantityReturned: data.totalQuantityReturned,
      netQuantity,
      entriesCount: data.entriesCount,
      itemsCount: data.itemsCount,
      averageDailyAmount,
      returnRate,
      quantityReturnRate,
    };
  },
  
  updateItemQuantityReturned: async (itemId: string, quantityReturned: number): Promise<DailyEntryItem> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Get the current item to calculate new values
    const itemResult = await db.select<any[]>(
      `SELECT dei.*, p.cost_price, p.sell_price 
       FROM daily_entry_items dei 
       JOIN products p ON dei.product_id = p.id 
       WHERE dei.id = ?`,
      [itemId]
    );
    
    if (itemResult.length === 0) {
      throw new Error('Daily entry item not found');
    }
    
    const item = itemResult[0];
    const quantitySold = item.quantity_sold || 0;
    const netQuantity = quantitySold - quantityReturned;
    
    // Calculate pricing
    const costPrice = item.cost_price_override || item.cost_price;
    const sellPrice = item.sell_price_override || item.sell_price;
    const totalCost = netQuantity * costPrice;
    const totalRevenue = netQuantity * sellPrice;
    
    // Calculate amount changes for the entry header
    const oldReturnAmount = (item.quantity_returned || 0) * sellPrice;
    const newReturnAmount = quantityReturned * sellPrice;
    const returnAmountDifference = newReturnAmount - oldReturnAmount;
    
    // Start transaction
    await db.execute('BEGIN TRANSACTION');
    
    try {
      // Update the item
      await db.execute(
        `UPDATE daily_entry_items SET 
           quantity_returned = ?,
           net_quantity = ?,
           total_cost = ?,
           total_revenue = ?,
           updated_at = ?
         WHERE id = ?`,
        [quantityReturned, netQuantity, totalCost, totalRevenue, now, itemId]
      );
      
      // Update the entry header totals
      await db.execute(
        `UPDATE daily_entries SET 
           total_return_amount = total_return_amount + ?,
           net_amount = net_amount - ?,
           updated_at = ?
         WHERE id = (SELECT daily_entry_id FROM daily_entry_items WHERE id = ?)`,
        [returnAmountDifference, returnAmountDifference, now, itemId]
      );
      
      // Commit transaction
      await db.execute('COMMIT');
      
      // Get updated item
      const updatedItemResult = await db.select<any[]>(
        `SELECT dei.*, p.name as product_name, p.cost_price, p.sell_price, p.unit_per_carton,
                p.company_id, c.name as company_name, p.created_at as product_created_at,
                p.updated_at as product_updated_at, c.created_at as company_created_at,
                c.updated_at as company_updated_at
         FROM daily_entry_items dei
         JOIN products p ON dei.product_id = p.id
         JOIN companies c ON p.company_id = c.id
         WHERE dei.id = ?`,
        [itemId]
      );
      
      if (updatedItemResult.length === 0) {
        throw new Error('Failed to retrieve updated item');
      }
      
      const updatedItem = updatedItemResult[0];
      return {
        id: updatedItem.id,
        dailyEntryId: updatedItem.daily_entry_id,
        productId: updatedItem.product_id,
        quantitySold: updatedItem.quantity_sold || 0,
        quantityReturned: updatedItem.quantity_returned || 0,
        netQuantity: updatedItem.net_quantity || 0,
        costPriceOverride: updatedItem.cost_price_override,
        sellPriceOverride: updatedItem.sell_price_override,
        totalCost: updatedItem.total_cost || 0,
        totalRevenue: updatedItem.total_revenue || 0,
        createdAt: new Date(updatedItem.created_at),
        updatedAt: new Date(updatedItem.updated_at),
        product: {
          id: updatedItem.product_id,
          name: updatedItem.product_name,
          costPrice: updatedItem.cost_price,
          sellPrice: updatedItem.sell_price,
          unitPerCarton: updatedItem.unit_per_carton,
          companyId: updatedItem.company_id,
          createdAt: new Date(updatedItem.product_created_at),
          updatedAt: new Date(updatedItem.product_updated_at),
          company: {
            id: updatedItem.company_id,
            name: updatedItem.company_name,
            createdAt: new Date(updatedItem.company_created_at),
            updatedAt: new Date(updatedItem.company_updated_at)
          }
        }
      };
    } catch (error) {
      // Rollback in case of error
      await db.execute('ROLLBACK');
      console.error('Error updating item quantity returned:', error);
      throw error;
    }
  },
};

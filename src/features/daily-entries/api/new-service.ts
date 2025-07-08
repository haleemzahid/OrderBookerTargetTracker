import { getDatabase } from '../../../services/database';
import { v4 as uuidv4 } from 'uuid';
import type {
  DailyEntry,
  DailyEntryItem,
  DailyEntryWithItems,
  CreateDailyEntryRequest,
  CreateDailyEntryItemRequest,
  UpdateDailyEntryRequest,
  UpdateDailyEntryItemRequest,
  DailyEntryFilters,
  MonthlyAnalytics,
  ReturnEntryRequest,
  LegacyDailyEntry,
  LegacyCreateDailyEntryRequest,
  LegacyUpdateDailyEntryRequest,
} from '../types';

export interface IDailyEntryService {
  // New product-based methods
  getAll(filters?: DailyEntryFilters): Promise<DailyEntry[]>;
  getAllWithItems(filters?: DailyEntryFilters): Promise<DailyEntryWithItems[]>;
  getById(id: string): Promise<DailyEntry | null>;
  getWithItems(id: string): Promise<DailyEntryWithItems | null>;
  getItemsByEntryId(entryId: string): Promise<DailyEntryItem[]>;
  getByMonth(year: number, month: number): Promise<DailyEntry[]>;
  getByOrderBooker(orderBookerId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<DailyEntry[]>;
  create(entry: CreateDailyEntryRequest): Promise<DailyEntry>;
  update(id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry>;
  delete(id: string): Promise<void>;
  getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalytics>;
  
  // Return functionality
  processReturns(data: ReturnEntryRequest): Promise<DailyEntry>;
  getReturnableProducts(orderBookerId: string, fromDate: Date): Promise<DailyEntryItem[]>;
  
  // Legacy support for migration period
  getAllLegacy(filters?: DailyEntryFilters): Promise<LegacyDailyEntry[]>;
  createLegacy(entry: LegacyCreateDailyEntryRequest): Promise<LegacyDailyEntry>;
  updateLegacy(id: string, entry: LegacyUpdateDailyEntryRequest): Promise<LegacyDailyEntry>;
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
      date: new Date(row.date),
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
    
    for (const entry of entries) {
      const items = await dailyEntryService.getItemsByEntryId(entry.id);
      entriesWithItems.push({
        ...entry,
        items,
      });
    }
    
    return entriesWithItems;
  },

  getById: async (id: string): Promise<DailyEntry | null> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM daily_entries WHERE id = ?', [id]);
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date),
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
    
    const items = await dailyEntryService.getItemsByEntryId(id);
    
    return {
      ...entry,
      items,
    };
  },

  getItemsByEntryId: async (entryId: string): Promise<DailyEntryItem[]> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM daily_entry_items WHERE daily_entry_id = ?', [entryId]);
    
    return result.map(row => ({
      id: row.id,
      dailyEntryId: row.daily_entry_id,
      productId: row.product_id,
      quantitySold: row.quantity_sold || 0,
      quantityReturned: row.quantity_returned || 0,
      netQuantity: row.net_quantity || 0,
      costPriceOverride: row.cost_price_override,
      sellPriceOverride: row.sell_price_override,
      totalCost: row.total_cost || 0,
      totalRevenue: row.total_revenue || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getByMonth: async (year: number, month: number): Promise<DailyEntry[]> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    return dailyEntryService.getAll({
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
  },

  getByOrderBooker: async (orderBookerId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<DailyEntry[]> => {
    return dailyEntryService.getAll({
      orderBookerIds: [orderBookerId],
      dateRange,
    });
  },

  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntry> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const dateString = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];

    // Calculate totals from items
    let totalAmount = 0;
    let totalReturnAmount = 0;

    // Create the daily entry header
    await db.execute(
      `INSERT INTO daily_entries (
        id, order_booker_id, date, notes, total_amount, total_return_amount, net_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, entry.orderBookerId, dateString, entry.notes || null, 0, 0, 0, now, now]
    );

    // Create items and calculate totals
    for (const item of entry.items) {
      const itemId = uuidv4();
      const netQuantity = item.quantitySold - (item.quantityReturned || 0);
      
      // Get product info for pricing if no override is provided
      const productResult = await db.select<any[]>('SELECT * FROM products WHERE id = ?', [item.productId]);
      const product = productResult[0];
      
      const costPrice = item.costPriceOverride || product?.cost_price || 0;
      const sellPrice = item.sellPriceOverride || product?.sell_price || 0;
      
      const totalCost = netQuantity * costPrice;
      const totalRevenue = item.quantitySold * sellPrice;
      const returnRevenue = (item.quantityReturned || 0) * sellPrice;
      
      totalAmount += totalRevenue;
      totalReturnAmount += returnRevenue;

      await db.execute(
        `INSERT INTO daily_entry_items (
          id, daily_entry_id, product_id, quantity_sold, quantity_returned, net_quantity,
          cost_price_override, sell_price_override, total_cost, total_revenue, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, id, item.productId, item.quantitySold, item.quantityReturned || 0, netQuantity,
          item.costPriceOverride || null, item.sellPriceOverride || null, totalCost, totalRevenue, now, now
        ]
      );
    }

    // Update totals in the header
    const netAmount = totalAmount - totalReturnAmount;
    await db.execute(
      'UPDATE daily_entries SET total_amount = ?, total_return_amount = ?, net_amount = ? WHERE id = ?',
      [totalAmount, totalReturnAmount, netAmount, id]
    );

    const created = await dailyEntryService.getById(id);
    if (!created) {
      throw new Error('Failed to create daily entry');
    }

    return created;
  },

  update: async (id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Update the header if notes changed
    if (entry.notes !== undefined) {
      await db.execute(
        'UPDATE daily_entries SET notes = ?, updated_at = ? WHERE id = ?',
        [entry.notes, now, id]
      );
    }

    // Handle items update if provided
    if (entry.items) {
      // Delete existing items
      await db.execute('DELETE FROM daily_entry_items WHERE daily_entry_id = ?', [id]);
      
      // Recreate items with new data
      let totalAmount = 0;
      let totalReturnAmount = 0;

      for (const item of entry.items) {
        const itemId = item.id || uuidv4();
        const netQuantity = item.quantitySold - (item.quantityReturned || 0);
        
        // Get product info for pricing if no override is provided
        const productResult = await db.select<any[]>('SELECT * FROM products WHERE id = ?', [item.productId]);
        const product = productResult[0];
        
        const costPrice = item.costPriceOverride || product?.cost_price || 0;
        const sellPrice = item.sellPriceOverride || product?.sell_price || 0;
        
        const totalCost = netQuantity * costPrice;
        const totalRevenue = item.quantitySold * sellPrice;
        const returnRevenue = (item.quantityReturned || 0) * sellPrice;
        
        totalAmount += totalRevenue;
        totalReturnAmount += returnRevenue;

        await db.execute(
          `INSERT INTO daily_entry_items (
            id, daily_entry_id, product_id, quantity_sold, quantity_returned, net_quantity,
            cost_price_override, sell_price_override, total_cost, total_revenue, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, id, item.productId, item.quantitySold, item.quantityReturned || 0, netQuantity,
            item.costPriceOverride || null, item.sellPriceOverride || null, totalCost, totalRevenue, now, now
          ]
        );
      }

      // Update totals in the header
      const netAmount = totalAmount - totalReturnAmount;
      await db.execute(
        'UPDATE daily_entries SET total_amount = ?, total_return_amount = ?, net_amount = ?, updated_at = ? WHERE id = ?',
        [totalAmount, totalReturnAmount, netAmount, now, id]
      );
    }

    const updated = await dailyEntryService.getById(id);
    if (!updated) {
      throw new Error('Daily entry not found');
    }

    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    
    // Delete items first (due to foreign key constraint)
    await db.execute('DELETE FROM daily_entry_items WHERE daily_entry_id = ?', [id]);
    
    // Delete the main entry
    await db.execute('DELETE FROM daily_entries WHERE id = ?', [id]);
  },

  getMonthlyAnalytics: async (year: number, month: number): Promise<MonthlyAnalytics> => {
    const db = getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // Get summary from daily_entries
    const entryResult = await db.select<any[]>(
      `SELECT 
        COUNT(*) as entries_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(total_return_amount), 0) as total_return_amount,
        COALESCE(SUM(net_amount), 0) as net_amount
       FROM daily_entries 
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );

    // Get item-level summary
    const itemResult = await db.select<any[]>(
      `SELECT 
        COUNT(*) as items_count,
        COALESCE(SUM(quantity_sold), 0) as total_quantity_sold,
        COALESCE(SUM(quantity_returned), 0) as total_quantity_returned,
        COALESCE(SUM(net_quantity), 0) as net_quantity
       FROM daily_entry_items dei
       JOIN daily_entries de ON dei.daily_entry_id = de.id
       WHERE de.date >= ? AND de.date <= ?`,
      [startDate, endDate]
    );

    const entryData = entryResult[0] || {};
    const itemData = itemResult[0] || {};
    
    const entriesCount = entryData.entries_count || 0;
    const totalAmount = entryData.total_amount || 0;
    const totalReturnAmount = entryData.total_return_amount || 0;
    const netAmount = entryData.net_amount || 0;
    const totalQuantitySold = itemData.total_quantity_sold || 0;
    const totalQuantityReturned = itemData.total_quantity_returned || 0;
    const netQuantity = itemData.net_quantity || 0;
    const itemsCount = itemData.items_count || 0;

    return {
      totalAmount,
      totalReturnAmount,
      netAmount,
      totalQuantitySold,
      totalQuantityReturned,
      netQuantity,
      entriesCount,
      itemsCount,
      averageDailyAmount: entriesCount > 0 ? netAmount / entriesCount : 0,
      returnRate: totalAmount > 0 ? (totalReturnAmount / totalAmount) * 100 : 0,
      quantityReturnRate: totalQuantitySold > 0 ? (totalQuantityReturned / totalQuantitySold) * 100 : 0,
    };
  },

  processReturns: async (data: ReturnEntryRequest): Promise<DailyEntry> => {
    // Implementation for processing returns
    // This would update existing daily entry items with return quantities
    throw new Error('processReturns not yet implemented');
  },

  getReturnableProducts: async (orderBookerId: string, fromDate: Date): Promise<DailyEntryItem[]> => {
    // Implementation for getting products that can be returned
    // This would get all sold products from a specific date onwards
    throw new Error('getReturnableProducts not yet implemented');
  },

  // Legacy methods for backward compatibility during migration
  getAllLegacy: async (filters?: DailyEntryFilters): Promise<LegacyDailyEntry[]> => {
    // This would read from the backup table during migration
    throw new Error('getAllLegacy not yet implemented');
  },

  createLegacy: async (entry: LegacyCreateDailyEntryRequest): Promise<LegacyDailyEntry> => {
    // This would create entries in the old format during migration
    throw new Error('createLegacy not yet implemented');
  },

  updateLegacy: async (id: string, entry: LegacyUpdateDailyEntryRequest): Promise<LegacyDailyEntry> => {
    // This would update entries in the old format during migration
    throw new Error('updateLegacy not yet implemented');
  },
};

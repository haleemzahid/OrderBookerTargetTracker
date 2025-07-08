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
      date: new Date(row.date + 'T00:00:00'),
      sales: row.sales || 0,
      returns: row.returns || 0,
      netSales: row.net_sales || 0,
      totalCarton: row.total_carton || 0,
      returnCarton: row.return_carton || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
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
      sales: row.sales || 0,
      returns: row.returns || 0,
      netSales: row.net_sales || 0,
      totalCarton: row.total_carton || 0,
      returnCarton: row.return_carton || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
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
      sales: row.sales || 0,
      returns: row.returns || 0,
      netSales: row.net_sales || 0,
      totalCarton: row.total_carton || 0,
      returnCarton: row.return_carton || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getByOrderBooker: async (orderBookerId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<DailyEntry[]> => {
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
      sales: row.sales || 0,
      returns: row.returns || 0,
      netSales: row.net_sales || 0,
      totalCarton: row.total_carton || 0,
      returnCarton: row.return_carton || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<DailyEntry[]> => {
    const db = getDatabase();
    const result = await db.select<any[]>(
      'SELECT * FROM daily_entries WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      date: new Date(row.date + 'T00:00:00'),
      sales: row.sales || 0,
      returns: row.returns || 0,
      netSales: row.net_sales || 0,
      totalCarton: row.total_carton || 0,
      returnCarton: row.return_carton || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntry> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const netSales = entry.sales - entry.returns;

    const dateString = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];

    await db.execute(
      `INSERT INTO daily_entries (
        id, order_booker_id, date, sales, returns, net_sales, total_carton, return_carton, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.orderBookerId,
        dateString,
        entry.sales,
        entry.returns,
        netSales,
        entry.totalCarton,
        entry.returnCarton,
        entry.notes || null,
        now,
        now,
      ]
    );

    const created = await dailyEntryService.getById(id);
    if (!created) {
      throw new Error('Failed to create daily entry');
    }

    return created;
  },

  batchCreate: async (entries: CreateDailyEntryRequest[]): Promise<DailyEntry[]> => {
    const createdEntries: DailyEntry[] = [];

    for (const entry of entries) {
      const created = await dailyEntryService.create(entry);
      createdEntries.push(created);
    }

    return createdEntries;
  },

  update: async (id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry> => {
    const db = getDatabase();
    const now = new Date().toISOString();

    const setParts: string[] = [];
    const params: any[] = [];

    if (entry.sales !== undefined) {
      setParts.push('sales = ?');
      params.push(entry.sales);
    }
    if (entry.returns !== undefined) {
      setParts.push('returns = ?');
      params.push(entry.returns);
    }
    if (entry.totalCarton !== undefined) {
      setParts.push('total_carton = ?');
      params.push(entry.totalCarton);
    }
    if (entry.returnCarton !== undefined) {
      setParts.push('return_carton = ?');
      params.push(entry.returnCarton);
    }
    if (entry.notes !== undefined) {
      setParts.push('notes = ?');
      params.push(entry.notes);
    }

    if (entry.sales !== undefined || entry.returns !== undefined) {
      const current = await dailyEntryService.getById(id);
      if (current) {
        const newSales = entry.sales !== undefined ? entry.sales : current.sales;
        const newReturns = entry.returns !== undefined ? entry.returns : current.returns;
        const netSales = newSales - newReturns;
        
        setParts.push('net_sales = ?');
        params.push(netSales);
      }
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    setParts.push('updated_at = ?');
    params.push(now);
    params.push(id);

    const query = `UPDATE daily_entries SET ${setParts.join(', ')} WHERE id = ?`;
    await db.execute(query, params);

    const updated = await dailyEntryService.getById(id);
    if (!updated) {
      throw new Error('Daily entry not found');
    }

    return updated;
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
      totalSales: number;
      totalReturns: number;
      netSales: number;
      totalCarton: number;
      returnCarton: number;
      entriesCount: number;
    }>>(
      `SELECT 
        COALESCE(SUM(sales), 0) as totalSales,
        COALESCE(SUM(returns), 0) as totalReturns,
        COALESCE(SUM(net_sales), 0) as netSales,
        COALESCE(SUM(total_carton), 0) as totalCarton,
        COALESCE(SUM(return_carton), 0) as returnCarton,
        COUNT(*) as entriesCount
       FROM daily_entries 
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );

    const data = result[0] || {
      totalSales: 0,
      totalReturns: 0,
      netSales: 0,
      totalCarton: 0,
      returnCarton: 0,
      entriesCount: 0,
    };

    const netCarton = data.totalCarton - data.returnCarton;
    const averageDailySales = data.entriesCount > 0 ? data.netSales / data.entriesCount : 0;
    const returnRate = data.totalSales > 0 ? (data.totalReturns / data.totalSales) * 100 : 0;
    const cartonReturnRate = data.totalCarton > 0 ? (data.returnCarton / data.totalCarton) * 100 : 0;

    return {
      totalSales: data.totalSales,
      totalReturns: data.totalReturns,
      netSales: data.netSales,
      totalCarton: data.totalCarton,
      returnCarton: data.returnCarton,
      netCarton,
      entriesCount: data.entriesCount,
      averageDailySales,
      returnRate,
      cartonReturnRate,
    };
  },
};

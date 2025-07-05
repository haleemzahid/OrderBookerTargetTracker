import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type {
  DailyEntry,
  CreateDailyEntryRequest,
  UpdateDailyEntryRequest,
  DateRange,
  MonthlyAnalytics,
} from '../../types';

export interface IDailyEntryService {
  getByMonth(year: number, month: number): Promise<DailyEntry[]>;
  getByOrderBooker(orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]>;
  getByDateRange(startDate: string, endDate: string): Promise<DailyEntry[]>;
  getById(id: string): Promise<DailyEntry | null>;
  create(entry: CreateDailyEntryRequest): Promise<DailyEntry>;
  batchCreate(entries: CreateDailyEntryRequest[]): Promise<DailyEntry[]>;
  update(id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry>;
  delete(id: string): Promise<void>;
  getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalytics>;
}

export const dailyEntryService: IDailyEntryService = {
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
      date: new Date(row.date + 'T00:00:00'), // Convert 'YYYY-MM-DD' to Date object
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

  getByOrderBooker: async (orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]> => {
    const db = getDatabase();
    let query = 'SELECT * FROM daily_entries WHERE order_booker_id = ?';
    const params: any[] = [orderBookerId];

    if (dateRange) {
      query += ' AND date >= ? AND date <= ?';
      params.push(dateRange.startDate.toISOString(), dateRange.endDate.toISOString());
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
      date: new Date(row.date + 'T00:00:00'), // Convert 'YYYY-MM-DD' to Date object
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

  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntry> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const netSales = entry.sales - entry.returns;

    // Handle both string and Date object for date field
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

    // Calculate net sales if sales or returns are being updated
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
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    // Get total sales, returns, net sales, and carton data
    const salesResult = await db.select<Array<{
      totalSales: number, 
      totalReturns: number, 
      totalNetSales: number,
      totalCarton: number,
      totalReturnCarton: number,
      totalNetCarton: number
    }>>(
      `SELECT 
        COALESCE(SUM(sales), 0) as totalSales,
        COALESCE(SUM(returns), 0) as totalReturns,
        COALESCE(SUM(net_sales), 0) as totalNetSales,
        COALESCE(SUM(total_carton), 0) as totalCarton,
        COALESCE(SUM(return_carton), 0) as totalReturnCarton,
        COALESCE(SUM(total_carton - return_carton), 0) as totalNetCarton
       FROM daily_entries 
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );

    // Get total target amount
    const targetResult = await db.select<Array<{totalTargetAmount: number}>>(
      `SELECT COALESCE(SUM(target_amount), 0) as totalTargetAmount
       FROM monthly_targets 
       WHERE year = ? AND month = ?`,
      [year, month]
    );

    // Get performance by order booker
    const performanceResult = await db.select<Array<{
      orderBookerId: string,
      name: string,
      sales: number,
      targetAmount: number,
      achievementPercentage: number
    }>>(
      `SELECT 
        de.order_booker_id as orderBookerId,
        ob.name,
        COALESCE(SUM(de.net_sales), 0) as sales,
        COALESCE(mt.target_amount, 0) as targetAmount,
        CASE 
          WHEN mt.target_amount > 0 THEN (COALESCE(SUM(de.net_sales), 0) / mt.target_amount) * 100
          ELSE 0
        END as achievementPercentage
       FROM order_bookers ob
       LEFT JOIN daily_entries de ON ob.id = de.order_booker_id 
         AND de.date >= ? AND de.date <= ?
       LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
         AND mt.year = ? AND mt.month = ?
       GROUP BY ob.id, ob.name, mt.target_amount
       ORDER BY achievementPercentage DESC`,
      [startDate, endDate, year, month]
    );

    const totalSales = salesResult[0]?.totalSales || 0;
    const totalReturns = salesResult[0]?.totalReturns || 0;
    const totalNetSales = salesResult[0]?.totalNetSales || 0;
    const totalCarton = salesResult[0]?.totalCarton || 0;
    const totalReturnCarton = salesResult[0]?.totalReturnCarton || 0;
    const totalNetCarton = salesResult[0]?.totalNetCarton || 0;
    const totalTargetAmount = targetResult[0]?.totalTargetAmount || 0;
    const totalAchievedAmount = totalNetSales;
    const averageAchievementPercentage = totalTargetAmount > 0 ? (totalAchievedAmount / totalTargetAmount) * 100 : 0;

    // Split performers
    const topPerformers = performanceResult.filter(p => p.achievementPercentage >= 80).slice(0, 5);
    const underPerformers = performanceResult.filter(p => p.achievementPercentage < 80).slice(0, 5);

    return {
      totalSales,
      totalReturns,
      totalNetSales,
      totalCarton,
      totalReturnCarton,
      totalNetCarton,
      totalTargetAmount,
      totalAchievedAmount,
      averageAchievementPercentage,
      topPerformers,
      underPerformers,
    };
  },
};

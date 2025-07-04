import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type {
  OrderBooker,
  CreateOrderBookerRequest,
  UpdateOrderBookerRequest,
  OrderBookerFilters,
} from '../../types';

export interface IOrderBookerService {
  getAll(filters?: OrderBookerFilters): Promise<OrderBooker[]>;
  getById(id: string): Promise<OrderBooker | null>;
  create(data: CreateOrderBookerRequest): Promise<OrderBooker>;
  update(id: string, data: UpdateOrderBookerRequest): Promise<OrderBooker>;
  delete(id: string): Promise<void>;
}

export const orderBookerService: IOrderBookerService = {
  getAll: async (filters?: OrderBookerFilters): Promise<OrderBooker[]> => {
    const db = getDatabase();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    let query = `
      SELECT 
        ob.*,
        mt.target_amount as current_month_target,
        mt.achieved_amount as current_month_achieved,
        mt.remaining_amount as current_month_remaining,
        mt.achievement_percentage as current_month_achievement_percentage
      FROM order_bookers ob
      LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
        AND mt.year = ? AND mt.month = ?
      WHERE 1=1
    `;
    const params: any[] = [currentYear, currentMonth];

    if (filters?.search) {
      query += ' AND (ob.name LIKE ? OR ob.name_urdu LIKE ? OR ob.phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.isActive !== undefined) {
      query += ' AND ob.is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters?.joinDateFrom) {
      query += ' AND ob.join_date >= ?';
      params.push(filters.joinDateFrom.toISOString());
    }

    if (filters?.joinDateTo) {
      query += ' AND ob.join_date <= ?';
      params.push(filters.joinDateTo.toISOString());
    }

    query += ' ORDER BY ob.name';

    const result = await db.select<any[]>(query, params);
    return result.map(row => ({
      id: row.id,
      name: row.name,
      nameUrdu: row.name_urdu,
      phone: row.phone,
      email: row.email,
      joinDate: new Date(row.join_date),
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      currentMonthTarget: row.current_month_target || 0,
      currentMonthAchieved: row.current_month_achieved || 0,
      currentMonthRemaining: row.current_month_remaining || 0,
      currentMonthAchievementPercentage: row.current_month_achievement_percentage || 0,
    }));
  },

  getById: async (id: string): Promise<OrderBooker | null> => {
    const db = getDatabase();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const query = `
      SELECT 
        ob.*,
        mt.target_amount as current_month_target,
        mt.achieved_amount as current_month_achieved,
        mt.remaining_amount as current_month_remaining,
        mt.achievement_percentage as current_month_achievement_percentage
      FROM order_bookers ob
      LEFT JOIN monthly_targets mt ON ob.id = mt.order_booker_id 
        AND mt.year = ? AND mt.month = ?
      WHERE ob.id = ?
    `;
    
    const result = await db.select<any[]>(query, [currentYear, currentMonth, id]);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      nameUrdu: row.name_urdu,
      phone: row.phone,
      email: row.email,
      joinDate: new Date(row.join_date),
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      currentMonthTarget: row.current_month_target || 0,
      currentMonthAchieved: row.current_month_achieved || 0,
      currentMonthRemaining: row.current_month_remaining || 0,
      currentMonthAchievementPercentage: row.current_month_achievement_percentage || 0,
    };
  },

  create: async (data: CreateOrderBookerRequest): Promise<OrderBooker> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const joinDate = new Date().toISOString();

    await db.execute(
      `INSERT INTO order_bookers (
        id, name, name_urdu, phone, email, join_date, is_active, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.nameUrdu,
        data.phone,
        data.email || null,
        joinDate,
        1,
        now,
        now,
      ]
    );

    const created = await orderBookerService.getById(id);
    if (!created) {
      throw new Error('Failed to create order booker');
    }

    return created;
  },

  update: async (id: string, data: UpdateOrderBookerRequest): Promise<OrderBooker> => {
    const db = getDatabase();
    const now = new Date().toISOString();

    const setParts: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      setParts.push('name = ?');
      params.push(data.name);
    }
    if (data.nameUrdu !== undefined) {
      setParts.push('name_urdu = ?');
      params.push(data.nameUrdu);
    }
    if (data.phone !== undefined) {
      setParts.push('phone = ?');
      params.push(data.phone);
    }
    if (data.email !== undefined) {
      setParts.push('email = ?');
      params.push(data.email);
    }
    if (data.isActive !== undefined) {
      setParts.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    setParts.push('updated_at = ?');
    params.push(now);
    params.push(id);

    const query = `UPDATE order_bookers SET ${setParts.join(', ')} WHERE id = ?`;
    await db.execute(query, params);

    const updated = await orderBookerService.getById(id);
    if (!updated) {
      throw new Error('Order booker not found');
    }

    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.execute('DELETE FROM order_bookers WHERE id = ?', [id]);
  },
};

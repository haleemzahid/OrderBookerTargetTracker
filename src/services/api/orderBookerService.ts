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
    let query = 'SELECT * FROM order_bookers WHERE 1=1';
    const params: any[] = [];

    if (filters?.search) {
      query += ' AND (name LIKE ? OR name_urdu LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.territory) {
      query += ' AND territory = ?';
      params.push(filters.territory);
    }

    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters?.joinDateFrom) {
      query += ' AND join_date >= ?';
      params.push(filters.joinDateFrom.toISOString());
    }

    if (filters?.joinDateTo) {
      query += ' AND join_date <= ?';
      params.push(filters.joinDateTo.toISOString());
    }

    query += ' ORDER BY name';

    const result = await db.select<OrderBooker[]>(query, params);
    return result.map(row => ({
      ...row,
      joinDate: new Date(row.joinDate),
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  },

  getById: async (id: string): Promise<OrderBooker | null> => {
    const db = getDatabase();
    const result = await db.select<OrderBooker[]>('SELECT * FROM order_bookers WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      joinDate: new Date(row.joinDate),
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
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
        monthly_target, territory, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.nameUrdu,
        data.phone,
        data.email || null,
        joinDate,
        1,
        data.monthlyTarget,
        data.territory || null,
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
    if (data.territory !== undefined) {
      setParts.push('territory = ?');
      params.push(data.territory);
    }
    if (data.monthlyTarget !== undefined) {
      setParts.push('monthly_target = ?');
      params.push(data.monthlyTarget);
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

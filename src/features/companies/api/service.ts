import { getDatabase } from '../../../services/database';
import { v4 as uuidv4 } from 'uuid';
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyFilters,
} from '../types';

export interface ICompanyService {
  getAll(filters?: CompanyFilters): Promise<Company[]>;
  getById(id: string): Promise<Company | null>;
  create(data: CreateCompanyRequest): Promise<Company>;
  update(id: string, data: UpdateCompanyRequest): Promise<Company>;
  delete(id: string): Promise<void>;
}

export const companyService: ICompanyService = {
  getAll: async (filters?: CompanyFilters): Promise<Company[]> => {
    const db = getDatabase();
    
    let query = 'SELECT * FROM companies WHERE 1=1';
    const params: any[] = [];

    if (filters?.search) {
      query += ' AND (name LIKE ? OR address LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const result = await db.select<any[]>(query, params);
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      email: row.email,
      phone: row.phone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getById: async (id: string): Promise<Company | null> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM companies WHERE id = ?', [id]);
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      email: row.email,
      phone: row.phone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO companies (id, name, address, email, phone, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.address || null, data.email || null, data.phone || null, now, now]
    );

    const created = await companyService.getById(id);
    if (!created) {
      throw new Error('Failed to create company');
    }

    return created;
  },

  update: async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      params.push(data.name);
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?');
      params.push(data.address);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      params.push(data.email);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(data.phone);
    }

    updateFields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    await db.execute(
      `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await companyService.getById(id);
    if (!updated) {
      throw new Error('Company not found');
    }

    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.execute('DELETE FROM companies WHERE id = ?', [id]);
  },
};

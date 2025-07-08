import { getDatabase } from '../../../services/database';
import { v4 as uuidv4 } from 'uuid';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  ProductWithCompany,
  QuantityInput,
} from '../types';

export interface IProductService {
  getAll(filters?: ProductFilters): Promise<Product[]>;
  getAllWithCompany(filters?: ProductFilters): Promise<ProductWithCompany[]>;
  getById(id: string): Promise<Product | null>;
  getByCompany(companyId: string): Promise<Product[]>;
  create(data: CreateProductRequest): Promise<Product>;
  update(id: string, data: UpdateProductRequest): Promise<Product>;
  delete(id: string): Promise<void>;
  calculateTotalUnits(cartons: number, units: number, unitPerCarton: number): number;
  formatQuantity(totalUnits: number, unitPerCarton: number): QuantityInput;
}

export const productService: IProductService = {
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    const db = getDatabase();
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (filters?.search) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    if (filters?.companyIds && filters.companyIds.length > 0) {
      const placeholders = filters.companyIds.map(() => '?').join(',');
      query += ` AND company_id IN (${placeholders})`;
      params.push(...filters.companyIds);
    }

    query += ' ORDER BY name ASC';

    const result = await db.select<any[]>(query, params);
    
    return result.map(row => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      costPrice: row.cost_price,
      sellPrice: row.sell_price,
      unitPerCarton: row.unit_per_carton,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getAllWithCompany: async (filters?: ProductFilters): Promise<ProductWithCompany[]> => {
    const db = getDatabase();
    
    let query = `
      SELECT 
        p.*,
        c.name as company_name,
        c.address as company_address,
        c.email as company_email,
        c.phone as company_phone,
        c.created_at as company_created_at,
        c.updated_at as company_updated_at
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.search) {
      query += ' AND (p.name LIKE ? OR c.name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.companyIds && filters.companyIds.length > 0) {
      const placeholders = filters.companyIds.map(() => '?').join(',');
      query += ` AND p.company_id IN (${placeholders})`;
      params.push(...filters.companyIds);
    }

    query += ' ORDER BY p.name ASC';

    const result = await db.select<any[]>(query, params);
    
    return result.map(row => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      costPrice: row.cost_price,
      sellPrice: row.sell_price,
      unitPerCarton: row.unit_per_carton,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      company: {
        id: row.company_id,
        name: row.company_name,
        address: row.company_address,
        email: row.company_email,
        phone: row.company_phone,
        createdAt: new Date(row.company_created_at),
        updatedAt: new Date(row.company_updated_at),
      },
    }));
  },

  getById: async (id: string): Promise<Product | null> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      costPrice: row.cost_price,
      sellPrice: row.sell_price,
      unitPerCarton: row.unit_per_carton,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },

  getByCompany: async (companyId: string): Promise<Product[]> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM products WHERE company_id = ? ORDER BY name ASC', [companyId]);
    
    return result.map(row => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      costPrice: row.cost_price,
      sellPrice: row.sell_price,
      unitPerCarton: row.unit_per_carton,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO products (id, company_id, name, cost_price, sell_price, unit_per_carton, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.companyId, data.name, data.costPrice, data.sellPrice, data.unitPerCarton, now, now]
    );

    const created = await productService.getById(id);
    if (!created) {
      throw new Error('Failed to create product');
    }

    return created;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.companyId !== undefined) {
      updateFields.push('company_id = ?');
      params.push(data.companyId);
    }
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      params.push(data.name);
    }
    if (data.costPrice !== undefined) {
      updateFields.push('cost_price = ?');
      params.push(data.costPrice);
    }
    if (data.sellPrice !== undefined) {
      updateFields.push('sell_price = ?');
      params.push(data.sellPrice);
    }
    if (data.unitPerCarton !== undefined) {
      updateFields.push('unit_per_carton = ?');
      params.push(data.unitPerCarton);
    }

    updateFields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    await db.execute(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await productService.getById(id);
    if (!updated) {
      throw new Error('Product not found');
    }

    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.execute('DELETE FROM products WHERE id = ?', [id]);
  },

  calculateTotalUnits: (cartons: number, units: number, unitPerCarton: number): number => {
    return (cartons * unitPerCarton) + units;
  },

  formatQuantity: (totalUnits: number, unitPerCarton: number): QuantityInput => {
    const cartons = Math.floor(totalUnits / unitPerCarton);
    const units = totalUnits % unitPerCarton;
    
    return {
      cartons,
      units,
      totalUnits,
    };
  },
};

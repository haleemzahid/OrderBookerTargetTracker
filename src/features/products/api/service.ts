import { getDatabase } from '../../../services/database';
import { Product, CreateProductRequest, UpdateProductRequest, ProductFilterOptions } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const getProductById = async (id: string): Promise<Product | null> => {
  const db = getDatabase();
  const result = await db.select<any[]>(
    `SELECT 
      id, company_id as companyId, name, cost_price as costPrice, 
      sell_price as sellPrice, unit_per_carton as unitPerCarton, 
      created_at as createdAt, updated_at as updatedAt 
     FROM products 
     WHERE id = ?`,
    [id]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return parseProduct(result[0]);
};

export const getProducts = async (options?: ProductFilterOptions): Promise<Product[]> => {
  const db = getDatabase();
  let query = `
    SELECT 
      id, company_id as companyId, name, cost_price as costPrice, 
      sell_price as sellPrice, unit_per_carton as unitPerCarton, 
      created_at as createdAt, updated_at as updatedAt 
    FROM products
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (options?.companyId) {
    query += ` AND company_id = ?`;
    params.push(options.companyId);
  }
  
  if (options?.searchTerm) {
    query += ` AND name LIKE ?`;
    params.push(`%${options.searchTerm}%`);
  }
  
  if (options?.sortBy) {
    const sortColumn = getSortColumn(options.sortBy);
    const sortDirection = options.sortOrder === 'descend' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
  } else {
    query += ` ORDER BY name ASC`;
  }
  
  const result = await db.select<any[]>(query, params);
  return result.map(row => parseProduct(row));
};

export const createProduct = async (productData: CreateProductRequest): Promise<Product> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();
  
  await db.execute(
    `INSERT INTO products (
      id, company_id, name, cost_price, sell_price, unit_per_carton, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      productData.companyId, 
      productData.name, 
      productData.costPrice, 
      productData.sellPrice,
      productData.unitPerCarton,
      now,
      now
    ]
  );
  
  return {
    id,
    companyId: productData.companyId,
    name: productData.name,
    costPrice: productData.costPrice,
    sellPrice: productData.sellPrice,
    unitPerCarton: productData.unitPerCarton,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
};

export const updateProduct = async (id: string, productData: UpdateProductRequest): Promise<Product> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // Build dynamic update query
  const updateFields: string[] = [];
  const params: any[] = [id];
  
  if (productData.name !== undefined) {
    updateFields.push(`name = $${params.length + 1}`);
    params.push(productData.name);
  }
  
  if (productData.costPrice !== undefined) {
    updateFields.push(`cost_price = $${params.length + 1}`);
    params.push(productData.costPrice);
  }
  
  if (productData.sellPrice !== undefined) {
    updateFields.push(`sell_price = $${params.length + 1}`);
    params.push(productData.sellPrice);
  }
  
  if (productData.unitPerCarton !== undefined) {
    updateFields.push(`unit_per_carton = $${params.length + 1}`);
    params.push(productData.unitPerCarton);
  }
  
  // Add updated_at to fields and params
  updateFields.push(`updated_at = $${params.length + 1}`);
  params.push(now);
  
  const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $1`;
  await db.execute(query, params);
  
  // Get the updated product
  const updatedProduct = await getProductById(id);
  if (!updatedProduct) {
    throw new Error(`Failed to retrieve updated product with ID ${id}`);
  }
  
  return updatedProduct;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const db = getDatabase();
  await db.execute(`DELETE FROM products WHERE id = $1`, [id]);
};

export const getProductsByCompany = async (companyId: string): Promise<Product[]> => {
  return getProducts({ companyId });
};

// Helper function to parse product from database row
function parseProduct(row: any): Product {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    costPrice: row.costPrice,
    sellPrice: row.sellPrice,
    unitPerCarton: row.unitPerCarton,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

// Helper function to map sort field to database column
function getSortColumn(sortField: string): string {
  const columnMap: Record<string, string> = {
    'name': 'name',
    'costPrice': 'cost_price',
    'sellPrice': 'sell_price',
    'unitPerCarton': 'unit_per_carton',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  };
  
  return columnMap[sortField] || 'name';
}

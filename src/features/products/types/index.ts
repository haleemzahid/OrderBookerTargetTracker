import type { Company } from '../../companies/types';

export interface Product {
  id: string;
  companyId: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unitPerCarton: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  company?: Company;
}

export interface CreateProductRequest {
  companyId: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unitPerCarton: number;
}

export interface UpdateProductRequest {
  companyId?: string;
  name?: string;
  costPrice?: number;
  sellPrice?: number;
  unitPerCarton?: number;
}

export interface ProductFilters {
  search?: string;
  companyIds?: string[];
}

export interface ProductWithCompany extends Product {
  company: Company;
}

export interface QuantityInput {
  cartons: number;
  units: number;
  totalUnits: number; // Auto-calculated
}

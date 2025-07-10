export interface Product {
  id: string;
  companyId: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unitPerCarton: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  companyId: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unitPerCarton: number;
}

export interface UpdateProductRequest {
  name?: string;
  costPrice?: number;
  sellPrice?: number;
  unitPerCarton?: number;
}

export interface ProductFilterOptions {
  companyId?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

// ProductFormProps moved to product-form.tsx file as an internal interface

export interface ProductTableProps {
  data: Product[];
  loading?: boolean;
  onEdit: (orderBooker: Product) => void;
  onDelete: (orderBooker: Product) => void;
  companyFilter: boolean;
}
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

export interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export interface ProductTableProps {
  data: Product[];
  loading?: boolean;
  onEdit: (orderBooker: Product) => void;
  onDelete: (orderBooker: Product) => void;
  companyFilter: boolean;
}
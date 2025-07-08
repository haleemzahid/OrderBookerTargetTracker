export interface Company {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface CompanyFilters {
  search?: string;
}

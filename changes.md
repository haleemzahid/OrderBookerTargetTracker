# Database Migration and Architecture Changes

## Overview
This document outlines the major changes required to migrate from a simple sales/returns tracking system to a comprehensive product-based order and return management system for the Pakistani market.

## Migration Summary

### What is being changed:
- [ ] **Remove `name_urdu` from order bookers** - On hold (conflicts with existing UI)
- [x] **Add Companies table** for supplier/manufacturer management ✓
- [x] **Add Products table** with company relationship ✓
- [x] **Transform Daily Entries** from simple sales/returns to detailed product-based transactions ✓
- [ ] **Enhanced Return Management** with ability to return specific products from specific orders

### Key Business Logic Changes:
- [x] Users can enter quantities in cartons or individual units (auto-conversion based on units_per_carton) ✓
- [x] Flexible pricing: Override sell/cost price per transaction ✓
- [ ] Granular return tracking: Return specific products with quantities
- [x] Pakistani Rupee (Rs.) currency formatting in frontend ✓
- [ ] Production data migration support for order bookers

---

## Database Schema Changes

### New Migration Files Required

#### Migration 010: Create Companies Table
```sql
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
```

#### Migration 011: Create Products Table
```sql
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cost_price REAL NOT NULL,
    sell_price REAL NOT NULL,
    unit_per_carton INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
```

#### Migration 012: Transform Daily Entries Structure
```sql
-- Backup existing daily entries
CREATE TABLE daily_entries_backup AS SELECT * FROM daily_entries;

-- Create new daily_entries structure (header/summary table)
CREATE TABLE daily_entries_new (
    id TEXT PRIMARY KEY,
    order_booker_id TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    total_amount REAL NOT NULL DEFAULT 0,
    total_return_amount REAL NOT NULL DEFAULT 0,
    net_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE
);

-- Create daily_entry_items table (line items)
CREATE TABLE daily_entry_items (
    id TEXT PRIMARY KEY,
    daily_entry_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity_sold INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    net_quantity INTEGER DEFAULT 0,
    cost_price_override REAL,
    sell_price_override REAL,
    total_cost REAL NOT NULL DEFAULT 0,
    total_revenue REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Migrate existing data (create sample entries)
-- Note: Since existing data doesn't have product information, 
-- we'll need to create default products and map existing sales/returns

-- Drop old table and rename new one
DROP TABLE daily_entries;
ALTER TABLE daily_entries_new RENAME TO daily_entries;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_entries_order_booker ON daily_entries(order_booker_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_daily_entry_items_entry ON daily_entry_items(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_entry_items_product ON daily_entry_items(product_id);
```

---

## TypeScript Type Definitions

### New Types to Create

#### Company Types
```typescript
// src/features/companies/types/index.ts
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
```

#### Product Types
```typescript
// src/features/products/types/index.ts
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
```

#### Updated Daily Entry Types
```typescript
// src/features/daily-entries/types/index.ts
export interface DailyEntry {
  id: string;
  orderBookerId: string;
  date: Date;
  notes?: string;
  totalAmount: number;
  totalReturnAmount: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  orderBooker?: OrderBooker;
  items?: DailyEntryItem[];
}

export interface DailyEntryItem {
  id: string;
  dailyEntryId: string;
  productId: string;
  quantitySold: number;
  quantityReturned: number;
  netQuantity: number;
  costPriceOverride?: number;
  sellPriceOverride?: number;
  totalCost: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  product?: Product;
}

export interface CreateDailyEntryRequest {
  orderBookerId: string;
  date: Date | string;
  notes?: string;
  items: CreateDailyEntryItemRequest[];
}

export interface CreateDailyEntryItemRequest {
  productId: string;
  quantitySold: number;
  quantityReturned?: number;
  costPriceOverride?: number;
  sellPriceOverride?: number;
}

export interface QuantityInput {
  cartons: number;
  units: number;
  totalUnits: number; // Auto-calculated
}

export interface ReturnEntryRequest {
  originalEntryId: string;
  returns: Array<{
    productId: string;
    returnQuantity: number;
    reason?: string;
  }>;
}
```

---

## Frontend Component Changes

### New Features to Implement

#### 1. Company Management
```typescript
// src/features/companies/pages/companies-list.tsx
// src/features/companies/components/company-form.tsx
// src/features/companies/components/company-table.tsx
```

#### 2. Product Management
```typescript
// src/features/products/pages/products-list.tsx
// src/features/products/components/product-form.tsx
// src/features/products/components/product-table.tsx
// src/features/products/components/quantity-input.tsx
```

#### 3. Enhanced Daily Entry Form
```typescript
// Updated: src/features/daily-entries/components/daily-entry-form.tsx
// Features:
// - Product selection with search
// - Quantity input (cartons + units)
// - Price override capability
// - Real-time cost/revenue calculation
// - Return product selection
```

#### 4. Currency Formatting
```typescript
// src/shared/utils/currency.ts
export const formatRupees = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

export const parseRupees = (value: string): number => {
  return parseFloat(value.replace(/[Rs.,\s]/g, '')) || 0;
};
```

### Updated Daily Entry Form Structure
```typescript
// Enhanced form sections:
- [ ] Header Section:
   - Order Booker selection
   - Date picker
   - Notes

- [ ] Products Section:
   - Add Product button
   - Product selection with autocomplete
   - Quantity input (cartons/units toggle)
   - Price override inputs
   - Remove product button

- [ ] Returns Section (if editing):
   - Show previously sold products
   - Allow quantity returns
   - Return reason field

- [ ] Summary Section:
   - Total cost calculation
   - Total revenue calculation
   - Net profit/loss
   - Auto-calculated totals
```

---

## Service Layer Changes

### New Services Required

#### Company Service
```typescript
// src/features/companies/api/service.ts
export const companyService = {
  getAll: (filters?: CompanyFilters) => Promise<Company[]>,
  getById: (id: string) => Promise<Company | null>,
  create: (data: CreateCompanyRequest) => Promise<Company>,
  update: (id: string, data: UpdateCompanyRequest) => Promise<Company>,
  delete: (id: string) => Promise<void>,
};
```

#### Product Service
```typescript
// src/features/products/api/service.ts
export const productService = {
  getAll: (filters?: ProductFilters) => Promise<Product[]>,
  getById: (id: string) => Promise<Product | null>,
  getByCompany: (companyId: string) => Promise<Product[]>,
  create: (data: CreateProductRequest) => Promise<Product>,
  update: (id: string, data: UpdateProductRequest) => Promise<Product>,
  delete: (id: string) => Promise<void>,
  
  // Utility methods
  calculateTotalUnits: (cartons: number, units: number, unitPerCarton: number) => number,
  formatQuantity: (totalUnits: number, unitPerCarton: number) => QuantityInput,
};
```

#### Updated Daily Entry Service
```typescript
// Updated: src/features/daily-entries/api/service.ts
export const dailyEntryService = {
  // Existing methods...
  
  // New methods for product-based entries
  createWithItems: (data: CreateDailyEntryRequest) => Promise<DailyEntry>,
  updateWithItems: (id: string, data: UpdateDailyEntryRequest) => Promise<DailyEntry>,
  getWithItems: (id: string) => Promise<DailyEntry>,
  
  // Return functionality
  processReturns: (data: ReturnEntryRequest) => Promise<DailyEntry>,
  getReturnableProducts: (orderBookerId: string, fromDate: Date) => Promise<DailyEntryItem[]>,
};
```

---

## UI/UX Improvements

### Enhanced Components

#### 1. Quantity Input Component
```typescript
// Features:
// - Toggle between carton/unit input mode
// - Auto-conversion display
// - Clear visual feedback
// - Pakistani number formatting
```

#### 2. Product Selection Component
```typescript
// Features:
// - Autocomplete with company name
// - Recent products quick access
// - Product details popup
// - Stock level indicators (if needed later)
```

#### 3. Return Management Interface
```typescript
// Features:
// - View previously sold products
// - Select products for return
// - Specify return quantities
// - Return reason dropdown
// - Impact calculation on totals
```

### Pakistani Market Considerations
- [ ] **Currency**: All amounts displayed with "Rs." prefix
- [ ] **Number Format**: Pakistani comma formatting (1,00,000)
- [ ] **Unit Flexibility**: Easy switching between carton and piece counting
- [ ] **Urdu Support**: Maintain existing Urdu name fields for Order Bookers
- [ ] **Return Culture**: Accommodate common return scenarios in Pakistani wholesale

---

## Data Migration Strategy

### Production Migration Plan

#### Phase 1: Add New Tables
- [ ] Create companies table
- [ ] Create products table  
- [ ] Create sample data for existing entries

#### Phase 2: Create Default Data
```sql
-- Create default company for existing data
INSERT INTO companies (id, name, created_at, updated_at) 
VALUES ('default-company', 'Default Company', datetime('now'), datetime('now'));

-- Create default product for existing sales data
INSERT INTO products (id, company_id, name, cost_price, sell_price, unit_per_carton, created_at, updated_at)
VALUES ('default-product', 'default-company', 'General Product', 100, 120, 1, datetime('now'), datetime('now'));
```

#### Phase 3: Transform Existing Data
```sql
-- Convert existing daily_entries to new structure
-- This will be handled by migration script with proper data mapping
```

#### Phase 4: Update Application Code
- [ ] Deploy new frontend code
- [ ] Update API endpoints
- [ ] Test return functionality
- [ ] Train users on new features

---

## Testing Strategy

### Database Tests
- [ ] Migration rollback capability
- [ ] Data integrity checks
- [ ] Foreign key constraint validation
- [ ] Index performance verification

### Frontend Tests
- [ ] Product selection functionality
- [ ] Quantity conversion accuracy
- [ ] Return process workflow
- [ ] Currency formatting

### Integration Tests
- [ ] End-to-end order creation
- [ ] Return processing
- [ ] Calculation accuracy
- [ ] Data consistency

---

## Implementation Timeline

### Week 1: Database Structure ✅ COMPLETED
- [x] Create migration files (010, 011, 012) ✓
- [x] Implement company and product tables ✓
- [x] Design daily entry transformation ✓
- [x] Create data migration scripts ✓

### Week 2: Backend Services ✅ IN PROGRESS
- [x] Implement company service layer ✓
- [x] Implement product service layer ✓
- [x] Update daily entry service ✓
- [ ] Create return processing logic

### Week 3: Frontend Components ✅ IN PROGRESS
- [x] Build company management pages ✓
- [x] Build product management pages ✓
- [ ] Update daily entry forms
- [x] Implement quantity input components ✓

### Week 4: Integration & Testing
- [ ] Integration testing
- [ ] Migration testing with production data copy
- [ ] User acceptance testing
- [ ] Performance optimization

### Week 5: Deployment
- [ ] Production migration
- [ ] User training
- [ ] Monitor and fix issues
- [ ] Documentation updates

---

## Business Impact

### Benefits
- [ ] **Granular Tracking**: Track exactly which products are sold/returned
- [ ] **Better Analytics**: Product-wise performance analysis
- [ ] **Flexible Pricing**: Handle special pricing scenarios
- [ ] **Accurate Returns**: Match returns to specific sales
- [ ] **Scalability**: Support for multiple companies/suppliers

### User Experience Improvements
- [ ] **Intuitive Quantity Entry**: Switch between cartons and units easily
- [ ] **Smart Product Selection**: Quick search and recent items
- [ ] **Visual Calculations**: Real-time cost/profit calculations
- [ ] **Return Workflow**: Easy return processing with history
- [ ] **Pakistani Formatting**: Familiar currency and number formats

---

## Risks & Mitigation

### Technical Risks
- [ ] **Data Migration Complexity**: Mitigate with thorough testing and rollback plan
- [ ] **Performance Impact**: Monitor query performance with new structure
- [ ] **User Adoption**: Provide comprehensive training and gradual rollout

### Business Risks
- [ ] **Downtime During Migration**: Schedule during off-peak hours
- [ ] **Data Loss**: Multiple backups and validation checks
- [ ] **User Confusion**: Maintain familiar UI patterns where possible

---

## Future Enhancements

### Potential Features
- [ ] **Inventory Management**: Track stock levels per product
- [ ] **Purchase Orders**: Manage supplier orders
- [ ] **Price History**: Track price changes over time
- [ ] **Batch/Lot Tracking**: Track product batches
- [ ] **Commission Calculation**: Product-based commission rates
- [ ] **Mobile App**: Field order entry for order bookers

This comprehensive change document provides a roadmap for transforming the application from a simple sales tracker to a full-featured product-based order management system suitable for the Pakistani wholesale market.

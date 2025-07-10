# Order Module Implementation Tasks

This document outlines the tasks required to implement the Orders Module for the OrderBookerTargetTracker application. It follows the same patterns and structures used in the existing modules (order-bookers, products, companies).

## Database Structure

### 1. Create Database Tables Migration

- [ ] Create `orders` table (master table)
  - `id` TEXT PRIMARY KEY
  - `order_booker_id` TEXT NOT NULL (foreign key to order_bookers)
  - `order_date` TEXT NOT NULL (date of order entry)
  - `supply_date` TEXT (date of supply, could be null if not supplied yet)
  - `total_amount` REAL NOT NULL DEFAULT 0
  - `total_cost` REAL NOT NULL DEFAULT 0 
  - `total_profit` REAL NOT NULL DEFAULT 0
  - `total_cartons` REAL NOT NULL DEFAULT 0
  - `return_cartons` REAL NOT NULL DEFAULT 0
  - `return_amount` REAL NOT NULL DEFAULT 0
  - `status` TEXT NOT NULL DEFAULT 'pending' (pending, supplied, completed)
  - `notes` TEXT
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL

- [ ] Create `order_items` table (detail table)
  - `id` TEXT PRIMARY KEY
  - `order_id` TEXT NOT NULL (foreign key to orders)
  - `product_id` TEXT NOT NULL (foreign key to products)
  - `quantity` INTEGER NOT NULL
  - `cost_price` REAL NOT NULL
  - `sell_price` REAL NOT NULL
  - `total_cost` REAL NOT NULL
  - `total_amount` REAL NOT NULL
  - `profit` REAL NOT NULL
  - `cartons` REAL NOT NULL
  - `return_quantity` INTEGER NOT NULL DEFAULT 0
  - `return_amount` REAL NOT NULL DEFAULT 0
  - `return_cartons` REAL NOT NULL DEFAULT 0
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL

- [ ] Create appropriate indexes for performance
  - Index on `order_booker_id` for fast lookups
  - Index on `order_date` for date-based filtering
  - Index on `status` for status filtering
  - Index on `order_id` in the order_items table

- [ ] Create triggers for automatic calculations
  - Update order totals when items are added/modified/deleted
  - Calculate profit based on cost and sell prices
  - Update carton calculations based on product unit_per_carton

## TypeScript Type Definitions

### 2. Create Type Definitions

- [ ] Create `src/features/orders/types/index.ts`
  - Define `Order` interface (master record)
  - Define `OrderItem` interface (detail record)
  - Define `CreateOrderRequest` interface
  - Define `UpdateOrderRequest` interface
  - Define `OrderItemRequest` interface
  - Define `OrderFilters` interface for filtering and searching
  - Define component prop interfaces as needed

## API Services

### 3. Create API Layer

- [ ] Create API Service (`src/features/orders/api/service.ts`)
  - Implement CRUD operations for orders
  - Handle transaction for creating order with items
  - Implement methods for managing order items
  - Add support for returning products

- [ ] Create API Keys (`src/features/orders/api/keys.ts`)
  - Define query and mutation keys for React Query

- [ ] Create React Query Hooks
  - Create query hooks (`src/features/orders/api/queries.ts`)
  - Create mutation hooks (`src/features/orders/api/mutations.ts`)

## React Components

### 4. Create Order Components

- [ ] Create Order List Page (`src/features/orders/pages/orders-list.tsx`)
  - Review the monthly-target-list.tsx to make sure it follow the other module structure
  - Implement filters for order booker, date range, status
  - Show summary data (total orders, total amount, profit)
  - Use DataTable component for consistent UI

- [ ] Create Order Form Component (`src/features/orders/components/order-form.tsx`)
- Review the monthly-target-form.tsx to make sure it follow the other module structure
  - Select order booker with dropdown
  - Date picker for order date (default to today)
  - Notes field for additional information
  - Container for order items table

- [ ] Create Order Items Table (`src/features/orders/components/order-items-table.tsx`)
- Review the monthly-target-table.tsx to make sure it follow the other module structure
  - Implement inline editing capability
  - Auto-add new row when current row is valid
  - Product selector with dropdown
  - Quantity input with validation
  - Auto-populate cost and sell prices from product
  - Allow sell price adjustment
  - Show calculated values (total, profit)
  - Support returns marking
  - Implement double-click to edit functionality

- [ ] Create Order Detail View (`src/features/orders/components/order-detail.tsx`)
  - Show order summary information
  - Display items in a table
  - Support for marking returns
  - Calculation summaries (totals, profit)

### 5. UI/UX Implementation

- [ ] Implement master-detail view for orders
  - Order header information (master)
  - Order items with inline editing (detail)

- [ ] Create confirmation dialogs
  - Confirm when marking items as returned
  - Confirm when deleting orders

- [ ] Implement validation
  - Prevent negative quantities
  - Validate required fields
  - Ensure sell price is reasonable (warning if too low)

## Feature Integration

### 6. Feature Integration

- [ ] Add routes for order pages
  - Orders list route
  - Order creation/editing routes

- [ ] Update sidebar navigation
  - Add Orders section to sidebar

- [ ] Create feature index file (`src/features/orders/index.ts`)
  - Export public components and types
  - Set up feature routes

### 7. Additional Functionalities

- [ ] Add export functionality
  - Export orders to Excel/CSV
  - Print order forms


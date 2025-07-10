# Order Module Implementation Tasks

This document outlines the tasks required to implement the Orders Module for the OrderBookerTargetTracker application. It follows the same patterns and structures used in the existing modules (order-bookers, products, companies).

## Business Context and Requirements

### WHY - Business Need
The orders module is needed to track and manage the core business operation: recording orders from shops through order bookers. Currently, order bookers collect orders on paper from shopkeepers, and the office staff needs to digitally record these orders for processing and supply management.

### WHAT - Core Functionality
The module should handle:
1. **Order Entry**: Recording orders brought by order bookers from shops
2. **Product Management**: Adding products to orders with flexible pricing
3. **Return Processing**: Handling returned products when shopkeepers don't accept full deliveries
4. **Calculations**: Auto-calculating totals, profits, and carton quantities
5. **Supply Tracking**: Managing the supply process and returns

### HOW - User Experience Flow

#### Order Creation Flow:
1. **Order Booker Selection**: User selects which order booker brought the order
2. **Date Entry**: Order date defaults to today (can be adjusted)
3. **Product Entry**: Inline table where user can:
   - Select a product from dropdown
   - Enter quantity (starts at 0)
   - Cost price auto-populates from product master
   - Sell price auto-populates but can be modified (negotiation-based pricing)
   - Row auto-saves when valid and complete
   - New empty row appears automatically after saving current row
4. **Auto-calculations**: System calculates total cartons, total price, and profit automatically

#### Return Management Flow:
1. **Return Entry**: When entering returns, user can:
   - Select products from the order list
   - Enter return quantity (max = original order quantity)
   - System asks for confirmation before processing returns
   - Option to return entire order with single action
2. **Return Calculations**: System automatically calculates return cartons and return amount

#### Technical Implementation Details:
- **Inline Editing**: Table with editable rows, double-click to edit existing rows
- **Validation**: Prevent negative quantities, validate required fields
- **Flexible Pricing**: Sell prices can vary based on negotiation (not fixed pricing)
- **Master-Detail Structure**: Orders (master) contain multiple order items (details)
- **Auto-save**: Rows save automatically when input loses focus and data is valid
- **Confirmation Dialogs**: Required for return operations to prevent accidental data loss

#### Key Business Rules:
1. **Pricing Flexibility**: Sell prices are negotiable and can differ from standard product prices
2. **Return Limits**: Cannot return more than originally ordered
3. **No Customer Tracking**: Focus is on order booker and products, not end customers
4. **Supply Timing**: Orders can be entered before or during supply process
5. **Pakistani Context**: Use "Rs." for currency, design for local business practices

## Database Structure

### 1. Create Database Tables Migration

- [x] Create `orders` table (master table)
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

- [x] Create `order_items` table (detail table)
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

- [x] Create appropriate indexes for performance
  - Index on `order_booker_id` for fast lookups
  - Index on `order_date` for date-based filtering
  - Index on `status` for status filtering
  - Index on `order_id` in the order_items table

- [x] Create triggers for automatic calculations
  - Update order totals when items are added/modified/deleted
  - Calculate profit based on cost and sell prices
  - Update carton calculations based on product unit_per_carton

## TypeScript Type Definitions

### 2. Create Type Definitions

- [x] Create `src/features/orders/types/index.ts`
  - Define `Order` interface (master record)
  - Define `OrderItem` interface (detail record)
  - Define `CreateOrderRequest` interface
  - Define `UpdateOrderRequest` interface
  - Define `OrderItemRequest` interface
  - Define `OrderFilters` interface for filtering and searching
  - Define component prop interfaces as needed

## API Services

### 3. Create API Layer

- [x] Create API Service (`src/features/orders/api/service.ts`)
  - Implement CRUD operations for orders
  - Handle transaction for creating order with items
  - Implement methods for managing order items
  - Add support for returning products

- [x] Create API Keys (`src/features/orders/api/keys.ts`)
  - Define query and mutation keys for React Query

- [x] Create React Query Hooks
  - Create query hooks (`src/features/orders/api/queries.ts`)
  - Create mutation hooks (`src/features/orders/api/mutations.ts`)

## React Components

### 4. Create Order Components

- [x] Create Order List Page (`src/features/orders/pages/orders-list.tsx`)
  - Review the monthly-target-list.tsx to make sure it follow the other module structure
  - Implement filters for order booker, date range, status
  - Show summary data (total orders, total amount, profit)
  - Use DataTable component for consistent UI

- [x] Create Order Form Component (`src/features/orders/components/order-form.tsx`)
- Review the monthly-target-form.tsx to make sure it follow the other module structure
  - Select order booker with dropdown
  - Date picker for order date (default to today)
  - Notes field for additional information
  - Container for order items table

- [x] Create Order Items Table (`src/features/orders/components/order-items-table.tsx`)
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

- [x] Create Order Detail View (`src/features/orders/components/order-detail.tsx`)
  - Show order summary information
  - Display items in a table
  - Support for marking returns
  - Calculation summaries (totals, profit)

### 5. UI/UX Implementation

- [x] Implement master-detail view for orders
  - Order header information (master)
  - Order items with inline editing (detail)

- [x] Create confirmation dialogs
  - Confirm when marking items as returned
  - Confirm when deleting orders

- [x] Implement validation
  - Prevent negative quantities
  - Validate required fields
  - Ensure sell price is reasonable (warning if too low)

## Feature Integration

### 6. Feature Integration

- [x] Add routes for order pages
  - Orders list route
  - Order creation/editing routes

- [x] Update sidebar navigation
  - Add Orders section to sidebar

- [x] Create feature index file (`src/features/orders/index.ts`)
  - Export public components and types
  - Set up feature routes

### 7. Additional Functionalities

- [x] Add export functionality
  - Export orders to Excel/CSV
  - Print order forms


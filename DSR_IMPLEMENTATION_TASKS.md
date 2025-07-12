# Daily Sales Report (DSR) Module Implementation Tasks

## Overview
Implement a new "Daily Sales Report" module that shows aggregated sales data grouped by product and sale price with date filtering capabilities. The module should follow existing codebase patterns and provide a compact view of sales performance.

## Requirements Summary
- **Code Name**: DailySalesReport (internal)
- **UI Display**: DSR (user-facing)
- **Functionality**: Group products by ID and sale price, show aggregated sales data
- **Data**: Product, Sale Price, Cost Price, Total Cartons, Return Cartons, Net Cartons, Return Amount, Net Amount, Total Amount, Profit
- **Features**: Date filtering, export functionality, summary totals
- **Design**: Compact layout following existing design system

---

## Implementation Tasks

### Phase 1: Project Structure Setup

#### [x] Task 1: Create Feature Module Structure
- [x] Create `src/features/daily-sales-report/` directory
- [x] Create subdirectories:
  - [x] `api/` (queries, mutations, service, keys)
  - [x] `components/` 
  - [x] `pages/`
  - [x] `types/`
  - [x] `hooks/` (if needed)
- [x] Create `index.ts` barrel export file in feature root

#### [x] Task 2: Setup TypeScript Types
- [x] Create `src/features/daily-sales-report/types/index.ts`
- [x] Define interfaces:
  - [x] `DailySalesReportItem` - single row data structure
  - [x] `DailySalesReportFilters` - filter options (date range, etc.)
  - [x] `DailySalesReportSummary` - summary totals
  - [x] `DailySalesReportTableProps` - component props
  - [x] `DailySalesReportPageProps` - page props

### Phase 2: Data Layer Implementation

#### [x] Task 3: Create API Service
- [x] Create `src/features/daily-sales-report/api/service.ts`
- [x] Implement functions:
  - [x] `getDailySalesReport(filters)` - main data fetching with SQL query
  - [x] `getDailySalesReportSummary(filters)` - calculate summary totals
- [x] SQL Query Requirements:
  - [x] JOIN `order_items`, `products`, `orders` tables
  - [x] GROUP BY `product_id`, `sell_price`
  - [x] Filter by date range from `orders.order_date`
  - [x] Calculate aggregations: SUM(cartons), SUM(return_cartons), SUM(total_amount), etc.
  - [x] Order by product name, then by sell price

#### [x] Task 4: Create Query Keys
- [x] Create `src/features/daily-sales-report/api/keys.ts`
- [x] Define query keys following existing pattern:
  - [x] `dailySalesReport.all`
  - [x] `dailySalesReport.list(filters)`
  - [x] `dailySalesReport.summary(filters)`

#### [x] Task 5: Create React Query Hooks
- [x] Create `src/features/daily-sales-report/api/queries.ts`
- [x] Implement hooks:
  - [x] `useDailySalesReport(filters)` - main data query
  - [x] `useDailySalesReportSummary(filters)` - summary query
- [x] Configure appropriate stale times and cache settings

### Phase 3: Component Development

#### [x] Task 6: Create DSR Table Component
- [x] Create `src/features/daily-sales-report/components/daily-sales-report-table.tsx`
- [x] Implement table with columns:
  - [x] Product Name
  - [x] Sale Price (formatted with Rs. prefix)
  - [x] Cost Price (formatted with Rs. prefix)
  - [x] Total Cartons (with decimal precision)
  - [x] Return Cartons (with decimal precision)
  - [x] Net Cartons (calculated: Total - Return)
  - [x] Return Amount (formatted currency, red color if > 0)
  - [x] Net Amount (formatted currency)
  - [x] Total Amount (formatted currency)
  - [x] Profit (formatted currency with margin percentage tooltip)
- [x] Add table features:
  - [x] Sorting on all columns
  - [x] Responsive design with horizontal scroll
  - [x] Summary row at bottom with totals (using Ant Design Table.Summary)
  - [x] Loading states
  - [x] Empty state handling

#### [x] Task 7: Create Date Filter Component
- [x] Create `src/features/daily-sales-report/components/date-filter.tsx`
- [x] Implement:
  - [x] Date range picker (From Date, To Date)
  - [x] Default to current month
  - [x] Format: DD/MM/YYYY
  - [x] Clear functionality
  - [x] Validation (To Date >= From Date)
  - [ ] Add Today, Yesterday Buttons

#### [x] Task 8: Create Main Page Component
- [x] Create `src/features/daily-sales-report/pages/daily-sales-report-list.tsx`
- [x] Implement:
  - [x] Use `ListPageLayout` wrapper
  - [x] Use `ActionBar` with search and export
  - [x] Date filter integration
  - [x] Table component integration
  - [x] Export functionality setup
  - [x] Error handling and loading states

### Phase 4: Export Functionality

#### [x] Task 9: Implement Export Feature
- [x] Add export columns configuration in main page
- [x] Define export data transformation:
  - [x] Product name
  - [x] Sale price (formatted)
  - [x] Cost price (formatted)
  - [x] All carton and amount fields
  - [x] Calculated profit margins
- [x] Support Excel, PDF, Word formats using existing `ExportService`
- [x] Include summary row in exports

### Phase 5: Routing and Navigation

#### [x] Task 10: Add Route Configuration
- [x] Update `src/app/router/index.ts`
- [x] Add new route:
  - [x] Path: `/daily-sales-report` or `/dsr`
  - [x] Component: `DailySalesReportListPage`
  - [x] Add to route tree

#### [x] Task 11: Update Navigation Menu
- [x] Update `src/components/layouts/Sidebar.tsx`
- [x] Add new menu item:
  - [x] Key: `daily-sales-report`
  - [x] Label: `DSR`
  - [x] Icon: `BarChartOutlined` or similar
  - [x] Position: After Orders, before Reports
- [x] Update navigation handler and current key detection

### Phase 6: Integration and Polish

#### [x] Task 12: Create Feature Barrel Exports
- [x] Update `src/features/daily-sales-report/index.ts`
- [x] Export all public APIs:
  - [x] Types
  - [x] Components
  - [x] Pages
  - [x] API hooks
  - [x] Feature metadata

#### [x] Task 13: Add Feature Metadata
- [x] Add feature metadata object for AI agents:
  - [x] Name, description, version
  - [x] Dependencies list
  - [x] API list
  - [x] Component list
  - [x] Route information

#### [ ] Task 14: UI Polish and Optimization
- [ ] Apply consistent styling following design system
- [ ] Add proper loading skeletons
- [ ] Implement error boundaries
- [ ] Add responsive breakpoints
- [ ] Optimize performance with memoization
- [ ] Add accessibility attributes (ARIA labels, etc.)

### Phase 7: Testing and Documentation

#### [ ] Task 15: Add Error Handling
- [ ] Implement proper error states in components
- [ ] Add error boundaries for the feature
- [ ] Handle API errors gracefully
- [ ] Add user-friendly error messages

#### [ ] Task 16: Performance Optimization
- [ ] Add proper React.memo where needed
- [ ] Optimize re-renders with useCallback/useMemo
- [ ] Implement proper dependency arrays

---

## Technical Specifications

### Data Structure Requirements
```typescript
interface DailySalesReportItem {
  productId: string;
  productName: string;
  sellPrice: number;
  costPrice: number;
  totalCartons: number;
  returnCartons: number;
  netCartons: number; // calculated
  totalAmount: number;
  returnAmount: number;
  netAmount: number; // calculated
  profit: number; // calculated
  profitMargin: number; // calculated percentage
}
```

### SQL Query Pattern
```sql
SELECT 
  p.id as productId,
  p.name as productName,
  oi.sell_price as sellPrice,
  oi.cost_price as costPrice,
  SUM(oi.cartons) as totalCartons,
  SUM(oi.return_cartons) as returnCartons,
  SUM(oi.total_amount) as totalAmount,
  SUM(oi.return_amount) as returnAmount,
  SUM(oi.profit) as profit
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
GROUP BY p.id, oi.sell_price
ORDER BY p.name, oi.sell_price
```

### UI Design Requirements
- **Layout**: Compact table design
- **Colors**: Follow existing color scheme (blue for amounts, green/red for profit/loss)
- **Typography**: Consistent with design system
- **Spacing**: Minimal padding for data density
- **Export**: All existing formats (Excel, PDF, Word)

---

## Dependencies
- Existing shared components (`ListPageLayout`, `ActionBar`, `FormatNumber`)
- Existing database structure (orders, order_items, products tables)
- Existing export service
- Ant Design components
- React Query for data management
- TanStack Router for navigation

## Success Criteria
- [ ] DSR module accessible via navigation menu
- [ ] Date filtering works correctly
- [ ] Data grouped properly by product and sale price
- [ ] All calculations accurate (net cartons, net amount, profit)
- [ ] Summary row shows correct totals
- [ ] Export functionality works in all formats
- [ ] Responsive design works on different screen sizes
- [ ] Follows existing code patterns and design system
- [ ] Performance is acceptable with large datasets

---

## Notes for Implementation
1. Follow existing TypeScript patterns and interfaces
2. Use existing shared components where possible
3. Maintain consistency with current design system
4. Ensure proper error handling throughout
5. Add proper loading states for better UX
6. Consider pagination for very large datasets
7. Test with different date ranges and data scenarios

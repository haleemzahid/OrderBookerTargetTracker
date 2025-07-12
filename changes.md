# Order Module Refactoring - Implementation Plan

## Overview
This document tracks the implementation of major changes to the order system to improve usability for non-tech-savvy wholesale business users in Pakistan.

## Key Changes Summary
1. Remove carton field for order items, change Qty to cartons
2. Enable return quantity entry during order creation
3. Remove status from order table
4. Replace quantity input with carton calculator (whole cartons + units)
5. Remove supply date from order form
6. Change "Return Quantity" to "Return Cartons" in view form
7. Replace summary cards with Ant Design built-in summary
8. Fix product dropdown not populating cost/sale price in edit mode
9. Make order-items-table readonly (only used in order detail)

## Implementation Phases

### Phase 1: Type System Updates ✅ Ready to Implement

#### Task 1.1: Update Order Interface
**File:** `src/features/orders/types/index.ts`
**Changes:**
- Remove `supplyDate` from Order interface
- Remove `status` from Order interface  
- Remove `supplyDate` from CreateOrderRequest interface
- Remove `status` from UpdateOrderRequest interface
- Update `CreateOrderItemRequest` to use `cartons` instead of `quantity`
- Add `returnCartons` to `CreateOrderItemRequest`

#### Task 1.2: Update OrderFilters Interface
**File:** `src/features/orders/types/index.ts`
**Changes:**
- Remove `status` filter option
- Remove status-related types

### Phase 2: Core Components - Carton Calculator ✅ Ready to Implement

#### Task 2.1: Create CartonQuantityInput Component
**File:** `src/components/common/CartonQuantityInput.tsx` (new file)
**Purpose:** Create a user-friendly carton calculator that allows:
- Input as whole cartons + remaining units
- Button to popup detailed unit entry
- Automatic decimal calculation for storage
- Clear display of total units calculation

**Requirements:**
- Takes `unitPerCarton` prop from product
- Returns decimal cartons for calculations
- Shows "X cartons + Y units = Z total units" 
- Has popup modal for precise unit entry
- Validates that remaining units < unitPerCarton

#### Task 2.2: Enhance QuantityInput Component
**File:** `src/components/common/QuantityInput.tsx`
**Changes:**
- Add popup/modal functionality for detailed unit entry
- Ensure it works well for non-tech users
- Add better visual feedback

### Phase 3: Order Form Updates ✅ Ready to Implement

#### Task 3.1: Update Order Form Layout
**File:** `src/features/orders/components/order-form.tsx`
**Changes:**
- Remove supply date field from form
- Update form validation to remove supply date requirement
- Update submit handler to not send supply date

#### Task 3.2: Update OrderItemsTable for Forms
**File:** `src/features/orders/components/OrderItemsTable.tsx`
**Changes:**
- Replace "Quantity" column with "Cartons" 
- Integrate CartonQuantityInput component
- Add "Return Cartons" column for order creation
- Remove "Cartons" calculated column (since Quantity becomes Cartons)
- Fix product selection to populate cost/sell price correctly
- Add validation for return cartons ≤ ordered cartons

### Phase 4: Orders List Page ✅ Ready to Implement

#### Task 4.1: Replace Summary Cards with Table Summary
**File:** `src/features/orders/pages/orders-list.tsx`
**Changes:**
- Remove `renderSummaryCards()` function
- Remove summary cards from JSX
- Add Table.Summary to OrderTable component instead

#### Task 4.2: Remove Status Filtering
**File:** `src/features/orders/pages/orders-list.tsx`
**Changes:**
- Remove status filter from extraActions
- Remove status from queryFilters
- Update export columns to remove status

### Phase 5: Order Table Updates ✅ Ready to Implement

#### Task 5.1: Remove Status Column
**File:** `src/features/orders/components/order-table.tsx`
**Changes:**
- Remove status column from columns array
- Remove status filter configuration
- Remove getStatusColor function
- Update imports to remove status-related dependencies

#### Task 5.2: Remove Supply Date Column
**File:** `src/features/orders/components/order-table.tsx`
**Changes:**
- Remove supply date column from columns array
- Update table layout

#### Task 5.3: Add Built-in Table Summary
**File:** `src/features/orders/components/order-table.tsx`
**Changes:**
- Add Table.Summary to show totals at bottom
- Calculate total amount, cost, profit, cartons
- Style summary row appropriately

### Phase 6: View-Only Order Items Table ✅ Ready to Implement

#### Task 6.1: Make Table Completely Read-Only
**File:** `src/features/orders/components/order-items-table.tsx`
**Changes:**
- Remove all editable functionality (should already be done via `editable=false`)
- Remove action columns
- Remove inline editing capabilities
- Simplify component to pure display

#### Task 6.2: Update Column Headers and Terminology
**File:** `src/features/orders/components/order-items-table.tsx`
**Changes:**
- Change "Quantity" to "Cartons"
- Change "Return Qty" to "Return Cartons"  
- Remove "Cartons" column (redundant since Quantity becomes Cartons)
- Update data rendering for cartons display

### Phase 7: Order Detail Component ✅ Ready to Implement

#### Task 7.1: Update Order Detail Display
**File:** `src/features/orders/components/order-detail.tsx`
**Changes:**
- Remove supply date from order information
- Remove status from order information  
- Update "Return Quantity" to "Return Cartons" in returns section
- Update component to use new readonly order-items-table

### Phase 8: API and Backend Alignment ✅ Ready to Implement

#### Task 8.1: Update API Service Types
**File:** `src/features/orders/api/service.ts`
**Changes:**
- Update function signatures to use cartons instead of quantity
- Ensure return cartons are properly handled
- Remove status and supply date from create/update operations

#### Task 8.2: Update Mutations
**Files:** `src/features/orders/api/mutations.ts`
**Changes:**
- Update mutation interfaces to match new types
- Ensure proper handling of cartons and return cartons

#### Task 8.3: Update Queries
**Files:** `src/features/orders/api/queries.ts`
**Changes:**
- Remove status-based filtering
- Update query interfaces

### Phase 9: Validation and Error Handling ✅ Ready to Implement

#### Task 9.1: Update Form Validation
**Files:** Multiple form components
**Changes:**
- Add validation for return cartons ≤ ordered cartons
- Remove supply date validation
- Add carton quantity validation
- Ensure decimal carton calculations are validated

#### Task 9.2: Update Error Messages
**Files:** Multiple components
**Changes:**
- Update error messages to use "cartons" terminology
- Add user-friendly validation messages for carton calculator

## Implementation Notes

### Key Design Decisions
1. **Cartons as Primary Unit**: Users think in cartons, not individual units
2. **Return Support in Creation**: Allow returns to be planned during order creation
3. **Simplified Interface**: Remove status complexity for wholesale operations
4. **User-Friendly Calculator**: Help users easily convert cartons+units to decimal

### Database Compatibility
- Current schema already supports all these changes
- No database migrations required
- All calculated fields (cartons, return_cartons) already exist

### User Experience Focus
- **Non-tech users**: Simple carton-based entry
- **Pakistani context**: Wholesale business practices
- **Error prevention**: Clear validation and helpful messages
- **Efficiency**: Remove unnecessary fields and steps

## Current Status
- [x] Phase 1: Type System Updates ✅ COMPLETED
- [x] Phase 2: Core Components ✅ COMPLETED
- [x] Phase 3: Order Form Updates ✅ COMPLETED
- [x] Phase 4: Orders List Page ✅ COMPLETED
- [x] Phase 5: Order Table Updates ✅ COMPLETED
- [x] Phase 6: View-Only Table ✅ COMPLETED
- [x] Phase 7: Order Detail Component ✅ COMPLETED
- [ ] Phase 8: API Alignment
- [ ] Phase 9: Validation

## Next Steps
1. Start with Phase 1 (Type System Updates) as foundation
2. Implement Phase 2 (CartonQuantityInput component) for core functionality
3. Work through phases sequentially to maintain system consistency
4. Test each phase before moving to the next

## Dependencies Between Phases
- Phase 1 must be completed before all others (type foundation)
- Phase 2 must be completed before Phase 3 (CartonQuantityInput needed for forms)
- Phase 3 and 5 can be done in parallel (different components)
- Phase 6 and 7 depend on Phase 1 type updates
- Phase 8 depends on Phase 1 completion
- Phase 9 depends on Phases 1-8 completion
- Phase 10 depends on all previous phases

---
*This document should be updated as tasks are completed and any issues or additional requirements are discovered during implementation.*

# Customer Credit Management Module - Implementation Tasks

## Project Overview
Adding a comprehensive Customer Credit Management system to the Order Booker Target Tracker application. This module will prevent cash flow problems by tracking customer credit limits, outstanding balances, payment behavior, and integrating credit validation directly into the order creation process. The system is designed specifically for Pakistani wholesale business practices and cultural context.

## 📋 Task Summary - Updated Status (July 16, 2025)
- **Total Tasks**: 35 tasks across 8 phases
- **Completed Tasks**: 20 tasks ✅
- **In Progress**: 1 task 🔄
- **Remaining**: 14 tasks ⏳
- **Priority Breakdown**: 12 Critical (11 done), 15 High (7 done), 6 Medium (2 done), 2 Low (0 done)
- **Overall Progress**: ~57% complete

### ✅ **Completed Phases**:
- **Phase 1**: Database Schema & Core Infrastructure (7/7 tasks) ✅
- **Phase 2**: Core Type Definitions (2/2 tasks) ✅  
- **Phase 3**: Database Service Implementation (4/4 tasks) ✅
- **Phase 4**: React Query Integration (3/3 tasks) ✅
- **Phase 5**: UI Components (4/6 tasks) ✅ Major components completed

### ✅ **Completed Phases**:
// ...existing code...
### ✅ **Completed Phases**:

### ⏳ **Pending**:
- **Phase 6**: Order Integration (0/4 tasks)
- **Phase 7**: Advanced Features (0/6 tasks) 
- **Phase 8**: Navigation & Routes (2/4 tasks) - Pages creation pending

---

## 🎯 **Immediate Next Steps**

### **High Priority (Complete Core Functionality)**
1. **Create Customer Pages** - Task 8.2 & 8.3 (High)
   - Files: `src/features/customers/pages/customer-list-page.tsx`, `customer-detail-page.tsx`
   - Customer management pages for navigation
   
2. **Add Customer Routes** - Task 8.1 (High)
   - File: `src/features/customers/routes/index.ts`
   - Navigation routes for customer management
   
3. **Create Collection Dashboard Component** - Task 5.6 (High)
   - File: `src/features/customers/components/collection-dashboard.tsx`
   - Overview of collection activities and alerts
   
4. **Enhance Order Form with Credit Integration** - Task 6.1 (Critical)
   - File: `src/features/orders/components/order-form.tsx`
   - Integrate credit validation into order creation

### **Components Completed in Current Session**
- ✅ **Customer Form Component** (`customer-form.tsx`): Comprehensive customer creation/editing with Pakistani business context including tabbed interface, CNIC validation, credit terms, and cultural considerations
- ✅ **Payment Form Component** (`payment-form.tsx`): Payment recording interface with customer search, multiple payment methods, WhatsApp integration, and payment summary calculations
- ✅ **Customer Credit Widget** (`customer-credit-widget.tsx`): Real-time credit status display with traffic light system, utilization progress, overdue alerts, and quick action buttons
- ✅ **Customer Select Component** (`customer-select.tsx`): Enhanced customer selection with credit validation, search capabilities, and inline customer creation
- ✅ **All TypeScript Compilation Errors Fixed**: All components compile without errors and follow strict TypeScript practices
- ✅ **Component Index Updated**: All new components properly exported from `components/index.ts`

### **Pages Created (Now Integrated)**
- ✅ **Customer List Page** (`customer-list-page.tsx`): Management page with dashboard stats, customer list, and modal forms
- ✅ **Customer Detail Page** (`customer-detail-page.tsx`): Detailed customer view with credit history, transactions, and management actions

### **Issues Fixed in Current Session**
- ✅ **Customer List Type Error**: Fixed `Customer[]` vs `CustomerWithCredit[]` type mismatch
- ✅ **Import Cleanup**: Removed unused `CustomerFilters` import in customer-list.tsx

### **Current Status of Customer List**
- ✅ Customer list displays properly with credit information
- ✅ Advanced filtering modal with Pakistani business context  
- ✅ Credit status indicators and risk badges
- ✅ Payment behavior tracking
- ✅ No compilation errors
- ⚠️ **Note**: Customer list shows but requires backend data integration to display actual customers

---

## 🏛️ **Validation Rules & Best Practices**

### **TypeScript Best Practices**
- Use strict TypeScript configuration with explicit return types
- Define comprehensive interfaces for all data models
- Use discriminated unions for status types (`'good' | 'warning' | 'blocked'`)
- Implement proper error handling with typed exceptions
- Use utility types (Pick, Omit, Partial) for API request/response types
- Follow kebab-case for file naming convention
- Use dashboard-store naming convention for state management

### **React Best Practices**
- Use functional components with hooks exclusively
- Implement proper error boundaries around credit management features
- Use React.memo for expensive credit calculation components
- Implement proper cleanup in useEffect hooks
- Separate data fetching logic from presentation components
- Use custom hooks for credit validation and calculation logic
- Implement proper loading states and error handling

### **Database Design Principles**
- Follow existing SQLite migration pattern starting from migration_022
- Implement proper foreign key constraints with CASCADE options
- Use TEXT PRIMARY KEY with UUID for all new tables
- Include created_at and updated_at timestamps on all tables
- Implement database triggers for automatic balance calculations
- Add proper indexes for frequently queried columns
- Use CHECK constraints for data validation at database level

### **API Design Standards**
- Follow existing service pattern with interfaces (ICustomerService)
- Implement proper error handling with typed exceptions
- Use consistent parameter naming (camelCase in TypeScript, snake_case in SQL)
- Implement proper data transformation between database and API layers
- Add comprehensive JSDoc comments for all public methods
- Follow existing query pattern with optional filters
- Implement proper transaction handling for multi-table operations

### **UI/UX Design Guidelines**
- Follow existing Ant Design theme configuration
- Use consistent color coding: Green (good credit), Yellow (warning), Red (blocked)
- Implement responsive design for both desktop and tablet use
- Use proper loading states and skeleton components
- Follow existing table design patterns with action columns
- Implement proper form validation with clear error messages
- Use Rs. currency formatting throughout Pakistani context
- Support Urdu text display for customer names and addresses

### **Business Logic Validation**
- Implement credit limit validation before order creation
- Check overdue payments before extending new credit
- Apply cultural business rules (Ramadan/Eid extensions)
- Validate customer relationship types and apply appropriate rules
- Implement payment behavior scoring and risk assessment
- Apply area-based risk management rules
- Implement proper audit trails for all credit transactions

### **Security & Data Protection**
- Implement proper input validation and sanitization
- Use parameterized queries to prevent SQL injection
- Apply proper access controls for sensitive financial data
- Implement audit logging for all credit management operations
- Validate CNIC format for Pakistani identification numbers
- Implement proper data encryption for sensitive customer information

---

## Phase 1: Database Schema & Core Infrastructure

### [X] Task 1.1: Verify Migration System ✅ COMPLETED
- **Priority**: Critical | **Time**: 30 minutes
- **Description**: Check current highest migration number and verify migration system
- **Files to Check**: `src-tauri/src/migrations/mod.rs`
- **Context**: Migration system verified, using migrations 022-027 for customer features
- **Validation**: All migrations are properly registered in mod.rs

### [X] Task 1.2: Create Customers Table Migration ✅ COMPLETED
- **Priority**: Critical | **Time**: 2 hours
- **Files to Create**: `src-tauri/src/migrations/migration_022_create_customers_table.rs`
- **Description**: Create comprehensive customers table with Pakistani business context

**Schema Requirements**:
```sql
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    cnic TEXT UNIQUE, -- Pakistani CNIC format validation
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    whatsapp_number TEXT,
    address TEXT,
    city TEXT,
    area TEXT, -- For delivery routing and risk assessment
    
    -- Credit Information
    credit_limit REAL DEFAULT 0 CHECK (credit_limit >= 0),
    credit_days INTEGER DEFAULT 30 CHECK (credit_days > 0),
    current_outstanding REAL DEFAULT 0 CHECK (current_outstanding >= 0),
    
    -- Business Classification
    customer_type TEXT DEFAULT 'credit' CHECK (customer_type IN ('cash', 'credit', 'special')),
    shop_type TEXT DEFAULT 'retail' CHECK (shop_type IN ('retail', 'distributor', 'sub_distributor')),
    payment_behavior TEXT DEFAULT 'new' CHECK (payment_behavior IN ('new', 'excellent', 'good', 'delayed', 'problematic')),
    relationship_type TEXT DEFAULT 'business' CHECK (relationship_type IN ('business', 'family', 'friend', 'reference')),
    
    -- Risk Management
    credit_status TEXT DEFAULT 'good' CHECK (credit_status IN ('good', 'warning', 'blocked', 'cash_only')),
    last_payment_date DATE,
    average_delay_days INTEGER DEFAULT 0,
    total_orders_count INTEGER DEFAULT 0,
    total_lifetime_value REAL DEFAULT 0,
    
    -- Communication Preferences
    preferred_contact_method TEXT DEFAULT 'call' CHECK (preferred_contact_method IN ('call', 'whatsapp', 'visit', 'sms')),
    best_contact_time TEXT, -- "morning", "evening", etc.
    
    -- Business Registration
    business_registration_number TEXT,
    ntn_number TEXT,
    
    -- Relationship Management
    referred_by TEXT,
    collection_agent TEXT, -- Which order booker handles collections
    special_instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cnic ON customers(cnic);
CREATE INDEX idx_customers_credit_status ON customers(credit_status);
CREATE INDEX idx_customers_area ON customers(area);
CREATE INDEX idx_customers_payment_behavior ON customers(payment_behavior);
```

### [X] Task 1.3: Create Customer Credit Transactions Table ✅ COMPLETED
- **Priority**: Critical | **Time**: 1.5 hours
- **Files to Create**: `src-tauri/src/migrations/migration_023_create_customer_credit_transactions.rs`
- **Description**: Track all credit-related transactions (sales, payments, adjustments)

**Schema Requirements**:
```sql
CREATE TABLE customer_credit_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('SALE', 'PAYMENT', 'ADJUSTMENT', 'REFUND')),
    
    -- Financial Information
    amount REAL NOT NULL CHECK (amount != 0), -- Positive for sales/adjustments, negative for payments
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    
    -- Reference Information
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    reference_number TEXT, -- Invoice number, receipt number, etc.
    
    -- Payment Details (for PAYMENT transactions)
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'hundi', 'other')),
    payment_location TEXT CHECK (payment_location IN ('shop', 'bank', 'home', 'market', 'office')),
    received_by TEXT, -- Which order booker received payment
    
    -- Transaction Context
    transaction_date DATE DEFAULT CURRENT_DATE,
    due_date DATE, -- For SALE transactions
    is_partial_payment BOOLEAN DEFAULT FALSE,
    installment_number INTEGER,
    
    -- Cultural/Business Context
    payment_reason TEXT CHECK (payment_reason IN ('regular', 'pressure', 'festival', 'emergency', 'advance')),
    customer_excuse TEXT, -- Track common delay excuses
    
    -- Notes and Metadata
    notes TEXT,
    created_by TEXT, -- User who created the transaction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_credit_trans_customer ON customer_credit_transactions(customer_id);
CREATE INDEX idx_credit_trans_date ON customer_credit_transactions(transaction_date);
CREATE INDEX idx_credit_trans_type ON customer_credit_transactions(transaction_type);
CREATE INDEX idx_credit_trans_order ON customer_credit_transactions(order_id);
```

### [X] Task 1.4: Create Customer Credit Terms Table ✅ COMPLETED
- **Priority**: High | **Time**: 1 hour
- **Files to Create**: `src-tauri/src/migrations/migration_024_create_customer_credit_terms.rs`
- **Description**: Store flexible credit terms for different customers with Pakistani context

**Schema Requirements**:
```sql
CREATE TABLE customer_credit_terms (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Standard Terms
    credit_limit REAL NOT NULL CHECK (credit_limit >= 0),
    payment_days INTEGER NOT NULL CHECK (payment_days > 0),
    early_payment_discount REAL DEFAULT 0 CHECK (early_payment_discount >= 0 AND early_payment_discount <= 100),
    
    -- Pakistani Cultural Terms
    ramadan_extension BOOLEAN DEFAULT FALSE,
    eid_extension_days INTEGER DEFAULT 0,
    wedding_season_adjustment BOOLEAN DEFAULT FALSE,
    
    -- Business Relationship Terms
    family_friend_terms BOOLEAN DEFAULT FALSE,
    bulk_purchase_discount REAL DEFAULT 0,
    loyalty_discount REAL DEFAULT 0,
    
    -- Risk Management
    guarantor_required BOOLEAN DEFAULT FALSE,
    advance_payment_required BOOLEAN DEFAULT FALSE,
    security_deposit_required REAL DEFAULT 0,
    
    -- Effective Dates
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Approval and Notes
    approved_by TEXT,
    approval_reason TEXT,
    special_conditions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credit_terms_customer ON customer_credit_terms(customer_id);
CREATE INDEX idx_credit_terms_active ON customer_credit_terms(is_active);
CREATE INDEX idx_credit_terms_effective ON customer_credit_terms(effective_from, effective_to);
```

### [X] Task 1.5: Create Collection Alerts Table ✅ COMPLETED
- **Priority**: High | **Time**: 1 hour
- **Files to Create**: `src-tauri/src/migrations/migration_025_create_collection_alerts.rs`
- **Description**: Automated alert system for payment collections with cultural sensitivity

**Schema Requirements**:
```sql
CREATE TABLE collection_alerts (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Alert Classification
    alert_type TEXT NOT NULL CHECK (alert_type IN ('overdue', 'approaching_due', 'credit_limit', 'no_contact', 'behavior_change')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Financial Context
    amount_involved REAL NOT NULL CHECK (amount_involved > 0),
    days_overdue INTEGER DEFAULT 0,
    overdue_amount REAL DEFAULT 0,
    
    -- Communication Tracking
    last_contact_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    excuse_count INTEGER DEFAULT 0,
    last_excuse TEXT,
    
    -- Pakistani Business Context
    relationship_consideration TEXT, -- "handle_gently", "family_friend", "strict_business"
    cultural_notes TEXT, -- "avoid_during_ramadan", "festival_season", etc.
    
    -- Action Management
    assigned_to TEXT, -- Which order booker is responsible
    escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
    suggested_action TEXT CHECK (suggested_action IN ('call', 'whatsapp', 'visit', 'sms', 'email', 'stop_credit', 'legal_notice')),
    best_contact_time TEXT,
    preferred_contact_method TEXT,
    
    -- Resolution
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
    resolution_notes TEXT,
    resolved_date DATE,
    resolved_by TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_action_date DATE,
    alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('hourly', 'daily', 'weekly', 'manual'))
);

-- Indexes
CREATE INDEX idx_alerts_customer ON collection_alerts(customer_id);
CREATE INDEX idx_alerts_status ON collection_alerts(status);
CREATE INDEX idx_alerts_priority ON collection_alerts(priority);
CREATE INDEX idx_alerts_assigned ON collection_alerts(assigned_to);
CREATE INDEX idx_alerts_next_action ON collection_alerts(next_action_date);
```

### [X] Task 1.6: Create Database Triggers for Automatic Calculations ✅ COMPLETED
- **Priority**: Critical | **Time**: 2 hours
- **Files to Create**: `src-tauri/src/migrations/migration_026_create_customer_credit_triggers.rs`
- **Description**: Implement triggers to automatically update customer balances and credit status

**Trigger Requirements**:
```sql
-- Trigger to update customer outstanding balance
CREATE TRIGGER update_customer_balance_on_credit_transaction
AFTER INSERT ON customer_credit_transactions
BEGIN
    UPDATE customers 
    SET 
        current_outstanding = NEW.balance_after,
        last_payment_date = CASE 
            WHEN NEW.transaction_type = 'PAYMENT' THEN NEW.transaction_date 
            ELSE last_payment_date 
        END,
        total_orders_count = CASE 
            WHEN NEW.transaction_type = 'SALE' THEN total_orders_count + 1 
            ELSE total_orders_count 
        END,
        total_lifetime_value = total_lifetime_value + CASE 
            WHEN NEW.transaction_type = 'SALE' THEN NEW.amount 
            ELSE 0 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
END;

-- Trigger to update credit status based on outstanding amount and behavior
CREATE TRIGGER update_customer_credit_status
AFTER UPDATE OF current_outstanding ON customers
BEGIN
    UPDATE customers 
    SET credit_status = CASE
        WHEN NEW.current_outstanding > NEW.credit_limit * 1.1 THEN 'blocked'
        WHEN NEW.current_outstanding > NEW.credit_limit * 0.9 THEN 'warning'
        WHEN NEW.payment_behavior = 'problematic' THEN 'cash_only'
        ELSE 'good'
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger to create collection alerts for overdue payments
CREATE TRIGGER create_collection_alert_on_overdue
AFTER INSERT ON customer_credit_transactions
WHEN NEW.transaction_type = 'SALE' AND NEW.due_date < date('now')
BEGIN
    INSERT INTO collection_alerts (
        id, customer_id, alert_type, priority, amount_involved,
        days_overdue, suggested_action, status
    )
    VALUES (
        hex(randomblob(16)),
        NEW.customer_id,
        'overdue',
        CASE 
            WHEN julianday('now') - julianday(NEW.due_date) > 30 THEN 'urgent'
            WHEN julianday('now') - julianday(NEW.due_date) > 15 THEN 'high'
            ELSE 'medium'
        END,
        NEW.amount,
        julianday('now') - julianday(NEW.due_date),
        'call',
        'open'
    );
END;
```

### [X] Task 1.7: Modify Orders Table for Customer Integration ✅ COMPLETED
- **Priority**: Critical | **Time**: 1 hour
- **Files to Create**: `src-tauri/src/migrations/migration_027_alter_orders_for_customers.rs`
- **Description**: Add customer-related columns to existing orders table

**Schema Changes**:
```sql
-- Add customer reference to orders table
ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN payment_terms TEXT DEFAULT 'credit' CHECK (payment_terms IN ('cash', 'credit', 'advance'));
ALTER TABLE orders ADD COLUMN credit_used REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_due_date DATE;
ALTER TABLE orders ADD COLUMN credit_approved_by TEXT;
ALTER TABLE orders ADD COLUMN credit_approval_reason TEXT;

-- Create index for customer orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_payment_due ON orders(payment_due_date);
CREATE INDEX idx_orders_payment_terms ON orders(payment_terms);

-- Update trigger to create credit transaction when order is created
CREATE TRIGGER create_credit_transaction_on_order
AFTER INSERT ON orders
WHEN NEW.payment_terms = 'credit' AND NEW.customer_id IS NOT NULL
BEGIN
    INSERT INTO customer_credit_transactions (
        id, customer_id, transaction_type, amount, 
        order_id, transaction_date, due_date,
        balance_before, balance_after
    )
    SELECT 
        hex(randomblob(16)),
        NEW.customer_id,
        'SALE',
        NEW.total_amount,
        NEW.id,
        NEW.order_date,
        date(NEW.order_date, '+' || COALESCE(ct.payment_days, c.credit_days, 30) || ' days'),
        c.current_outstanding,
        c.current_outstanding + NEW.total_amount
    FROM customers c
    LEFT JOIN customer_credit_terms ct ON c.id = ct.customer_id AND ct.is_active = 1
    WHERE c.id = NEW.customer_id;
END;
```

---

## Phase 2: Core Type Definitions and Interfaces

### [X] Task 2.1: Create Customer Type Definitions ✅ COMPLETED
- **Priority**: Critical | **Time**: 1 hour
- **Files to Create**: `src/features/customers/types/index.ts`
- **Description**: Comprehensive TypeScript interfaces for customer credit management

**Interface Requirements**:
```typescript
export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  cnic?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  area?: string;
  
  // Credit Information
  creditLimit: number;
  creditDays: number;
  currentOutstanding: number;
  availableCredit: number; // Calculated: creditLimit - currentOutstanding
  
  // Business Classification
  customerType: 'cash' | 'credit' | 'special';
  shopType: 'retail' | 'distributor' | 'sub_distributor';
  paymentBehavior: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  relationshipType: 'business' | 'family' | 'friend' | 'reference';
  
  // Risk Assessment
  creditStatus: 'good' | 'warning' | 'blocked' | 'cash_only';
  lastPaymentDate?: Date;
  averageDelayDays: number;
  totalOrdersCount: number;
  totalLifetimeValue: number;
  
  // Communication
  preferredContactMethod: 'call' | 'whatsapp' | 'visit' | 'sms';
  bestContactTime?: string;
  
  // Business Registration
  businessRegistrationNumber?: string;
  ntnNumber?: string;
  
  // Relationship Management
  referredBy?: string;
  collectionAgent?: string;
  specialInstructions?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreditTransaction {
  id: string;
  customerId: string;
  transactionType: 'SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  referenceNumber?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'hundi' | 'other';
  paymentLocation?: 'shop' | 'bank' | 'home' | 'market' | 'office';
  receivedBy?: string;
  transactionDate: Date;
  dueDate?: Date;
  isPartialPayment: boolean;
  installmentNumber?: number;
  paymentReason?: 'regular' | 'pressure' | 'festival' | 'emergency' | 'advance';
  customerExcuse?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreditTerms {
  id: string;
  customerId: string;
  creditLimit: number;
  paymentDays: number;
  earlyPaymentDiscount: number;
  ramadanExtension: boolean;
  eidExtensionDays: number;
  weddingSeasonAdjustment: boolean;
  familyFriendTerms: boolean;
  bulkPurchaseDiscount: number;
  loyaltyDiscount: number;
  guarantorRequired: boolean;
  advancePaymentRequired: boolean;
  securityDepositRequired: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  approvedBy?: string;
  approvalReason?: string;
  specialConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionAlert {
  id: string;
  customerId: string;
  alertType: 'overdue' | 'approaching_due' | 'credit_limit' | 'no_contact' | 'behavior_change';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  amountInvolved: number;
  daysOverdue: number;
  overdueAmount: number;
  lastContactDate?: Date;
  contactAttempts: number;
  excuseCount: number;
  lastExcuse?: string;
  relationshipConsideration?: string;
  culturalNotes?: string;
  assignedTo?: string;
  escalationLevel: number;
  suggestedAction: 'call' | 'whatsapp' | 'visit' | 'sms' | 'email' | 'stop_credit' | 'legal_notice';
  bestContactTime?: string;
  preferredContactMethod?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
  resolutionNotes?: string;
  resolvedDate?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  nextActionDate?: Date;
  alertFrequency: 'hourly' | 'daily' | 'weekly' | 'manual';
}

// API Request/Response Types
export interface CreateCustomerRequest {
  name: string;
  businessName?: string;
  cnic?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  area?: string;
  creditLimit: number;
  creditDays: number;
  customerType: 'cash' | 'credit' | 'special';
  shopType: 'retail' | 'distributor' | 'sub_distributor';
  relationshipType: 'business' | 'family' | 'friend' | 'reference';
  preferredContactMethod: 'call' | 'whatsapp' | 'visit' | 'sms';
  bestContactTime?: string;
  businessRegistrationNumber?: string;
  ntnNumber?: string;
  referredBy?: string;
  collectionAgent?: string;
  specialInstructions?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  paymentBehavior?: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  creditStatus?: 'good' | 'warning' | 'blocked' | 'cash_only';
}

export interface CustomerFilters {
  search?: string;
  creditStatus?: 'good' | 'warning' | 'blocked' | 'cash_only';
  customerType?: 'cash' | 'credit' | 'special';
  paymentBehavior?: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  city?: string;
  area?: string;
  collectionAgent?: string;
  hasOverduePayments?: boolean;
  creditLimitFrom?: number;
  creditLimitTo?: number;
  outstandingFrom?: number;
  outstandingTo?: number;
}

export interface CreateCreditTransactionRequest {
  customerId: string;
  transactionType: 'SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';
  amount: number;
  orderId?: string;
  referenceNumber?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'hundi' | 'other';
  paymentLocation?: 'shop' | 'bank' | 'home' | 'market' | 'office';
  receivedBy?: string;
  transactionDate?: Date;
  dueDate?: Date;
  isPartialPayment?: boolean;
  installmentNumber?: number;
  paymentReason?: 'regular' | 'pressure' | 'festival' | 'emergency' | 'advance';
  customerExcuse?: string;
  notes?: string;
}

export interface CreditValidationResult {
  canProceed: boolean;
  availableCredit: number;
  recommendedAction?: 'approve' | 'require_approval' | 'require_advance' | 'deny';
  warnings: string[];
  blockers: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CustomerCreditSummary {
  totalCustomers: number;
  totalCreditExtended: number;
  totalOutstanding: number;
  totalOverdue: number;
  averageCollectionDays: number;
  badDebtPercentage: number;
  topRiskyCustomers: Customer[];
  collectionEfficiency: number;
}
```

### [X] Task 2.2: Create Customer Credit Service Interface ✅ COMPLETED
- **Priority**: Critical | **Time**: 45 minutes
- **Files to Create**: `src/features/customers/api/service-interface.ts`
- **Description**: Define service interface with comprehensive CRUD operations

**Service Interface Requirements**:
```typescript
export interface ICustomerService {
  // Customer CRUD
  getAll(filters?: CustomerFilters): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  getByPhone(phone: string): Promise<Customer | null>;
  getByCnic(cnic: string): Promise<Customer | null>;
  create(data: CreateCustomerRequest): Promise<Customer>;
  update(id: string, data: UpdateCustomerRequest): Promise<Customer>;
  delete(id: string): Promise<void>;
  
  // Credit Management
  getCreditStatus(customerId: string): Promise<CreditValidationResult>;
  validateOrderCredit(customerId: string, orderAmount: number): Promise<CreditValidationResult>;
  updateCreditLimit(customerId: string, newLimit: number, approvedBy: string, reason: string): Promise<void>;
  blockCustomer(customerId: string, reason: string, blockedBy: string): Promise<void>;
  unblockCustomer(customerId: string, reason: string, unblockedBy: string): Promise<void>;
  
  // Credit Transactions
  createCreditTransaction(data: CreateCreditTransactionRequest): Promise<CustomerCreditTransaction>;
  getCreditTransactions(customerId: string, limit?: number): Promise<CustomerCreditTransaction[]>;
  getCustomerBalance(customerId: string): Promise<number>;
  
  // Payment Management
  recordPayment(customerId: string, amount: number, paymentData: Partial<CreateCreditTransactionRequest>): Promise<CustomerCreditTransaction>;
  getOverdueCustomers(): Promise<Customer[]>;
  getCustomersApproachingDue(days?: number): Promise<Customer[]>;
  
  // Analytics and Reporting
  getCreditSummary(): Promise<CustomerCreditSummary>;
  getCustomerPaymentHistory(customerId: string): Promise<CustomerCreditTransaction[]>;
  getCollectionAlerts(filters?: { priority?: string; status?: string }): Promise<CollectionAlert[]>;
  
  // Risk Assessment
  calculatePaymentBehaviorScore(customerId: string): Promise<number>;
  updatePaymentBehavior(customerId: string): Promise<void>;
  identifyRiskyCustomers(): Promise<Customer[]>;
}
```

---

## Phase 3: Database Service Implementation

### [X] Task 3.1: Implement Customer Service Core Operations ✅ COMPLETED
- **Priority**: Critical | **Time**: 3 hours
- **Files to Create**: `src/features/customers/api/service.ts`
- **Description**: Implement comprehensive customer management service

**Implementation Requirements**:
- Follow existing database service patterns from other features
- Implement proper error handling with typed exceptions
- Use transactions for multi-table operations
- Add comprehensive data validation
- Implement proper SQL parameter binding
- Add performance optimizations with appropriate indexes
- Include proper data transformation between database and TypeScript types

**Key Methods to Implement**:
```typescript
export const customerService: ICustomerService = {
  async getAll(filters?: CustomerFilters): Promise<Customer[]> {
    // Complex query with joins for credit calculations
    // Include available credit calculations
    // Apply filters for search, status, area, etc.
    // Return transformed data with proper typing
  },

  async validateOrderCredit(customerId: string, orderAmount: number): Promise<CreditValidationResult> {
    // Check current outstanding balance
    // Validate against credit limit
    // Check for overdue payments
    // Apply business rules (relationship type, payment behavior)
    // Return comprehensive validation result
  },

  async recordPayment(customerId: string, amount: number, paymentData: Partial<CreateCreditTransactionRequest>): Promise<CustomerCreditTransaction> {
    // Use database transaction
    // Create credit transaction record
    // Update customer outstanding balance
    // Update payment behavior if needed
    // Create success notification data
  }
};
```

### [X] Task 3.2: Implement Credit Transaction Management ✅ COMPLETED
- **Priority**: Critical | **Time**: 2 hours
- **Files to Modify**: `src/features/customers/api/service.ts`
- **Description**: Add credit transaction tracking and balance management

**Implementation Focus**:
- Atomic transaction handling for balance updates
- Automatic balance calculations with triggers
- Payment history tracking with proper chronological ordering
- Support for partial payments and installments
- Integration with order creation process

### [X] Task 3.3: Implement Collection Alert System ✅ COMPLETED
- **Priority**: High | **Time**: 2 hours
- **Files to Create**: `src/features/customers/api/collection-service.ts`
- **Description**: Automated alert generation and management for overdue collections

**Features to Implement**:
- Automatic alert creation based on due dates
- Priority calculation based on amount and days overdue
- Cultural sensitivity in alert messaging
- Escalation workflow management
- Integration with communication systems

### [X] Task 3.4: Implement Risk Assessment Engine ✅ COMPLETED
- **Priority**: High | **Time**: 2.5 hours
- **Files to Create**: `src/features/customers/api/risk-assessment-service.ts`
- **Description**: Calculate payment behavior scores and risk levels

**Risk Factors to Consider**:
- Payment history and delays
- Credit utilization patterns
- Response to collection attempts
- Seasonal payment behavior
- Geographic risk factors
- Business relationship strength

---

## Phase 4: React Query Integration and Hooks ✅ COMPLETED

### Task 4.1: Create Customer API Queries ✅ COMPLETED
- **Priority**: Critical | **Time**: 1.5 hours
- **Files to Create**: `src/features/customers/api/queries.ts`
- **Description**: React Query integration for data fetching and caching
- **Status**: ✅ Created comprehensive query hooks with proper cache management

### Task 4.2: Create Custom Hooks for Credit Management ✅ COMPLETED
- **Priority**: High | **Time**: 2 hours
- **Files to Create**: `src/features/customers/hooks/index.ts`
- **Description**: Business logic hooks for customer and credit management
- **Status**: ✅ Created hooks for customer operations, credit validation, collection dashboard, and form management

### Task 4.3: Create Feature Index File ✅ COMPLETED
- **Priority**: Medium | **Time**: 15 minutes
- **Files to Modify**: `src/features/customers/index.ts`
- **Description**: Barrel exports for clean API
- **Status**: ✅ Updated with complete export structure

---

## Phase 5: UI Components (✅ MOSTLY COMPLETED)

### [X] Task 5.1: Create Customer List Components ✅ COMPLETED
- **Priority**: Critical | **Time**: 3 hours
- **Files to Create**: 
  - ✅ `src/features/customers/components/customer-list.tsx`
  - ✅ `src/features/customers/components/customer-list-filters.tsx`
  - ✅ `src/features/customers/components/customer-card.tsx`
  - ✅ `src/features/customers/components/index.ts`
  - ✅ `src/features/customers/utils/formatters.ts`
- **Description**: List view for customers with filtering and search
- **Status**: ✅ COMPLETED
- **Notes**: 
  - Implemented comprehensive customer list with Ant Design Table
  - Added advanced filtering modal with Pakistani business context
  - Created reusable customer card component with risk indicators
  - Added utility functions for currency and data formatting
  - Integrated with existing React Query hooks
  - All compilation issues resolved

### [X] Task 5.2: Create Customer Credit Status Widget ✅ COMPLETED
- **Priority**: Critical | **Time**: 1.5 hours
- **Files Created**: ✅ `src/features/customers/components/customer-credit-widget.tsx`
- **Description**: Real-time credit status display for order forms
- **Status**: ✅ COMPLETED
- **Features Implemented**:
  - Traffic light color coding (Green/Yellow/Red) for credit status
  - Available credit display with utilization progress bar
  - Overdue payment warnings with days overdue
  - Payment behavior indicators with cultural context
  - Quick action buttons (Call, WhatsApp, View Details)
  - Responsive design with proper TypeScript types
  - Integration with CustomerWithCredit interface

### [X] Task 5.3: Create Customer Form Component ✅ COMPLETED
- **Priority**: High | **Time**: 2.5 hours
- **Files Created**: ✅ `src/features/customers/components/customer-form.tsx`
- **Description**: Comprehensive customer creation and editing form
- **Status**: ✅ COMPLETED
- **Features Implemented**:
  - Pakistani business context fields (CNIC validation, NTN, business registration)
  - Tabbed interface: Basic Info, Business Details, Credit Terms, Communication
  - Credit limit and terms configuration with cultural considerations
  - Relationship type selection and business type categorization
  - Communication preferences (WhatsApp, phone, preferred contact method)
  - Address with city/area selection
  - Comprehensive form validation with Pakistani context
  - Integration with React Query mutations
  - Cultural payment terms (Ramadan extension, Eid considerations, etc.)

### [X] Task 5.4: Create Customer Select Component ✅ COMPLETED
- **Priority**: High | **Time**: 1.5 hours
- **Files Created**: ✅ `src/features/customers/components/customer-select.tsx`
- **Description**: Enhanced customer selection component for order forms
- **Status**: ✅ COMPLETED
- **Features Implemented**:
  - Real-time customer search with credit status display
  - Credit validation warnings and blockers
  - Inline customer creation option
  - Credit limit and outstanding balance display
  - Payment behavior indicators
  - Integration with order form workflows
  - Proper TypeScript interfaces and error handling

### [X] Task 5.5: Create Payment Recording Component ✅ COMPLETED
- **Priority**: High | **Time**: 2 hours
- **Files Created**: ✅ `src/features/customers/components/payment-form.tsx`
- **Description**: Quick payment recording interface
- **Status**: ✅ COMPLETED
- **Features Implemented**:
  - Customer search and selection with AutoComplete
  - Multiple payment methods (Cash, Bank Transfer, Cheque, Mobile Money)
  - Partial payment support with remaining balance calculation
  - Payment summary with current outstanding display
  - Integration with WhatsApp for payment confirmations
  - Cultural context options and payment reference tracking
  - Form validation and error handling
  - Integration with React Query mutations

### [ ] Task 5.6: Create Collection Dashboard Component ⏳ PENDING
- **Priority**: Critical | **Time**: 1.5 hours
- **Files to Create**: `src/features/customers/api/queries.ts`
- **Description**: React Query hooks for customer data fetching

**Hooks to Implement**:
```typescript
export const useCustomers = (filters?: CustomerFilters) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customerService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
};

export const useCustomerCreditStatus = (customerId: string) => {
  return useQuery({
    queryKey: ['customers', customerId, 'credit-status'],
    queryFn: () => customerService.getCreditStatus(customerId),
    enabled: !!customerId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useValidateOrderCredit = (customerId: string, orderAmount: number) => {
  return useQuery({
    queryKey: ['customers', customerId, 'validate-credit', orderAmount],
    queryFn: () => customerService.validateOrderCredit(customerId, orderAmount),
    enabled: !!customerId && orderAmount > 0,
  });
};

export const useCustomerCreditTransactions = (customerId: string) => {
  return useQuery({
    queryKey: ['customers', customerId, 'credit-transactions'],
    queryFn: () => customerService.getCreditTransactions(customerId),
    enabled: !!customerId,
  });
};

export const useOverdueCustomers = () => {
  return useQuery({
    queryKey: ['customers', 'overdue'],
    queryFn: () => customerService.getOverdueCustomers(),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useCollectionAlerts = (filters?: { priority?: string; status?: string }) => {
  return useQuery({
    queryKey: ['collection-alerts', filters],
    queryFn: () => customerService.getCollectionAlerts(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
```

### Task 4.2: Create Customer API Mutations
- **Priority**: Critical | **Time**: 1.5 hours
- **Files to Create**: `src/features/customers/api/mutations.ts`
- **Description**: React Query mutations for customer operations

**Mutations to Implement**:
```typescript
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('Customer created successfully');
    },
    onError: (error) => {
      message.error(`Failed to create customer: ${error.message}`);
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) => 
      customerService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('Customer updated successfully');
    },
    onError: (error) => {
      message.error(`Failed to update customer: ${error.message}`);
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, amount, paymentData }: {
      customerId: string;
      amount: number;
      paymentData: Partial<CreateCreditTransactionRequest>;
    }) => customerService.recordPayment(customerId, amount, paymentData),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'credit-status'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('Payment recorded successfully');
    },
    onError: (error) => {
      message.error(`Failed to record payment: ${error.message}`);
    },
  });
};

export const useUpdateCreditLimit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, newLimit, approvedBy, reason }: {
      customerId: string;
      newLimit: number;
      approvedBy: string;
      reason: string;
    }) => customerService.updateCreditLimit(customerId, newLimit, approvedBy, reason),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('Credit limit updated successfully');
    },
  });
};
```

### Task 4.3: Create Credit Validation Hooks
- **Priority**: High | **Time**: 1 hour
- **Files to Create**: `src/features/customers/hooks/use-credit-validation.ts`
- **Description**: Custom hooks for real-time credit validation

**Hook Implementation**:
```typescript
export const useCreditValidation = (customerId?: string, orderAmount?: number) => {
  const [validationResult, setValidationResult] = useState<CreditValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCredit = useCallback(async () => {
    if (!customerId || !orderAmount || orderAmount <= 0) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await customerService.validateOrderCredit(customerId, orderAmount);
      setValidationResult(result);
    } catch (error) {
      console.error('Credit validation error:', error);
      setValidationResult({
        canProceed: false,
        availableCredit: 0,
        warnings: [],
        blockers: ['Validation error occurred'],
        riskLevel: 'critical',
      });
    } finally {
      setIsValidating(false);
    }
  }, [customerId, orderAmount]);

  useEffect(() => {
    validateCredit();
  }, [validateCredit]);

  return {
    validationResult,
    isValidating,
    revalidate: validateCredit,
  };
};
```

---

## Phase 5: UI Components Development

### Task 5.1: Create Customer Selection Component
- **Priority**: Critical | **Time**: 2 hours
- **Files to Create**: `src/features/customers/components/customer-select.tsx`
- **Description**: Enhanced customer selection with real-time credit status

**Component Features**:
- Search by name, phone, or business name
- Display credit status badges (Green/Yellow/Red)
- Show available credit amount
- Display overdue warnings
- Support for creating new customers inline
- Integration with order form validation

**Component Structure**:
```tsx
interface CustomerSelectProps {
  value?: string;
  onChange: (customerId: string, customer: Customer) => void;
  orderAmount?: number;
  disabled?: boolean;
  showCreditStatus?: boolean;
  allowCreateNew?: boolean;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  orderAmount = 0,
  disabled = false,
  showCreditStatus = true,
  allowCreateNew = true,
}) => {
  // Implementation with Ant Design Select
  // Real-time credit validation
  // Status badges and warnings
  // Inline customer creation
};
```

### Task 5.6: Create Collection Dashboard Component ⏳ PENDING
- **Priority**: High | **Time**: 2.5 hours
- **Files to Create**: `src/features/customers/components/collection-dashboard.tsx`
- **Description**: Overview of collection activities and alerts

**Dashboard Features**:
- Overdue payments summary with aging analysis
- Collection alerts with priority indicators
- Today's follow-up activities
- Payment behavior trends
- Area-wise collection efficiency
- Quick action buttons for common collection tasks
- **Priority**: High | **Time**: 2.5 hours
- **Files to Create**: `src/features/customers/components/collection-dashboard.tsx`
- **Description**: Overview of collection activities and alerts

**Dashboard Features**:
- Overdue payments summary with aging analysis
- Collection alerts with priority indicators
- Today's follow-up activities
- Payment behavior trends
- Area-wise collection efficiency
- Quick action buttons for common collection tasks

---

## Phase 6: Order Integration

### Task 6.1: Enhance Order Form with Credit Integration
- **Priority**: Critical | **Time**: 2 hours
- **Files to Modify**: `src/features/orders/components/order-form.tsx`
- **Description**: Integrate customer credit validation into order creation

**Integration Requirements**:
- Replace orderBookerId selection with customer selection
- Add real-time credit validation as order total changes
- Display credit warnings and blockers
- Implement credit approval workflow for exceptions
- Add payment terms selection (Cash/Credit/Advance)
- Integrate with customer creation flow

**Key Changes**:
```tsx
// Add credit validation state
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [creditValidation, setCreditValidation] = useState<CreditValidationResult | null>(null);
const [orderTotal, setOrderTotal] = useState(0);

// Add credit validation hook
const { validationResult, isValidating } = useCreditValidation(
  selectedCustomer?.id,
  orderTotal
);

// Modify form submission to include credit checks
const handleSubmit = async (values: any) => {
  if (!validationResult?.canProceed) {
    message.error('Cannot create order: ' + validationResult?.blockers.join(', '));
    return;
  }
  
  // Proceed with order creation including customer and credit information
};
```

### Task 6.2: Modify Order Service for Customer Integration
- **Priority**: Critical | **Time**: 1.5 hours
- **Files to Modify**: `src/features/orders/api/service.ts`
- **Description**: Update order creation to include customer credit transactions

**Service Modifications**:
- Add customer validation before order creation
- Create credit transactions automatically for credit orders
- Update customer outstanding balances
- Handle payment terms and due date calculations
- Integrate with credit limit validation

### Task 6.3: Update Order Types for Customer Integration
- **Priority**: High | **Time**: 30 minutes
- **Files to Modify**: `src/features/orders/types/index.ts`
- **Description**: Add customer-related fields to order interfaces

**Type Updates**:
```typescript
export interface Order {
  // ... existing fields
  customerId?: string;
  paymentTerms: 'cash' | 'credit' | 'advance';
  creditUsed: number;
  paymentDueDate?: Date;
  creditApprovedBy?: string;
  creditApprovalReason?: string;
}

export interface CreateOrderRequest {
  // ... existing fields
  customerId: string;
  paymentTerms: 'cash' | 'credit' | 'advance';
  creditApprovalReason?: string;
}
```

### Task 6.4: Create Order Credit Validation Component
- **Priority**: High | **Time**: 1 hour
- **Files to Create**: `src/features/orders/components/order-credit-validation.tsx`
- **Description**: Real-time credit validation display within order form

**Validation Component Features**:
- Live credit status as order total changes
- Warning and error messages
- Suggested actions for credit issues
- Approval request functionality for managers
- Alternative payment method suggestions

---

## Phase 7: Dashboard and Reporting Integration

### Task 7.1: Create Customer Credit Dashboard Widget
- **Priority**: High | **Time**: 2 hours
- **Files to Create**: `src/features/customers/components/credit-dashboard-widget.tsx`
- **Description**: Dashboard widget showing credit management overview

**Widget Features**:
- Total credit extended vs outstanding
- Number of overdue customers
- Collection efficiency metrics
- Top risky customers alert
- Payment behavior trends
- Quick navigation to collection tasks

### Task 7.2: Integrate Credit Alerts into Main Dashboard
- **Priority**: High | **Time**: 1 hour
- **Files to Modify**: `src/features/simple-dashboard/pages/simple-dashboard-page.tsx`
- **Description**: Add collection alerts to main dashboard

**Integration Features**:
- High-priority collection alerts banner
- Overdue payments summary card
- Today's collection activities widget
- Cash flow impact indicators

### Task 7.3: Create Customer Credit Reports
- **Priority**: Medium | **Time**: 2.5 hours
- **Files to Create**: `src/features/customers/pages/credit-reports.tsx`
- **Description**: Comprehensive credit management reporting

**Report Types**:
- Customer credit aging report (30/60/90 days)
- Payment behavior analysis
- Collection efficiency by area/agent
- Credit utilization trends
- Bad debt risk assessment
- Cash flow forecasting

### Task 7.4: Create Customer Analytics Dashboard
- **Priority**: Medium | **Time**: 2 hours
- **Files to Create**: `src/features/customers/pages/customer-analytics.tsx`
- **Description**: Advanced analytics for customer credit management

**Analytics Features**:
- Customer lifetime value analysis
- Payment pattern recognition
- Seasonal payment trend analysis
- Geographic risk assessment
- Credit limit optimization suggestions
- ROI analysis for credit extension

---

## Phase 8: Navigation and Route Integration

### Task 8.1: Add Customers Menu to Sidebar
- **Priority**: High | **Time**: 30 minutes
- **Files to Modify**: `src/components/layouts/Sidebar.tsx`
- **Description**: Add customer management navigation options

**Navigation Structure**:
```tsx
// Add to Master Data submenu
{
  key: 'customers',
  icon: <UserOutlined />,
  label: 'Customers',
},
{
  key: 'customer-credit',
  icon: <CreditCardOutlined />,
  label: 'Credit Management',
},
{
  key: 'collections',
  icon: <MoneyCollectOutlined />,
  label: 'Collections',
},
```

### Task 8.2: Create Customer Management Routes
- **Priority**: High | **Time**: 45 minutes
- **Files to Create**: `src/features/customers/routes/index.ts`
- **Description**: Define routing structure for customer management

**Route Definitions**:
```typescript
export const customerRoutes = [
  {
    path: '/customers',
    element: <CustomersListPage />,
  },
  {
    path: '/customers/create',
    element: <CustomerFormPage />,
  },
  {
    path: '/customers/:customerId/edit',
    element: <CustomerFormPage />,
  },
  {
    path: '/customers/:customerId/credit-history',
    element: <CustomerCreditHistoryPage />,
  },
  {
    path: '/credit-management',
    element: <CreditManagementPage />,
  },
  {
    path: '/collections',
    element: <CollectionDashboardPage />,
  },
  {
    path: '/reports/customer-credit',
    element: <CustomerCreditReportsPage />,
  },
];
```

### Task 8.3: Create Customer Management Pages
- **Priority**: High | **Time**: 3 hours
- **Files to Create**: 
  - `src/features/customers/pages/customers-list.tsx`
  - `src/features/customers/pages/customer-form-page.tsx`
  - `src/features/customers/pages/credit-management.tsx`
  - `src/features/customers/pages/collection-dashboard.tsx`

**Page Requirements**:
- Follow existing page layout patterns
- Implement proper loading and error states
- Add export functionality where appropriate
- Include proper breadcrumb navigation
- Implement search and filtering capabilities

### Task 8.4: Update App Router Configuration
- **Priority**: High | **Time**: 30 minutes
- **Files to Modify**: `src/app/router/index.ts`
- **Description**: Integrate customer routes into main router

**Router Integration**:
- Add customer management routes
- Ensure proper route protection if needed
- Add breadcrumb configuration
- Test navigation flow between features

---

## Phase 9: Feature Index and Documentation

### Task 9.1: Create Customer Feature Index
- **Priority**: Medium | **Time**: 30 minutes
- **Files to Create**: `src/features/customers/index.ts`
- **Description**: Export all customer management functionality

**Index Structure**:
```typescript
// API exports
export * from './api/queries';
export * from './api/mutations';
export * from './api/service';

// Component exports
export * from './components/customer-select';
export * from './components/customer-form';
export * from './components/customer-table';
export * from './components/customer-credit-status';
export * from './components/payment-form';
export * from './components/collection-dashboard';

// Page exports
export * from './pages/customers-list';
export * from './pages/customer-form-page';
export * from './pages/credit-management';
export * from './pages/collection-dashboard';

// Type exports
export * from './types';

// Hook exports
export * from './hooks/use-credit-validation';

// Feature metadata for AI agents
export const customerFeatureMetadata = {
  name: 'customers',
  description: 'Customer credit management system for Pakistani wholesale business',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types', 'orders', 'order-bookers'],
  apis: [
    'useCustomers', 'useCustomer', 'useCreateCustomer', 'useUpdateCustomer',
    'useCustomerCreditStatus', 'useValidateOrderCredit', 'useRecordPayment',
    'useCustomerCreditTransactions', 'useOverdueCustomers', 'useCollectionAlerts'
  ],
  components: [
    'CustomerSelect', 'CustomerForm', 'CustomerTable', 'CustomerCreditStatus',
    'PaymentForm', 'CollectionDashboard', 'CreditDashboardWidget'
  ],
  pages: [
    'CustomersListPage', 'CustomerFormPage', 'CreditManagementPage', 
    'CollectionDashboardPage', 'CustomerCreditReportsPage'
  ],
  routes: [
    '/customers', '/customers/create', '/customers/:id/edit',
    '/credit-management', '/collections', '/reports/customer-credit'
  ],
  queryKeys: ['customers', 'credit-transactions', 'collection-alerts'],
  culturalFeatures: [
    'Pakistani CNIC validation', 'Urdu name support', 'Islamic calendar integration',
    'Cultural payment patterns', 'Relationship-based credit terms'
  ],
} as const;
```
## 🎯 **Implementation Priority Matrix**

### **Phase 1 (Week 1): Foundation**
- Database schema creation (Tasks 1.1-1.7)
- Core type definitions (Tasks 2.1-2.2)
- Essential for all subsequent development

### **Phase 2 (Week 2): Core Services**
- Database service implementation (Tasks 3.1-3.4)
- React Query integration (Tasks 4.1-4.3)
- Establishes data layer foundation

### **Phase 3 (Week 3): UI Components**
- Customer selection and form components (Tasks 5.1-5.3)
- Order integration (Tasks 6.1-6.4)
- Critical for order workflow integration

### **Phase 4 (Week 4): Dashboard Integration**
- Remaining UI components (Tasks 5.4-5.6)
- Dashboard widgets (Tasks 7.1-7.2)
- Navigation and routing (Tasks 8.1-8.4)

### **Phase 5 (Weeks 5-6): Advanced Features**
- Reporting and analytics (Tasks 7.3-7.4)
- Documentation and polish (Tasks 9.1-9.2)
- Performance optimization and testing

---

## 🚨 **Critical Success Factors**

### **Technical Requirements**
- Maintain backward compatibility with existing order system
- Ensure data consistency across all credit transactions
- Implement proper error handling and validation
- Follow existing code patterns and conventions
- Maintain database performance with proper indexing

### **Business Requirements**
- Prevent credit limit violations during order creation
- Provide real-time credit status visibility
- Support Pakistani business cultural practices
- Enable efficient collection management workflows
- Maintain customer relationship sensitivity

### **Performance Requirements**
- Credit validation responses under 500ms
- Dashboard widgets load under 2 seconds
- Support for 1000+ customers without performance degradation
- Efficient database queries with proper optimization
- Minimal impact on existing order creation performance

---

## 📊 **Expected Business Impact**

### **Immediate Benefits (Month 1)**
- Prevent orders from customers who exceed credit limits
- Real-time visibility into customer outstanding balances
- Automated payment due date tracking
- Reduced manual credit checking effort

### **Short-term Benefits (Months 2-3)**
- 30% reduction in bad debt through better credit management
- 50% faster payment collection through automated reminders
- Improved cash flow predictability
- Better customer relationship management

### **Long-term Benefits (Months 4-12)**
- 25% improvement in overall collection efficiency
- Reduced financial risk through better customer assessment
- Scalable credit management processes
- Data-driven credit limit optimization

This comprehensive task breakdown provides a complete roadmap for implementing customer credit management in the Order Booker Target Tracker, specifically designed for Pakistani wholesale business practices while maintaining technical excellence and system integration.

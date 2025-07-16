# Customer Credit Integration with Order Management

## 🔄 **How Credit Management Integrates with Orders**

The credit management system will work seamlessly with your existing order flow to prevent cash flow problems before they happen.

---

## 📋 **Current Order Flow (As Is)**
1. Order Booker selects customer (currently just orderBookerId)
2. Adds products and quantities 
3. System calculates totals
4. Order gets created with status: "pending"
5. Later order gets "shipped" then "completed"
6. **NO CREDIT CHECKING** ❌

---

## 🚀 **Enhanced Order Flow (With Credit Management)**

### **Step 1: Customer Selection with Credit Check**
```typescript
// Enhanced Customer Selection Component
interface CustomerWithCredit {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  currentOutstanding: number;
  creditLimit: number;
  creditDays: number;
  availableCredit: number; // creditLimit - currentOutstanding
  creditStatus: 'good' | 'warning' | 'blocked' | 'cash_only';
  paymentBehavior: 'excellent' | 'good' | 'delayed' | 'problematic';
  lastPaymentDate?: Date;
  overdueAmount: number;
  daysOverdue: number;
}
```

### **Step 2: Real-time Credit Validation**
When order booker selects a customer, system immediately shows:

```jsx
// Credit Status Widget in Order Form
<CustomerCreditWidget customer={selectedCustomer} orderAmount={orderTotal}>
  {/* Green: Good to go */}
  <div className="credit-good">
    ✅ Credit Available: Rs. 50,000
    💰 Current Outstanding: Rs. 25,000
    📅 Last Payment: 5 days ago
  </div>

  {/* Yellow: Warning */}
  <div className="credit-warning">
    ⚠️ Credit Limited: Rs. 5,000 remaining
    📊 Outstanding: Rs. 45,000 / Rs. 50,000
    ⏰ Payment overdue by 10 days
  </div>

  {/* Red: Blocked */}
  <div className="credit-blocked">
    🚫 CREDIT BLOCKED
    💸 Overdue Amount: Rs. 15,000 (25 days)
    📞 Last Contact: 3 days ago
    💰 This order: Rs. 30,000 - CASH ONLY
  </div>
</CustomerCreditWidget>
```

### **Step 3: Smart Order Controls**
```typescript
// Order Validation Logic
const validateOrderCreation = (customer: Customer, orderAmount: number) => {
  const availableCredit = customer.creditLimit - customer.currentOutstanding;
  
  // Check 1: Credit limit
  if (orderAmount > availableCredit) {
    return {
      canProceed: false,
      reason: 'CREDIT_LIMIT_EXCEEDED',
      message: `Order amount Rs. ${orderAmount} exceeds available credit Rs. ${availableCredit}`,
      suggestion: 'Request advance payment or reduce order amount'
    };
  }
  
  // Check 2: Overdue payments
  if (customer.overdueAmount > 0 && customer.daysOverdue > customer.creditDays) {
    return {
      canProceed: false,
      reason: 'OVERDUE_PAYMENTS',
      message: `Customer has overdue payment of Rs. ${customer.overdueAmount} (${customer.daysOverdue} days)`,
      suggestion: 'Collect overdue amount before new order'
    };
  }
  
  // Check 3: Payment behavior
  if (customer.paymentBehavior === 'problematic') {
    return {
      canProceed: 'with_approval',
      reason: 'POOR_PAYMENT_HISTORY',
      message: 'Customer has poor payment history',
      suggestion: 'Consider cash payment or manager approval'
    };
  }
  
  return { canProceed: true };
};
```

---

## 💰 **Order Creation Enhanced Workflow**

### **Scenario 1: Good Customer (Green Light)**
```
1. Select Customer: "Ahmed Traders"
2. System Shows: ✅ Credit Available Rs. 75,000
3. Add Products: Total Rs. 25,000
4. System: ✅ Order approved automatically
5. Create Order: Status "pending", Credit Reserved
6. Update Customer: Available credit now Rs. 50,000
```

### **Scenario 2: Warning Customer (Yellow Light)**
```
1. Select Customer: "Karachi Wholesale"
2. System Shows: ⚠️ Rs. 5,000 credit left, Rs. 10,000 overdue
3. Add Products: Total Rs. 15,000
4. System: ❌ Cannot proceed - insufficient credit
5. Options:
   - Reduce order to Rs. 5,000
   - Collect Rs. 10,000 overdue first
   - Accept advance payment Rs. 15,000
```

### **Scenario 3: Blocked Customer (Red Light)**
```
1. Select Customer: "Problem Customer Ltd"
2. System Shows: 🚫 BLOCKED - Rs. 25,000 overdue (45 days)
3. Add Products: Any amount
4. System: ❌ CASH ONLY - No credit allowed
5. Options:
   - Cash payment upfront
   - Collect all overdue amounts first
   - Manager override (with reason)
```

---

## 🔄 **Database Integration**

### **Enhanced Order Table**
```sql
-- Add credit-related columns to orders table
ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN payment_terms TEXT DEFAULT 'credit'; -- 'credit', 'cash', 'advance'
ALTER TABLE orders ADD COLUMN credit_used REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_due_date DATE;
ALTER TABLE orders ADD COLUMN credit_approved_by TEXT; -- for special approvals
```

### **Customer Credit Tracking**
```sql
-- New customers table
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  cnic TEXT,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  city TEXT,
  area TEXT,
  
  -- Credit Information
  credit_limit REAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  current_outstanding REAL DEFAULT 0,
  
  -- Business Information
  customer_type TEXT DEFAULT 'credit', -- 'cash', 'credit', 'special'
  payment_behavior TEXT DEFAULT 'new', -- 'excellent', 'good', 'delayed', 'problematic'
  relationship_type TEXT DEFAULT 'business', -- 'business', 'family', 'friend'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer credit transactions
CREATE TABLE customer_credit_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  transaction_type TEXT NOT NULL, -- 'SALE', 'PAYMENT', 'ADJUSTMENT'
  order_id TEXT REFERENCES orders(id),
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT, -- 'cash', 'bank', 'cheque'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📱 **User Interface Changes**

### **Order Form Enhancement**
```jsx
// Enhanced Order Form with Credit Integration
const OrderFormWithCredit = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditStatus, setCreditStatus] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);

  const handleCustomerChange = async (customerId) => {
    const customer = await getCustomerWithCredit(customerId);
    setSelectedCustomer(customer);
    
    const status = await validateCustomerCredit(customer, orderTotal);
    setCreditStatus(status);
  };

  return (
    <Form>
      {/* Customer Selection with Credit Info */}
      <Form.Item label="Customer" required>
        <Select onChange={handleCustomerChange}>
          {customers.map(customer => (
            <Option key={customer.id} value={customer.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{customer.name}</span>
                <CreditBadge status={customer.creditStatus} />
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Credit Status Display */}
      {selectedCustomer && (
        <CustomerCreditCard 
          customer={selectedCustomer}
          orderAmount={orderTotal}
          creditStatus={creditStatus}
        />
      )}

      {/* Product Selection */}
      <OrderItemsTable 
        onTotalChange={setOrderTotal}
        creditLimit={selectedCustomer?.availableCredit}
      />

      {/* Submit Button with Credit Validation */}
      <Button 
        type="primary"
        disabled={creditStatus?.canProceed === false}
        onClick={handleSubmit}
      >
        {creditStatus?.canProceed === false 
          ? `Cannot Create Order: ${creditStatus.reason}`
          : 'Create Order'
        }
      </Button>
    </Form>
  );
};
```

---

## 🔄 **Automatic Credit Updates**

### **When Order is Created:**
```typescript
const createOrderWithCredit = async (orderData) => {
  // 1. Validate credit
  const validation = await validateOrderCredit(orderData);
  if (!validation.canProceed) {
    throw new Error(validation.message);
  }

  // 2. Create order
  const order = await createOrder(orderData);

  // 3. Update customer credit
  await updateCustomerCredit({
    customerId: orderData.customerId,
    type: 'SALE',
    amount: orderData.totalAmount,
    orderId: order.id,
    dueDate: calculateDueDate(order.orderDate, customer.creditDays)
  });

  // 4. Reserve credit
  await reserveCredit(orderData.customerId, orderData.totalAmount);

  return order;
};
```

### **When Payment is Received:**
```typescript
const recordPayment = async (paymentData) => {
  // 1. Record payment
  const payment = await createPaymentRecord(paymentData);

  // 2. Update customer outstanding
  await updateCustomerCredit({
    customerId: paymentData.customerId,
    type: 'PAYMENT',
    amount: paymentData.amount,
    paymentMethod: paymentData.method
  });

  // 3. Update order status if fully paid
  if (paymentData.isFullPayment) {
    await updateOrderStatus(paymentData.orderId, 'paid');
  }

  // 4. Send confirmation
  await sendPaymentConfirmation(paymentData);

  return payment;
};
```

---

## 🚨 **Real-time Alerts for Order Bookers**

### **During Order Creation:**
- "⚠️ Customer credit almost full (90% used)"
- "🚫 Cannot create order - customer has overdue payments"
- "💰 Consider cash payment - customer has poor payment history"
- "✅ Order approved - customer has excellent payment record"

### **Mobile Notifications:**
- "📱 Payment received from Ahmed Traders - Rs. 25,000"
- "⏰ Reminder: 5 customers have payments due today"
- "🚨 Urgent: 3 customers are overdue by 30+ days"

---

## 📊 **Business Intelligence**

### **Credit Management Dashboard:**
- **Daily Cash Flow**: Expected vs Actual payments
- **Credit Utilization**: How much credit is being used
- **Overdue Analysis**: Which customers are delaying
- **Order Booker Performance**: Who manages credit better
- **Risk Assessment**: Early warning for potential bad debts

### **Reports for Management:**
- **Credit Aging Report**: 30/60/90 days outstanding
- **Customer Credit Summary**: Who owes what
- **Payment Behavior Analysis**: Which customers pay on time
- **Cash Flow Forecast**: Expected payments for next 30/60/90 days

This integration ensures your brother never faces cash flow surprises and can make informed decisions about extending credit to customers while maintaining business relationships.

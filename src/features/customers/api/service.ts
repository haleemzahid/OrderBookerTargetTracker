// Customer Credit Management Service Implementation
// Following existing service patterns and TypeScript best practices

import { getDatabase } from '../../../services/database';
import {
  Customer,
  CustomerWithCredit,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CustomerCreditTransaction,
  CreateCreditTransactionRequest,
  CustomerCreditTerms,
  CreditValidationResult,
  CustomerCreditSummary,
  CreditDashboardStats
} from '../types';
import {
  ICustomerService,
  CustomerServiceError
} from './service-interface';
import { v4 as uuidv4 } from 'uuid';

// Helper function to parse database row to Customer object
const parseCustomer = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  businessName: row.business_name,
  cnic: row.cnic,
  phone: row.phone,
  alternatePhone: row.alternate_phone,
  whatsappNumber: row.whatsapp_number,
  address: row.address,
  city: row.city,
  area: row.area,
  creditLimit: Number(row.credit_limit) || 0,
  creditDays: Number(row.credit_days) || 30,
  currentOutstanding: Number(row.current_outstanding) || 0,
  customerType: row.customer_type || 'credit',
  shopType: row.shop_type || 'retail',
  paymentBehavior: row.payment_behavior || 'new',
  relationshipType: row.relationship_type || 'business',
  creditStatus: row.credit_status || 'good',
  lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : undefined,
  averageDelayDays: Number(row.average_delay_days) || 0,
  totalOrdersCount: Number(row.total_orders_count) || 0,
  totalLifetimeValue: Number(row.total_lifetime_value) || 0,
  preferredContactMethod: row.preferred_contact_method || 'call',
  bestContactTime: row.best_contact_time,
  businessRegistrationNumber: row.business_registration_number,
  ntnNumber: row.ntn_number,
  referredBy: row.referred_by,
  collectionAgent: row.collection_agent,
  specialInstructions: row.special_instructions,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to parse CustomerWithCredit
const parseCustomerWithCredit = (row: any): CustomerWithCredit => {
  const customer = parseCustomer(row);
  const availableCredit = customer.creditLimit - customer.currentOutstanding;
  const creditUtilization = customer.creditLimit > 0 ? (customer.currentOutstanding / customer.creditLimit) * 100 : 0;
  
  return {
    ...customer,
    availableCredit,
    creditUtilization,
    daysSinceLastPayment: customer.lastPaymentDate 
      ? Math.floor((Date.now() - customer.lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
    isOverdue: customer.currentOutstanding > 0 && customer.lastPaymentDate 
      ? (Date.now() - customer.lastPaymentDate.getTime()) > (customer.creditDays * 24 * 60 * 60 * 1000)
      : false,
    overdueAmount: customer.currentOutstanding > 0 ? customer.currentOutstanding : 0,
    nextPaymentDue: row.next_payment_due ? new Date(row.next_payment_due) : undefined,
    riskScore: Number(row.risk_score) || 0,
    activeAlerts: Number(row.active_alerts) || 0,
    lastOrderDate: row.last_order_date ? new Date(row.last_order_date) : undefined,
    averageOrderValue: Number(row.average_order_value) || 0,
    collectionDifficulty: row.collection_difficulty || 'easy'
  };
};

// Helper function to parse credit transaction
const parseCreditTransaction = (row: any): CustomerCreditTransaction => ({
  id: row.id,
  customerId: row.customer_id,
  transactionType: row.transaction_type,
  amount: Number(row.amount),
  balanceBefore: Number(row.balance_before),
  balanceAfter: Number(row.balance_after),
  orderId: row.order_id,
  paymentMethod: row.payment_method,
  paymentReference: row.payment_reference,
  receivedBy: row.received_by,
  paymentLocation: row.payment_location,
  transactionDate: new Date(row.transaction_date),
  dueDate: row.due_date ? new Date(row.due_date) : undefined,
  isPartialPayment: Boolean(row.is_partial_payment),
  installmentNumber: row.installment_number,
  totalInstallments: row.total_installments,
  customerExcuse: row.customer_excuse,
  collectionDifficulty: row.collection_difficulty,
  relationshipImpact: row.relationship_impact,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Customer Service Implementation
export const customerService: ICustomerService = {
  async getAll(filters?: CustomerFilters): Promise<Customer[]> {
    const db = getDatabase();
    let query = `
      SELECT 
        id, name, business_name, cnic, phone, alternate_phone, whatsapp_number,
        address, city, area, credit_limit, credit_days, current_outstanding,
        customer_type, shop_type, payment_behavior, relationship_type,
        credit_status, last_payment_date, average_delay_days, total_orders_count,
        total_lifetime_value, preferred_contact_method, best_contact_time,
        business_registration_number, ntn_number, referred_by, collection_agent,
        special_instructions, created_at, updated_at
      FROM customers
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.search) {
      query += ` AND (name LIKE ? OR business_name LIKE ? OR phone LIKE ? OR cnic LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.creditStatus) {
      query += ` AND credit_status = ?`;
      params.push(filters.creditStatus);
    }

    if (filters?.paymentBehavior) {
      query += ` AND payment_behavior = ?`;
      params.push(filters.paymentBehavior);
    }

    if (filters?.customerType) {
      query += ` AND customer_type = ?`;
      params.push(filters.customerType);
    }

    if (filters?.area) {
      query += ` AND area = ?`;
      params.push(filters.area);
    }

    if (filters?.city) {
      query += ` AND city = ?`;
      params.push(filters.city);
    }

    if (filters?.collectionAgent) {
      query += ` AND collection_agent = ?`;
      params.push(filters.collectionAgent);
    }

    if (filters?.outstandingFrom !== undefined) {
      query += ` AND current_outstanding >= ?`;
      params.push(filters.outstandingFrom);
    }

    if (filters?.outstandingTo !== undefined) {
      query += ` AND current_outstanding <= ?`;
      params.push(filters.outstandingTo);
    }

    if (filters?.creditLimitFrom !== undefined) {
      query += ` AND credit_limit >= ?`;
      params.push(filters.creditLimitFrom);
    }

    if (filters?.creditLimitTo !== undefined) {
      query += ` AND credit_limit <= ?`;
      params.push(filters.creditLimitTo);
    }

    if (filters?.lastPaymentBefore) {
      query += ` AND last_payment_date <= ?`;
      params.push(filters.lastPaymentBefore.toISOString().split('T')[0]);
    }

    if (filters?.lastPaymentAfter) {
      query += ` AND last_payment_date >= ?`;
      params.push(filters.lastPaymentAfter.toISOString().split('T')[0]);
    }

    query += ` ORDER BY name ASC`;

    try {
      const result = await db.select<any[]>(query, params);
      return result.map(parseCustomer);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch customers',
        'FETCH_CUSTOMERS_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', filters }
      );
    }
  },

  async getAllWithCredit(filters?: CustomerFilters): Promise<CustomerWithCredit[]> {
    const db = getDatabase();
    let query = `
      SELECT 
        c.*,
        (c.credit_limit - c.current_outstanding) as available_credit,
        CASE 
          WHEN c.credit_limit > 0 THEN (c.current_outstanding / c.credit_limit) * 100 
          ELSE 0 
        END as credit_utilization,
        (
          SELECT MIN(due_date) 
          FROM customer_credit_transactions 
          WHERE customer_id = c.id AND transaction_type = 'SALE' AND balance_after > 0
        ) as next_payment_due,
        (
          SELECT COUNT(*) 
          FROM collection_alerts 
          WHERE customer_id = c.id AND status IN ('open', 'in_progress')
        ) as active_alerts,
        (
          SELECT MAX(order_date) 
          FROM orders 
          WHERE customer_id = c.id
        ) as last_order_date,
        (
          SELECT AVG(total_amount) 
          FROM orders 
          WHERE customer_id = c.id
        ) as average_order_value,
        CASE 
          WHEN c.payment_behavior = 'problematic' THEN 'very_difficult'
          WHEN c.payment_behavior = 'delayed' THEN 'difficult'
          WHEN c.payment_behavior = 'good' THEN 'moderate'
          ELSE 'easy'
        END as collection_difficulty,
        CASE 
          WHEN c.payment_behavior = 'excellent' THEN 90
          WHEN c.payment_behavior = 'good' THEN 70
          WHEN c.payment_behavior = 'delayed' THEN 40
          WHEN c.payment_behavior = 'problematic' THEN 10
          ELSE 50
        END as risk_score
      FROM customers c
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply same filters as getAll
    if (filters?.search) {
      query += ` AND (c.name LIKE ? OR c.business_name LIKE ? OR c.phone LIKE ? OR c.cnic LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add other filter conditions here (same as getAll)...

    query += ` ORDER BY c.name ASC`;

    try {
      const result = await db.select<any[]>(query, params);
      return result.map(parseCustomerWithCredit);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch customers with credit information',
        'FETCH_CUSTOMERS_WITH_CREDIT_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', filters }
      );
    }
  },

  async getById(id: string): Promise<Customer | null> {
    const db = getDatabase();
    try {
      const result = await db.select<any[]>(
        `SELECT 
          id, name, business_name, cnic, phone, alternate_phone, whatsapp_number,
          address, city, area, credit_limit, credit_days, current_outstanding,
          customer_type, shop_type, payment_behavior, relationship_type,
          credit_status, last_payment_date, average_delay_days, total_orders_count,
          total_lifetime_value, preferred_contact_method, best_contact_time,
          business_registration_number, ntn_number, referred_by, collection_agent,
          special_instructions, created_at, updated_at
         FROM customers 
         WHERE id = ?`,
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      return parseCustomer(result[0]);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch customer by ID',
        'FETCH_CUSTOMER_BY_ID_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerId: id }
      );
    }
  },

  async getByIdWithCredit(id: string): Promise<CustomerWithCredit | null> {
    const db = getDatabase();
    try {
      const result = await db.select<any[]>(
        `SELECT 
          c.*,
          (c.credit_limit - c.current_outstanding) as available_credit,
          CASE 
            WHEN c.credit_limit > 0 THEN (c.current_outstanding / c.credit_limit) * 100 
            ELSE 0 
          END as credit_utilization,
          (
            SELECT MIN(due_date) 
            FROM customer_credit_transactions 
            WHERE customer_id = c.id AND transaction_type = 'SALE' AND balance_after > 0
          ) as next_payment_due,
          (
            SELECT COUNT(*) 
            FROM collection_alerts 
            WHERE customer_id = c.id AND status IN ('open', 'in_progress')
          ) as active_alerts,
          (
            SELECT MAX(order_date) 
            FROM orders 
            WHERE customer_id = c.id
          ) as last_order_date,
          (
            SELECT AVG(total_amount) 
            FROM orders 
            WHERE customer_id = c.id
          ) as average_order_value,
          CASE 
            WHEN c.payment_behavior = 'problematic' THEN 'very_difficult'
            WHEN c.payment_behavior = 'delayed' THEN 'difficult'
            WHEN c.payment_behavior = 'good' THEN 'moderate'
            ELSE 'easy'
          END as collection_difficulty,
          CASE 
            WHEN c.payment_behavior = 'excellent' THEN 90
            WHEN c.payment_behavior = 'good' THEN 70
            WHEN c.payment_behavior = 'delayed' THEN 40
            WHEN c.payment_behavior = 'problematic' THEN 10
            ELSE 50
          END as risk_score
         FROM customers c 
         WHERE c.id = ?`,
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      return parseCustomerWithCredit(result[0]);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch customer with credit by ID',
        'FETCH_CUSTOMER_WITH_CREDIT_BY_ID_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerId: id }
      );
    }
  },

  async create(data: CreateCustomerRequest): Promise<Customer> {
    const db = getDatabase();
    const customerId = uuidv4();
    const now = new Date().toISOString();

    try {
      await db.execute(
        `INSERT INTO customers (
          id, name, business_name, cnic, phone, alternate_phone, whatsapp_number,
          address, city, area, credit_limit, credit_days, current_outstanding,
          customer_type, shop_type, relationship_type, preferred_contact_method,
          best_contact_time, business_registration_number, ntn_number,
          referred_by, collection_agent, special_instructions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          data.name,
          data.businessName || null,
          data.cnic || null,
          data.phone,
          data.alternatePhone || null,
          data.whatsappNumber || null,
          data.address || null,
          data.city || null,
          data.area || null,
          data.creditLimit || 0,
          data.creditDays || 30,
          0, // current_outstanding starts at 0
          data.customerType || 'credit',
          data.shopType || 'retail',
          data.relationshipType || 'business',
          data.preferredContactMethod || 'call',
          data.bestContactTime || null,
          data.businessRegistrationNumber || null,
          data.ntnNumber || null,
          data.referredBy || null,
          data.collectionAgent || null,
          data.specialInstructions || null,
          now,
          now
        ]
      );

      const customer = await this.getById(customerId);
      if (!customer) {
        throw new CustomerServiceError('Failed to retrieve created customer', 'CREATE_CUSTOMER_FAILED');
      }

      return customer;
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to create customer',
        'CREATE_CUSTOMER_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerData: data }
      );
    }
  },

  async update(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case for database columns
        const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbColumn} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new CustomerServiceError('No fields to update', 'NO_UPDATE_FIELDS');
    }

    updateFields.push('updated_at = ?');
    params.push(now, id);

    try {
      await db.execute(
        `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      const customer = await this.getById(id);
      if (!customer) {
        throw new CustomerServiceError('Customer not found after update', 'CUSTOMER_NOT_FOUND');
      }

      return customer;
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to update customer',
        'UPDATE_CUSTOMER_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerId: id, updateData: data }
      );
    }
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    
    try {
      // Check if customer has any outstanding transactions
      const outstandingCheck = await db.select<any[]>(
        'SELECT current_outstanding FROM customers WHERE id = ?',
        [id]
      );

      if (outstandingCheck.length === 0) {
        throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND');
      }

      if (outstandingCheck[0].current_outstanding > 0) {
        throw new CustomerServiceError(
          'Cannot delete customer with outstanding balance',
          'CUSTOMER_HAS_OUTSTANDING_BALANCE',
          { outstandingAmount: outstandingCheck[0].current_outstanding }
        );
      }

      await db.execute('DELETE FROM customers WHERE id = ?', [id]);
    } catch (error) {
      if (error instanceof CustomerServiceError) {
        throw error;
      }
      throw new CustomerServiceError(
        'Failed to delete customer',
        'DELETE_CUSTOMER_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerId: id }
      );
    }
  },

  // Additional methods will continue in part 2...
  async getCreditTransactions(customerId: string, limit?: number): Promise<CustomerCreditTransaction[]> {
    const db = getDatabase();
    let query = `
      SELECT 
        id, customer_id, transaction_type, amount, balance_before, balance_after,
        order_id, payment_method, payment_reference, received_by, payment_location,
        transaction_date, due_date, is_partial_payment, installment_number,
        total_installments, customer_excuse, collection_difficulty,
        relationship_impact, notes, created_by, created_at, updated_at
      FROM customer_credit_transactions
      WHERE customer_id = ?
      ORDER BY transaction_date DESC, created_at DESC
    `;

    const params: any[] = [customerId];

    if (limit && limit > 0) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    try {
      const result = await db.select<any[]>(query, params);
      return result.map(parseCreditTransaction);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch credit transactions',
        'FETCH_CREDIT_TRANSACTIONS_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', customerId }
      );
    }
  },

  async createCreditTransaction(data: CreateCreditTransactionRequest): Promise<CustomerCreditTransaction> {
    const db = getDatabase();
    const transactionId = uuidv4();
    const now = new Date().toISOString();

    // Get current customer balance
    const customer = await this.getById(data.customerId);
    if (!customer) {
      throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const balanceBefore = customer.currentOutstanding;
    const balanceAfter = data.transactionType === 'PAYMENT' 
      ? balanceBefore - Math.abs(data.amount)
      : balanceBefore + Math.abs(data.amount);

    try {
      await db.execute(
        `INSERT INTO customer_credit_transactions (
          id, customer_id, transaction_type, amount, balance_before, balance_after,
          order_id, payment_method, payment_reference, payment_location,
          transaction_date, due_date, is_partial_payment, installment_number,
          total_installments, customer_excuse, collection_difficulty, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          data.customerId,
          data.transactionType,
          data.transactionType === 'PAYMENT' ? -Math.abs(data.amount) : Math.abs(data.amount),
          balanceBefore,
          balanceAfter,
          data.orderId || null,
          data.paymentMethod || null,
          data.paymentReference || null,
          data.paymentLocation || null,
          new Date().toISOString().split('T')[0],
          data.dueDate?.toISOString().split('T')[0] || null,
          data.isPartialPayment || false,
          data.installmentNumber || null,
          data.totalInstallments || null,
          data.customerExcuse || null,
          data.collectionDifficulty || 'easy',
          data.notes || null,
          'system' // TODO: Get from current user context
        ]
      );

      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new CustomerServiceError('Failed to retrieve created transaction', 'CREATE_TRANSACTION_FAILED');
      }

      return transaction;
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to create credit transaction',
        'CREATE_CREDIT_TRANSACTION_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', transactionData: data }
      );
    }
  },

  async getTransactionById(id: string): Promise<CustomerCreditTransaction | null> {
    const db = getDatabase();
    try {
      const result = await db.select<any[]>(
        `SELECT 
          id, customer_id, transaction_type, amount, balance_before, balance_after,
          order_id, payment_method, payment_reference, received_by, payment_location,
          transaction_date, due_date, is_partial_payment, installment_number,
          total_installments, customer_excuse, collection_difficulty,
          relationship_impact, notes, created_by, created_at, updated_at
         FROM customer_credit_transactions 
         WHERE id = ?`,
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      return parseCreditTransaction(result[0]);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to fetch transaction by ID',
        'FETCH_TRANSACTION_BY_ID_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error', transactionId: id }
      );
    }
  },

  // Placeholder implementations for remaining methods
  async getCustomerCreditTerms(customerId: string): Promise<CustomerCreditTerms | null> {
    // TODO: Implement
    console.log('Get credit terms for customer:', customerId);
    return null;
  },

  async updateCreditTerms(customerId: string, terms: Partial<CustomerCreditTerms>): Promise<CustomerCreditTerms> {
    // TODO: Implement
    console.log('Update credit terms for customer:', customerId, terms);
    throw new Error('Method not implemented');
  },

  async validateCreditForOrder(customerId: string, orderAmount: number): Promise<CreditValidationResult> {
    // TODO: Implement comprehensive validation
    const customer = await this.getByIdWithCredit(customerId);
    if (!customer) {
      throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const result: CreditValidationResult = {
      canProceed: false,
      warnings: [],
      errors: [],
      riskLevel: 'low',
      availableCredit: customer.availableCredit,
      alternatives: []
    };

    // Basic credit limit check
    if (orderAmount > customer.availableCredit) {
      result.errors.push(`Order amount Rs. ${orderAmount} exceeds available credit Rs. ${customer.availableCredit}`);
      result.alternatives = ['Reduce order amount', 'Request advance payment', 'Increase credit limit'];
    }

    // Credit status check
    if (customer.creditStatus === 'blocked') {
      result.errors.push('Customer credit is blocked');
      result.alternatives = ['Cash payment only', 'Resolve outstanding issues'];
    }

    // Set risk level and final decision
    if (result.errors.length === 0) {
      result.canProceed = true;
      result.riskLevel = customer.paymentBehavior === 'excellent' ? 'low' : 
                        customer.paymentBehavior === 'good' ? 'medium' : 'high';
    }

    return result;
  },

  async calculateAvailableCredit(customerId: string): Promise<number> {
    const customer = await this.getById(customerId);
    if (!customer) {
      throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    return Math.max(0, customer.creditLimit - customer.currentOutstanding);
  },

  async updatePaymentBehavior(customerId: string): Promise<void> {
    // This will be triggered automatically by database triggers
    // Placeholder for manual behavior updates if needed
    console.log('Update payment behavior for customer:', customerId);
  },

  async recordPayment(
    customerId: string,
    amount: number,
    paymentMethod: string,
    orderId?: string,
    notes?: string
  ): Promise<CustomerCreditTransaction> {
    return this.createCreditTransaction({
      customerId,
      transactionType: 'PAYMENT',
      amount: Math.abs(amount), // Ensure positive amount for payment
      orderId,
      paymentMethod: paymentMethod as any,
      notes
    });
  },

  async getOverdueCustomers(daysOverdue: number = 0): Promise<CustomerWithCredit[]> {
    const customers = await this.getAllWithCredit();
    return customers.filter(customer => 
      customer.isOverdue && 
      customer.daysSinceLastPayment !== undefined &&
      customer.daysSinceLastPayment >= daysOverdue
    );
  },

  async getCustomersApproachingDue(daysAhead: number = 7): Promise<CustomerWithCredit[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    const customers = await this.getAllWithCredit();
    return customers.filter(customer => 
      customer.nextPaymentDue && 
      customer.nextPaymentDue <= cutoffDate &&
      customer.currentOutstanding > 0
    );
  },

  async identifyRiskyCustomers(): Promise<Customer[]> {
    return this.getAll({
      paymentBehavior: 'problematic'
    });
  },

  async generatePaymentReminder(request: any): Promise<string> {
    // TODO: Implement culturally appropriate message generation
    return `Payment reminder for Rs. ${request.amount}`;
  },

  async getCreditSummary(): Promise<CustomerCreditSummary> {
    const db = getDatabase();
    try {
      const result = await db.select<any[]>(`
        SELECT 
          COUNT(*) as total_customers,
          SUM(current_outstanding) as total_outstanding,
          SUM(credit_limit) as total_credit_limit,
          SUM(CASE WHEN current_outstanding > 0 AND 
                      (julianday('now') - julianday(last_payment_date)) > credit_days 
                   THEN current_outstanding ELSE 0 END) as total_overdue,
          AVG(average_delay_days) as avg_delay_days,
          SUM(CASE WHEN credit_status = 'good' THEN 1 ELSE 0 END) as good_count,
          SUM(CASE WHEN credit_status = 'warning' THEN 1 ELSE 0 END) as warning_count,
          SUM(CASE WHEN credit_status = 'blocked' THEN 1 ELSE 0 END) as blocked_count,
          SUM(CASE WHEN credit_status = 'cash_only' THEN 1 ELSE 0 END) as cash_only_count
        FROM customers
      `);

      const row = result[0];
      return {
        totalCustomers: Number(row.total_customers) || 0,
        totalOutstanding: Number(row.total_outstanding) || 0,
        totalCreditLimit: Number(row.total_credit_limit) || 0,
        totalOverdue: Number(row.total_overdue) || 0,
        averageDelayDays: Number(row.avg_delay_days) || 0,
        collectionEfficiency: row.total_outstanding > 0 ? 
          ((row.total_outstanding - row.total_overdue) / row.total_outstanding) * 100 : 100,
        riskDistribution: {
          good: Number(row.good_count) || 0,
          warning: Number(row.warning_count) || 0,
          blocked: Number(row.blocked_count) || 0,
          cashOnly: Number(row.cash_only_count) || 0
        }
      };
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to get credit summary',
        'GET_CREDIT_SUMMARY_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  },

  async getDashboardStats(): Promise<CreditDashboardStats> {
    // TODO: Implement comprehensive dashboard statistics
    const summary = await this.getCreditSummary();
    return {
      todayCollections: 0, // TODO: Calculate from today's payments
      pendingCollections: summary.totalOutstanding,
      overdueCustomers: summary.riskDistribution.blocked + summary.riskDistribution.warning,
      totalOutstanding: summary.totalOutstanding,
      collectionTargetForMonth: 0, // TODO: Implement target system
      collectionAchievedForMonth: 0, // TODO: Calculate from month's collections
      alertsRequiringAction: 0, // TODO: Count from collection_alerts
      highRiskCustomers: summary.riskDistribution.blocked
    };
  },

  async getPaymentTrends(customerId: string): Promise<any> {
    // TODO: Implement payment trend analysis
    console.log('Get payment trends for customer:', customerId);
    throw new Error('Method not implemented');
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    return this.getAll({ search: query });
  },

  async getCustomersByArea(area: string): Promise<Customer[]> {
    return this.getAll({ area });
  },

  async getCustomersByAgent(agentId: string): Promise<Customer[]> {
    return this.getAll({ collectionAgent: agentId });
  },

  async exportCustomerData(filters?: CustomerFilters): Promise<string> {
    // TODO: Implement CSV export
    console.log('Export customer data with filters:', filters);
    throw new Error('Method not implemented');
  },

  async bulkUpdateCreditLimits(updates: Array<{ customerId: string; newLimit: number; reason: string }>): Promise<void> {
    // TODO: Implement bulk updates with transaction support
    console.log('Bulk update credit limits:', updates.length, 'customers');
    throw new Error('Method not implemented');
  }
};

// Export the service instance
export default customerService;

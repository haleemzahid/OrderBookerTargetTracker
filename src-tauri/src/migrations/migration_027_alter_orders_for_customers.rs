use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 27,
        description: "alter_orders_for_customers",
        sql: "
            -- Add customer reference and credit-related columns to orders table
            ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id);
            ALTER TABLE orders ADD COLUMN payment_terms TEXT DEFAULT 'credit' CHECK (payment_terms IN ('cash', 'credit', 'advance'));
            ALTER TABLE orders ADD COLUMN credit_used REAL DEFAULT 0;
            ALTER TABLE orders ADD COLUMN payment_due_date DATE;
            ALTER TABLE orders ADD COLUMN credit_approved_by TEXT;
            ALTER TABLE orders ADD COLUMN credit_approval_reason TEXT;

            -- Create indexes for customer orders optimization
            CREATE INDEX idx_orders_customer ON orders(customer_id);
            CREATE INDEX idx_orders_payment_due ON orders(payment_due_date);
            CREATE INDEX idx_orders_payment_terms ON orders(payment_terms);

            -- Trigger to create credit transaction when order is created with credit terms
            CREATE TRIGGER create_credit_transaction_on_order
            AFTER INSERT ON orders
            WHEN NEW.payment_terms = 'credit' AND NEW.customer_id IS NOT NULL
            BEGIN
                INSERT INTO customer_credit_transactions (
                    id, customer_id, transaction_type, amount, 
                    order_id, transaction_date, due_date,
                    balance_before, balance_after, created_by
                )
                SELECT 
                    hex(randomblob(16)),
                    NEW.customer_id,
                    'SALE',
                    NEW.total_amount,
                    NEW.id,
                    NEW.order_date,
                    -- Calculate due date based on customer credit terms or default (30 days)
                    date(NEW.order_date, '+30 days'),
                    c.current_outstanding,
                    c.current_outstanding + NEW.total_amount,
                    NEW.order_booker_id
                FROM customers c
                WHERE c.id = NEW.customer_id;
                
                -- Update payment due date in orders table
                UPDATE orders 
                SET 
                    payment_due_date = date(NEW.order_date, '+30 days'),
                    credit_used = NEW.total_amount
                WHERE id = NEW.id;
            END;

            -- Trigger to update order status when payment is received
            CREATE TRIGGER update_order_on_payment
            AFTER INSERT ON customer_credit_transactions
            WHEN NEW.transaction_type = 'PAYMENT' AND NEW.order_id IS NOT NULL
            BEGIN
                -- Check if order is fully paid and update status
                UPDATE orders
                SET status = CASE 
                    WHEN (
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' THEN -amount ELSE amount END)
                        FROM customer_credit_transactions 
                        WHERE order_id = NEW.order_id
                    ) <= 0 THEN 'paid'
                    ELSE status
                END
                WHERE id = NEW.order_id;
            END;

            -- Trigger to validate credit limit before order creation
            CREATE TRIGGER validate_credit_before_order
            BEFORE INSERT ON orders
            WHEN NEW.payment_terms = 'credit' AND NEW.customer_id IS NOT NULL
            BEGIN
                SELECT 
                    CASE 
                        WHEN (c.current_outstanding + NEW.total_amount) > c.credit_limit
                        THEN RAISE(ABORT, 'Credit limit exceeded. Please check available credit.')
                        
                        WHEN c.credit_status = 'blocked'
                        THEN RAISE(ABORT, 'Customer credit is blocked. Cash payment required.')
                        
                        WHEN c.credit_status = 'cash_only'
                        THEN RAISE(ABORT, 'Customer is on cash-only terms due to payment history.')
                        
                        WHEN c.current_outstanding > 0 AND 
                             (julianday('now') - julianday(c.last_payment_date)) > (c.credit_days + 15)
                        THEN RAISE(ABORT, 'Customer has overdue payments. Collect outstanding amount first.')
                    END
                FROM customers c 
                WHERE c.id = NEW.customer_id;
            END;
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

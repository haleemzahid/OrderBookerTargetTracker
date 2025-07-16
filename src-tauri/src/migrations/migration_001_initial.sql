CREATE TABLE monthly_targets (
            id TEXT PRIMARY KEY,
            order_booker_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            target_amount REAL NOT NULL DEFAULT 0,
            achieved_amount REAL NOT NULL DEFAULT 0,
            remaining_amount REAL NOT NULL DEFAULT 0,
            achievement_percentage REAL NOT NULL DEFAULT 0,
            days_in_month INTEGER NOT NULL,
            working_days_in_month INTEGER NOT NULL,
            daily_target_amount REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE,
            UNIQUE(order_booker_id, year, month)
        );
CREATE INDEX idx_monthly_targets_order_booker ON monthly_targets(order_booker_id);
CREATE INDEX idx_monthly_targets_year_month ON monthly_targets(year, month);
CREATE TABLE IF NOT EXISTS "order_bookers" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                name_urdu TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                join_date TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
CREATE INDEX idx_order_bookers_active ON order_bookers(is_active);
CREATE TABLE companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            email TEXT,
            phone TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
CREATE INDEX idx_companies_name ON companies(name);
CREATE TABLE products (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            cost_price REAL NOT NULL,
            sell_price REAL NOT NULL,
            unit_per_carton INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL, current_stock INTEGER NOT NULL DEFAULT 0, low_stock_threshold INTEGER NOT NULL DEFAULT 20,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        );
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_name ON products(name);
CREATE TABLE daily_entries_backup(
  id TEXT,
  order_booker_id TEXT,
  date TEXT,
  sales REAL,
  returns REAL,
  net_sales REAL,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  total_carton INT,
  return_carton INT
);
CREATE TABLE IF NOT EXISTS "daily_entries" (
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
CREATE INDEX idx_daily_entries_order_booker ON daily_entries(order_booker_id);
CREATE INDEX idx_daily_entries_date ON daily_entries(date);
CREATE INDEX idx_daily_entry_items_entry ON daily_entry_items(daily_entry_id);
CREATE INDEX idx_daily_entry_items_product ON daily_entry_items(product_id);
CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            order_booker_id TEXT NOT NULL,
            order_date TEXT NOT NULL,
            supply_date TEXT,
            total_amount REAL NOT NULL DEFAULT 0,
            total_cost REAL NOT NULL DEFAULT 0,
            total_profit REAL NOT NULL DEFAULT 0,
            total_cartons REAL NOT NULL DEFAULT 0,
            return_cartons REAL NOT NULL DEFAULT 0,
            return_amount REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL, customer_id TEXT REFERENCES customers(id), payment_terms TEXT DEFAULT 'credit' CHECK (payment_terms IN ('cash', 'credit', 'advance')), credit_used REAL DEFAULT 0, payment_due_date DATE, credit_approved_by TEXT, credit_approval_reason TEXT,
            FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE
        );
CREATE INDEX idx_orders_order_booker ON orders(order_booker_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_supply_date ON orders(supply_date);
CREATE TABLE IF NOT EXISTS "order_items" (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            cost_price REAL NOT NULL,
            sell_price REAL NOT NULL,
            total_cost REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            profit REAL DEFAULT 0,
            cartons REAL DEFAULT 0,
            return_quantity INTEGER DEFAULT 0,
            return_amount REAL DEFAULT 0,
            return_cartons REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE TABLE stock_transactions (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            reason TEXT NOT NULL CHECK (reason IN ('PURCHASE', 'SALE', 'EXPIRED', 'DAMAGED', 'LOST', 'OTHER')),
            reference_id TEXT, -- order_id for sales, null for adjustments
            purchase_cost REAL CHECK (purchase_cost >= 0), -- only for IN transactions
            expiry_date TEXT, -- only for IN transactions
            comments TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
CREATE INDEX idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX idx_stock_transactions_reason ON stock_transactions(reason);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_products_low_stock ON products(low_stock_threshold);
CREATE TRIGGER update_product_stock_after_transaction_insert
        AFTER INSERT ON stock_transactions
        BEGIN
            UPDATE products 
            SET current_stock = CASE 
                WHEN NEW.transaction_type = 'IN' THEN current_stock + NEW.quantity
                WHEN NEW.transaction_type = 'OUT' THEN current_stock - NEW.quantity
                WHEN NEW.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN NEW.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock - NEW.quantity
                        ELSE current_stock + NEW.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = NEW.product_id;
        END;
CREATE TRIGGER update_product_stock_after_transaction_update
        AFTER UPDATE ON stock_transactions
        BEGIN
            -- First, reverse the old transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN OLD.transaction_type = 'IN' THEN current_stock - OLD.quantity
                WHEN OLD.transaction_type = 'OUT' THEN current_stock + OLD.quantity
                WHEN OLD.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN OLD.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock + OLD.quantity
                        ELSE current_stock - OLD.quantity
                    END
                ELSE current_stock
            END
            WHERE id = OLD.product_id;
            
            -- Then apply the new transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN NEW.transaction_type = 'IN' THEN current_stock + NEW.quantity
                WHEN NEW.transaction_type = 'OUT' THEN current_stock - NEW.quantity
                WHEN NEW.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN NEW.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock - NEW.quantity
                        ELSE current_stock + NEW.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = NEW.product_id;
        END;
CREATE TRIGGER update_product_stock_after_transaction_delete
        AFTER DELETE ON stock_transactions
        BEGIN
            -- Reverse the deleted transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN OLD.transaction_type = 'IN' THEN current_stock - OLD.quantity
                WHEN OLD.transaction_type = 'OUT' THEN current_stock + OLD.quantity
                WHEN OLD.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN OLD.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock + OLD.quantity
                        ELSE current_stock - OLD.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = OLD.product_id;
        END;
CREATE TABLE customer_credit_transactions (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                
                -- Transaction Classification
                transaction_type TEXT NOT NULL CHECK (transaction_type IN ('SALE', 'PAYMENT', 'ADJUSTMENT', 'REFUND')),
                amount REAL NOT NULL,
                
                -- Balance Tracking
                balance_before REAL NOT NULL DEFAULT 0,
                balance_after REAL NOT NULL DEFAULT 0,
                
                -- Order Reference
                order_id TEXT REFERENCES orders(id),
                
                -- Dates and Terms
                transaction_date DATE DEFAULT CURRENT_DATE,
                due_date DATE,
                
                -- Payment Details (for PAYMENT transactions)
                payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile_banking', 'advance')),
                payment_reference TEXT, -- Bank reference, cheque number, etc.
                received_by TEXT, -- Which order booker received the payment
                payment_location TEXT, -- 'shop', 'bank', 'office', etc.
                
                -- Partial Payment Support
                is_partial_payment BOOLEAN DEFAULT FALSE,
                installment_number INTEGER,
                total_installments INTEGER,
                
                -- Pakistani Business Context
                customer_excuse TEXT, -- Track common delay excuses for analysis
                collection_difficulty TEXT CHECK (collection_difficulty IN ('easy', 'moderate', 'difficult', 'very_difficult')),
                relationship_impact TEXT, -- How collection attempt affected relationship
                
                -- Notes and Metadata
                notes TEXT,
                created_by TEXT, -- User who created the transaction
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
CREATE INDEX idx_credit_trans_customer ON customer_credit_transactions(customer_id);
CREATE INDEX idx_credit_trans_date ON customer_credit_transactions(transaction_date);
CREATE INDEX idx_credit_trans_type ON customer_credit_transactions(transaction_type);
CREATE INDEX idx_credit_trans_order ON customer_credit_transactions(order_id);
CREATE INDEX idx_credit_trans_due_date ON customer_credit_transactions(due_date);
CREATE INDEX idx_credit_trans_payment_method ON customer_credit_transactions(payment_method);
CREATE INDEX idx_credit_trans_received_by ON customer_credit_transactions(received_by);
CREATE TABLE customer_credit_terms (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                
                -- Standard Credit Terms
                credit_limit REAL NOT NULL CHECK (credit_limit >= 0),
                payment_days INTEGER NOT NULL CHECK (payment_days > 0),
                early_payment_discount REAL DEFAULT 0 CHECK (early_payment_discount >= 0 AND early_payment_discount <= 100),
                late_payment_penalty REAL DEFAULT 0 CHECK (late_payment_penalty >= 0),
                
                -- Pakistani Cultural and Business Terms
                ramadan_extension BOOLEAN DEFAULT FALSE,
                eid_extension_days INTEGER DEFAULT 0 CHECK (eid_extension_days >= 0),
                wedding_season_adjustment BOOLEAN DEFAULT FALSE,
                harvest_season_consideration BOOLEAN DEFAULT FALSE, -- For agricultural customers
                
                -- Business Relationship Terms
                family_friend_terms BOOLEAN DEFAULT FALSE,
                bulk_purchase_discount REAL DEFAULT 0 CHECK (bulk_purchase_discount >= 0 AND bulk_purchase_discount <= 100),
                loyalty_discount REAL DEFAULT 0 CHECK (loyalty_discount >= 0 AND loyalty_discount <= 100),
                seasonal_adjustment_percentage REAL DEFAULT 0 CHECK (seasonal_adjustment_percentage >= -50 AND seasonal_adjustment_percentage <= 50),
                
                -- Risk Management Requirements
                guarantor_required BOOLEAN DEFAULT FALSE,
                guarantor_name TEXT,
                guarantor_phone TEXT,
                advance_payment_required BOOLEAN DEFAULT FALSE,
                security_deposit_required REAL DEFAULT 0 CHECK (security_deposit_required >= 0),
                security_deposit_received REAL DEFAULT 0,
                
                -- Special Conditions
                maximum_order_value REAL DEFAULT 0, -- 0 means no limit
                minimum_order_value REAL DEFAULT 0,
                restricted_products TEXT, -- JSON array of restricted product IDs
                
                -- Effective Dates
                effective_from DATE NOT NULL,
                effective_to DATE,
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Approval and Authorization
                approved_by TEXT NOT NULL,
                approval_reason TEXT,
                special_conditions TEXT,
                review_date DATE, -- When to review these terms
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
CREATE UNIQUE INDEX idx_credit_terms_customer_active 
            ON customer_credit_terms(customer_id) 
            WHERE is_active = TRUE;
CREATE INDEX idx_credit_terms_customer ON customer_credit_terms(customer_id);
CREATE INDEX idx_credit_terms_active ON customer_credit_terms(is_active);
CREATE INDEX idx_credit_terms_effective ON customer_credit_terms(effective_from, effective_to);
CREATE INDEX idx_credit_terms_approved_by ON customer_credit_terms(approved_by);
CREATE INDEX idx_credit_terms_review_date ON customer_credit_terms(review_date);
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
                contact_response TEXT CHECK (contact_response IN ('positive', 'neutral', 'negative', 'hostile', 'no_response')),
                
                -- Pakistani Business and Cultural Context
                relationship_consideration TEXT CHECK (relationship_consideration IN ('handle_gently', 'family_friend', 'strict_business', 'respect_required', 'elder_customer')),
                cultural_notes TEXT, -- 'avoid_during_ramadan', 'festival_season', 'wedding_in_family', etc.
                language_preference TEXT DEFAULT 'urdu' CHECK (language_preference IN ('urdu', 'english', 'punjabi', 'sindhi', 'pashto')),
                
                -- Action Management
                assigned_to TEXT, -- Which order booker is responsible
                escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
                suggested_action TEXT CHECK (suggested_action IN ('call', 'whatsapp', 'visit', 'sms', 'email', 'stop_credit', 'legal_notice')),
                best_contact_time TEXT,
                preferred_contact_method TEXT,
                
                -- Visit Planning
                last_visit_date DATE,
                next_planned_visit DATE,
                visit_result TEXT,
                distance_from_office REAL, -- For route planning
                
                -- Resolution and Follow-up
                status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
                resolution_notes TEXT,
                resolved_date DATE,
                resolved_by TEXT,
                resolution_amount REAL,
                
                -- Automation and Scheduling
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                next_action_date DATE,
                alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
                auto_escalate_after_days INTEGER DEFAULT 7,
                
                -- Business Intelligence
                collection_difficulty_score INTEGER DEFAULT 1 CHECK (collection_difficulty_score BETWEEN 1 AND 10),
                customer_cooperation_level TEXT DEFAULT 'unknown' CHECK (customer_cooperation_level IN ('excellent', 'good', 'fair', 'poor', 'hostile', 'unknown'))
            );
CREATE INDEX idx_alerts_customer ON collection_alerts(customer_id);
CREATE INDEX idx_alerts_status ON collection_alerts(status);
CREATE INDEX idx_alerts_priority ON collection_alerts(priority);
CREATE INDEX idx_alerts_assigned ON collection_alerts(assigned_to);
CREATE INDEX idx_alerts_next_action ON collection_alerts(next_action_date);
CREATE INDEX idx_alerts_type ON collection_alerts(alert_type);
CREATE INDEX idx_alerts_escalation ON collection_alerts(escalation_level);
CREATE INDEX idx_alerts_amount ON collection_alerts(amount_involved);
CREATE INDEX idx_alerts_overdue_days ON collection_alerts(days_overdue);
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
                        WHEN NEW.transaction_type = 'PAYMENT' THEN 0
                        ELSE 0 
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.customer_id;
            END;
CREATE TRIGGER update_payment_behavior_on_payment
            AFTER INSERT ON customer_credit_transactions
            WHEN NEW.transaction_type = 'PAYMENT'
            BEGIN
                UPDATE customers
                SET 
                    payment_behavior = CASE
                        -- Excellent: Early payments or overpayments
                        WHEN NEW.transaction_date < (
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        ) THEN 'excellent'
                        -- Good: On-time payments (within grace period)
                        WHEN julianday(NEW.transaction_date) - julianday((
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        )) <= 5 THEN 'good'
                        -- Delayed: Late but within 30 days
                        WHEN julianday(NEW.transaction_date) - julianday((
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        )) <= 30 THEN 'delayed'
                        -- Problematic: Very late payments
                        ELSE 'problematic'
                    END,
                    average_delay_days = (
                        SELECT AVG(julianday(t1.transaction_date) - julianday(t2.due_date))
                        FROM customer_credit_transactions t1
                        JOIN customer_credit_transactions t2 ON t1.customer_id = t2.customer_id
                        WHERE t1.customer_id = NEW.customer_id
                          AND t1.transaction_type = 'PAYMENT'
                          AND t2.transaction_type = 'SALE'
                          AND t1.transaction_date >= t2.transaction_date
                          AND t2.due_date IS NOT NULL
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.customer_id;
            END;
CREATE TRIGGER create_collection_alert_on_overdue
            AFTER INSERT ON customer_credit_transactions
            WHEN NEW.transaction_type = 'SALE' AND NEW.due_date < date('now')
            BEGIN
                INSERT INTO collection_alerts (
                    id, customer_id, alert_type, priority, amount_involved,
                    days_overdue, overdue_amount, suggested_action, status,
                    assigned_to, next_action_date
                )
                SELECT 
                    hex(randomblob(16)),
                    NEW.customer_id,
                    'overdue',
                    CASE 
                        WHEN julianday('now') - julianday(NEW.due_date) > 60 THEN 'urgent'
                        WHEN julianday('now') - julianday(NEW.due_date) > 30 THEN 'high'
                        WHEN julianday('now') - julianday(NEW.due_date) > 15 THEN 'medium'
                        ELSE 'low'
                    END,
                    NEW.amount,
                    julianday('now') - julianday(NEW.due_date),
                    NEW.balance_after,
                    CASE 
                        WHEN c.preferred_contact_method = 'visit' THEN 'visit'
                        WHEN c.preferred_contact_method = 'whatsapp' THEN 'whatsapp'
                        ELSE 'call'
                    END,
                    'open',
                    c.collection_agent,
                    date('now', '+1 day')
                FROM customers c
                WHERE c.id = NEW.customer_id;
            END;
CREATE TRIGGER auto_escalate_collection_alerts
            AFTER UPDATE OF next_action_date ON collection_alerts
            WHEN NEW.next_action_date < date('now') AND NEW.status = 'open'
            BEGIN
                UPDATE collection_alerts
                SET 
                    escalation_level = MIN(escalation_level + 1, 5),
                    priority = CASE 
                        WHEN escalation_level >= 4 THEN 'urgent'
                        WHEN escalation_level >= 3 THEN 'high'
                        ELSE priority
                    END,
                    next_action_date = date('now', '+' || 
                        CASE escalation_level
                            WHEN 1 THEN '3 days'
                            WHEN 2 THEN '2 days' 
                            WHEN 3 THEN '1 day'
                            ELSE '1 day'
                        END
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END;
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_payment_due ON orders(payment_due_date);
CREATE INDEX idx_orders_payment_terms ON orders(payment_terms);
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
CREATE TABLE customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                business_name TEXT,
                cnic TEXT, -- Pakistani CNIC number
                phone TEXT, -- Now optional
                alternate_phone TEXT,
                whatsapp_number TEXT,
                address TEXT,
                city TEXT,
                area TEXT,
                
                -- Credit Information
                credit_limit REAL DEFAULT 0 CHECK (credit_limit >= 0),
                credit_days INTEGER DEFAULT 30 CHECK (credit_days >= 0), -- Allow zero days
                current_outstanding REAL DEFAULT 0,
                
                -- Business Classification
                customer_type TEXT DEFAULT 'credit' CHECK (customer_type IN ('cash', 'credit', 'special')),
                shop_type TEXT DEFAULT 'retail' CHECK (shop_type IN ('retail', 'distributor', 'sub_distributor')),
                payment_behavior TEXT DEFAULT 'new' CHECK (payment_behavior IN ('new', 'excellent', 'good', 'delayed', 'problematic')),
                relationship_type TEXT DEFAULT 'business' CHECK (relationship_type IN ('business', 'family', 'friend', 'reference')),
                
                -- Risk Assessment
                credit_status TEXT DEFAULT 'good' CHECK (credit_status IN ('good', 'warning', 'blocked', 'cash_only')),
                last_payment_date DATE,
                average_delay_days INTEGER DEFAULT 0,
                total_orders_count INTEGER DEFAULT 0,
                total_lifetime_value REAL DEFAULT 0,
                
                -- Communication Preferences
                preferred_contact_method TEXT DEFAULT 'call' CHECK (preferred_contact_method IN ('call', 'whatsapp', 'visit', 'sms')),
                best_contact_time TEXT,
                
                -- Business Registration
                business_registration_number TEXT,
                ntn_number TEXT, -- National Tax Number for Pakistan
                
                -- Relationship Management
                referred_by TEXT,
                collection_agent TEXT, -- Which order booker manages this customer
                special_instructions TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cnic ON customers(cnic);
CREATE INDEX idx_customers_credit_status ON customers(credit_status);
CREATE INDEX idx_customers_area ON customers(area);
CREATE INDEX idx_customers_payment_behavior ON customers(payment_behavior);
CREATE INDEX idx_customers_collection_agent ON customers(collection_agent);
CREATE INDEX idx_customers_outstanding ON customers(current_outstanding);
CREATE INDEX idx_customers_last_payment ON customers(last_payment_date);

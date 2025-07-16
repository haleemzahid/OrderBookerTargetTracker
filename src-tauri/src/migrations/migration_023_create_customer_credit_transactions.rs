use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 23,
        description: "create_customer_credit_transactions",
        sql: "
            -- Create customer credit transactions table to track all financial activities
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

            -- Indexes for performance optimization
            CREATE INDEX idx_credit_trans_customer ON customer_credit_transactions(customer_id);
            CREATE INDEX idx_credit_trans_date ON customer_credit_transactions(transaction_date);
            CREATE INDEX idx_credit_trans_type ON customer_credit_transactions(transaction_type);
            CREATE INDEX idx_credit_trans_order ON customer_credit_transactions(order_id);
            CREATE INDEX idx_credit_trans_due_date ON customer_credit_transactions(due_date);
            CREATE INDEX idx_credit_trans_payment_method ON customer_credit_transactions(payment_method);
            CREATE INDEX idx_credit_trans_received_by ON customer_credit_transactions(received_by);
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

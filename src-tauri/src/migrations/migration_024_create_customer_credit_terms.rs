use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 24,
        description: "create_customer_credit_terms",
        sql: "
            -- Create customer credit terms table for flexible credit management
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

            -- Create a unique index to ensure only one active term per customer
            CREATE UNIQUE INDEX idx_credit_terms_customer_active 
            ON customer_credit_terms(customer_id) 
            WHERE is_active = TRUE;

            -- Indexes for performance
            CREATE INDEX idx_credit_terms_customer ON customer_credit_terms(customer_id);
            CREATE INDEX idx_credit_terms_active ON customer_credit_terms(is_active);
            CREATE INDEX idx_credit_terms_effective ON customer_credit_terms(effective_from, effective_to);
            CREATE INDEX idx_credit_terms_approved_by ON customer_credit_terms(approved_by);
            CREATE INDEX idx_credit_terms_review_date ON customer_credit_terms(review_date);
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

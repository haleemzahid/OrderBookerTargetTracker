use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 22,
        description: "create_customers_table",
        sql: "
            -- Create customers table with comprehensive Pakistani business context
            CREATE TABLE customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                business_name TEXT,
                cnic TEXT, -- Pakistani CNIC number
                phone TEXT NOT NULL,
                alternate_phone TEXT,
                whatsapp_number TEXT,
                address TEXT,
                city TEXT,
                area TEXT,
                
                -- Credit Information
                credit_limit REAL DEFAULT 0 CHECK (credit_limit >= 0),
                credit_days INTEGER DEFAULT 30 CHECK (credit_days > 0),
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

            -- Indexes for performance optimization
            CREATE INDEX idx_customers_phone ON customers(phone);
            CREATE INDEX idx_customers_cnic ON customers(cnic);
            CREATE INDEX idx_customers_credit_status ON customers(credit_status);
            CREATE INDEX idx_customers_area ON customers(area);
            CREATE INDEX idx_customers_payment_behavior ON customers(payment_behavior);
            CREATE INDEX idx_customers_collection_agent ON customers(collection_agent);
            CREATE INDEX idx_customers_outstanding ON customers(current_outstanding);
            CREATE INDEX idx_customers_last_payment ON customers(last_payment_date);
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

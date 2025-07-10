use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 12,
        description: "transform_daily_entries_structure",
        sql: "-- Backup existing daily entries
            CREATE TABLE daily_entries_backup AS SELECT * FROM daily_entries;

            -- Create new daily_entries structure (header/summary table)
            CREATE TABLE daily_entries_new (
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

            -- Create daily_entry_items table (line items)
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

            -- Insert default company for migration
            INSERT OR IGNORE INTO companies (id, name, created_at, updated_at) 
            VALUES ('default-company', 'Default Company', datetime('now'), datetime('now'));

            -- Insert default product for migration
            INSERT OR IGNORE INTO products (id, company_id, name, cost_price, sell_price, unit_per_carton, created_at, updated_at)
            VALUES ('default-product', 'default-company', 'General Product', 100, 120, 1, datetime('now'), datetime('now'));

            -- Migrate existing data to new structure
            INSERT INTO daily_entries_new (
                id, order_booker_id, date, notes, total_amount, total_return_amount, net_amount, created_at, updated_at
            )
            SELECT 
                id, 
                order_booker_id, 
                date, 
                notes,
                sales as total_amount,
                returns as total_return_amount,
                net_sales as net_amount,
                created_at, 
                updated_at
            FROM daily_entries_backup;

            -- Create corresponding items for migrated entries
            INSERT INTO daily_entry_items (
                id,
                daily_entry_id,
                product_id,
                quantity_sold,
                quantity_returned,
                net_quantity,
                total_cost,
                total_revenue,
                created_at,
                updated_at
            )
            SELECT 
                lower(hex(randomblob(16))) as id,
                de.id as daily_entry_id,
                'default-product' as product_id,
                de.total_carton as quantity_sold,
                de.return_carton as quantity_returned,
                (de.total_carton - de.return_carton) as net_quantity,
                (de.total_carton - de.return_carton) * 100 as total_cost,
                de.sales as total_revenue,
                de.created_at,
                de.updated_at
            FROM daily_entries_backup de;

            -- Drop old table and rename new one
            DROP TABLE daily_entries;
            ALTER TABLE daily_entries_new RENAME TO daily_entries;

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_daily_entries_order_booker ON daily_entries(order_booker_id);
            CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
            CREATE INDEX IF NOT EXISTS idx_daily_entry_items_entry ON daily_entry_items(daily_entry_id);
            CREATE INDEX IF NOT EXISTS idx_daily_entry_items_product ON daily_entry_items(product_id);",
        kind: MigrationKind::Up,
    }
}

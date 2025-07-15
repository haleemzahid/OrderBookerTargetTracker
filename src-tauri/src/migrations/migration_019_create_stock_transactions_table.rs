use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 19,
        description: "create_stock_transactions_table",
        sql: "CREATE TABLE IF NOT EXISTS stock_transactions (
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

        CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON stock_transactions(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
        CREATE INDEX IF NOT EXISTS idx_stock_transactions_reason ON stock_transactions(reason);
        CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(created_at);",
        kind: MigrationKind::Up,
    }
}

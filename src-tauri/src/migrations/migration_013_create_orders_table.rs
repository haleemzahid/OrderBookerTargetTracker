use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 13,
        description: "create_orders_table",
        sql: "CREATE TABLE IF NOT EXISTS orders (
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
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_orders_order_booker ON orders(order_booker_id);
        CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_supply_date ON orders(supply_date);",
        kind: MigrationKind::Up,
    }
}

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 20,
        description: "add_stock_to_products",
        sql: "ALTER TABLE products ADD COLUMN current_stock INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 20;

        CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
        CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(low_stock_threshold);",
        kind: MigrationKind::Up,
    }
}

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 11,
        description: "create_products_table",
        sql: "CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            cost_price REAL NOT NULL,
            sell_price REAL NOT NULL,
            unit_per_carton INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);",
        kind: MigrationKind::Up,
    }
}

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 2,
        description: "create_daily_entries_table",
        sql: "CREATE TABLE IF NOT EXISTS daily_entries (
            id TEXT PRIMARY KEY,
            order_booker_id TEXT NOT NULL,
            date TEXT NOT NULL,
            sales REAL NOT NULL DEFAULT 0,
            returns REAL NOT NULL DEFAULT 0,
            net_sales REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE
        );",
        kind: MigrationKind::Up,
    }
}

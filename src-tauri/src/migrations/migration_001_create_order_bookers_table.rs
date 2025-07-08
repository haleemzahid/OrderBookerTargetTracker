use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 1,
        description: "create_order_bookers_table",
        sql: "CREATE TABLE IF NOT EXISTS order_bookers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_urdu TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            join_date TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            monthly_target REAL NOT NULL DEFAULT 0,
            territory TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        kind: MigrationKind::Up,
    }
}

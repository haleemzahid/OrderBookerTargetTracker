use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 3,
        description: "create_monthly_targets_table",
        sql: "CREATE TABLE IF NOT EXISTS monthly_targets (
            id TEXT PRIMARY KEY,
            order_booker_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            target_amount REAL NOT NULL DEFAULT 0,
            achieved_amount REAL NOT NULL DEFAULT 0,
            remaining_amount REAL NOT NULL DEFAULT 0,
            achievement_percentage REAL NOT NULL DEFAULT 0,
            days_in_month INTEGER NOT NULL,
            working_days_in_month INTEGER NOT NULL,
            daily_target_amount REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE,
            UNIQUE(order_booker_id, year, month)
        );",
        kind: MigrationKind::Up,
    }
}

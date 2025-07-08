use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 8,
        description: "remove_territory_and_monthly_target_columns",
        sql: "-- Create new table without territory and monthly_target columns
            CREATE TABLE order_bookers_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                name_urdu TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                join_date TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            -- Copy data from old table to new table
            INSERT INTO order_bookers_new (
                id, name, name_urdu, phone, email, join_date, is_active, created_at, updated_at
            )
            SELECT 
                id, name, name_urdu, phone, email, join_date, is_active, created_at, updated_at
            FROM order_bookers;

            -- Drop old table
            DROP TABLE order_bookers;

            -- Rename new table to original name
            ALTER TABLE order_bookers_new RENAME TO order_bookers;

            -- Recreate indexes for the new table
            CREATE INDEX IF NOT EXISTS idx_order_bookers_active ON order_bookers(is_active);",
        kind: MigrationKind::Up,
    }
}

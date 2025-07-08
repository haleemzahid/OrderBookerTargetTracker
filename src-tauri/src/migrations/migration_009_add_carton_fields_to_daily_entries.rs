use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 9,
        description: "add_carton_fields_to_daily_entries",
        sql: "-- Add total_carton and return_carton columns to daily_entries table
            ALTER TABLE daily_entries ADD COLUMN total_carton INTEGER NOT NULL DEFAULT 0;
            ALTER TABLE daily_entries ADD COLUMN return_carton INTEGER NOT NULL DEFAULT 0;",
        kind: MigrationKind::Up,
    }
}

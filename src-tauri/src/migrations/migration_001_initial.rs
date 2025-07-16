use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 2,
        description: "init_database",
        sql: include_str!("migration_001_initial.sql"),
        kind: MigrationKind::Up,
    }
}

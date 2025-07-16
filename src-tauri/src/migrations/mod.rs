use tauri_plugin_sql::Migration;

mod migration_001_initial;

pub fn get_migrations() -> Vec<Migration> {
    vec![
        migration_001_initial::migration(),
    ]
}

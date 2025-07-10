use tauri_plugin_sql::Migration;

mod migration_001_create_order_bookers_table;
mod migration_002_create_daily_entries_table;
mod migration_003_create_monthly_targets_table;
mod migration_004_create_indexes;
mod migration_005_create_triggers_for_auto_calculations;
mod migration_006_insert_sample_data;
mod migration_007_replace_with_july_2025_data;
mod migration_008_remove_territory_and_monthly_target_columns;
mod migration_009_add_carton_fields_to_daily_entries;
pub mod migration_010_create_companies_table;
pub mod migration_011_create_products_table;
pub mod migration_012_transform_daily_entries_structure;
pub mod migration_013_create_orders_table;
pub mod migration_014_create_order_items_table;
pub mod migration_015_create_order_triggers;

/// Returns all database migrations in order
pub fn get_migrations() -> Vec<Migration> {
    vec![
        migration_001_create_order_bookers_table::migration(),
        migration_002_create_daily_entries_table::migration(),
        migration_003_create_monthly_targets_table::migration(),
        migration_004_create_indexes::migration(),
        migration_005_create_triggers_for_auto_calculations::migration(),
        migration_006_insert_sample_data::migration(),
        migration_007_replace_with_july_2025_data::migration(),
        migration_008_remove_territory_and_monthly_target_columns::migration(),
        migration_009_add_carton_fields_to_daily_entries::migration(),
        migration_010_create_companies_table::migration(),
        migration_011_create_products_table::migration(),
        migration_012_transform_daily_entries_structure::migration(),
        migration_013_create_orders_table::migration(),
        migration_014_create_order_items_table::migration(),
        migration_015_create_order_triggers::migration(),
    ]
}

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 18,
        description: "drop_all_order_calculation_triggers",
        sql: "
        -- Drop all existing order calculation triggers
        DROP TRIGGER IF EXISTS calculate_order_item_totals;
        DROP TRIGGER IF EXISTS update_order_item_totals;
        DROP TRIGGER IF EXISTS update_order_totals_on_insert;
        DROP TRIGGER IF EXISTS update_order_totals_on_update;
        DROP TRIGGER IF EXISTS update_order_totals_on_delete;
        DROP TRIGGER IF EXISTS calculate_order_item_totals_before_insert;
        DROP TRIGGER IF EXISTS calculate_order_item_totals_before_update;
        DROP TRIGGER IF EXISTS update_order_totals_after_item_insert;
        DROP TRIGGER IF EXISTS update_order_totals_after_item_update;
        DROP TRIGGER IF EXISTS update_order_totals_after_item_delete;",
        kind: MigrationKind::Up,
    }
}

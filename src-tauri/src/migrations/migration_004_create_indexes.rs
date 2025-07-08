use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 4,
        description: "create_indexes",
        sql: "CREATE INDEX IF NOT EXISTS idx_order_bookers_active ON order_bookers(is_active);
            CREATE INDEX IF NOT EXISTS idx_order_bookers_territory ON order_bookers(territory);
            CREATE INDEX IF NOT EXISTS idx_daily_entries_order_booker ON daily_entries(order_booker_id);
            CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
            CREATE INDEX IF NOT EXISTS idx_daily_entries_order_booker_date ON daily_entries(order_booker_id, date);
            CREATE INDEX IF NOT EXISTS idx_monthly_targets_order_booker ON monthly_targets(order_booker_id);
            CREATE INDEX IF NOT EXISTS idx_monthly_targets_year_month ON monthly_targets(year, month);",
        kind: MigrationKind::Up,
    }
}

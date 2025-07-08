use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 6,
        description: "insert_sample_data",
        sql: "INSERT OR IGNORE INTO order_bookers (
            id, name, name_urdu, phone, email, join_date, is_active, 
            monthly_target, territory, created_at, updated_at
        ) VALUES 
            ('ob1', 'Ahmed Ali', 'احمد علی', '+92-300-1234567', 'ahmed.ali@email.com', '2024-01-15', 1, 50000, 'Karachi North', datetime('now'), datetime('now')),
            ('ob2', 'Fatima Khan', 'فاطمہ خان', '+92-301-2345678', 'fatima.khan@email.com', '2024-02-01', 1, 60000, 'Karachi South', datetime('now'), datetime('now')),
            ('ob3', 'Muhammad Hassan', 'محمد حسن', '+92-302-3456789', 'hassan@email.com', '2024-01-20', 1, 45000, 'Lahore', datetime('now'), datetime('now')),
            ('ob4', 'Sara Sheikh', 'سارہ شیخ', '+92-303-4567890', 'sara.sheikh@email.com', '2024-03-01', 1, 55000, 'Islamabad', datetime('now'), datetime('now')),
            ('ob5', 'Ali Ahmed', 'علی احمد', '+92-304-5678901', 'ali.ahmed@email.com', '2024-02-15', 1, 40000, 'Karachi East', datetime('now'), datetime('now'));",
        kind: MigrationKind::Up,
    }
}

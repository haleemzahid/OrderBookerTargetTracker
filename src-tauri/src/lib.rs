use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
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
        },
        Migration {
            version: 2,
            description: "create_daily_entries_table",
            sql: "CREATE TABLE IF NOT EXISTS daily_entries (
                id TEXT PRIMARY KEY,
                order_booker_id TEXT NOT NULL,
                date TEXT NOT NULL,
                sales REAL NOT NULL DEFAULT 0,
                returns REAL NOT NULL DEFAULT 0,
                net_sales REAL NOT NULL DEFAULT 0,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id) ON DELETE CASCADE
            );",
            kind: MigrationKind::Up,
        },
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
        },
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
        },
        Migration {
            version: 5,
            description: "create_triggers_for_auto_calculations",
            sql: "CREATE TRIGGER IF NOT EXISTS update_net_sales_on_insert
                AFTER INSERT ON daily_entries
                BEGIN
                    UPDATE daily_entries 
                    SET net_sales = NEW.sales - NEW.returns
                    WHERE id = NEW.id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_net_sales_on_update
                AFTER UPDATE ON daily_entries
                BEGIN
                    UPDATE daily_entries 
                    SET net_sales = NEW.sales - NEW.returns
                    WHERE id = NEW.id;
                END;

                CREATE TRIGGER IF NOT EXISTS update_monthly_targets_on_daily_entry_insert
                AFTER INSERT ON daily_entries
                BEGIN
                    INSERT OR IGNORE INTO monthly_targets (
                        id, order_booker_id, year, month, target_amount, achieved_amount, 
                        remaining_amount, achievement_percentage, days_in_month, 
                        working_days_in_month, daily_target_amount, created_at, updated_at
                    ) 
                    SELECT 
                        lower(hex(randomblob(16))),
                        NEW.order_booker_id,
                        CAST(strftime('%Y', NEW.date) AS INTEGER),
                        CAST(strftime('%m', NEW.date) AS INTEGER),
                        0,
                        0,
                        0,
                        0,
                        CAST(strftime('%d', date(strftime('%Y', NEW.date) || '-' || strftime('%m', NEW.date) || '-01', '+1 month', '-1 day')) AS INTEGER),
                        CAST(strftime('%d', date(strftime('%Y', NEW.date) || '-' || strftime('%m', NEW.date) || '-01', '+1 month', '-1 day')) AS INTEGER),
                        0,
                        datetime('now'),
                        datetime('now');
                        
                    UPDATE monthly_targets 
                    SET 
                        achieved_amount = (
                            SELECT COALESCE(SUM(net_sales), 0) 
                            FROM daily_entries 
                            WHERE order_booker_id = NEW.order_booker_id 
                            AND strftime('%Y', date) = CAST(monthly_targets.year AS TEXT)
                            AND strftime('%m', date) = printf('%02d', monthly_targets.month)
                        ),
                        updated_at = datetime('now')
                    WHERE order_booker_id = NEW.order_booker_id 
                    AND year = CAST(strftime('%Y', NEW.date) AS INTEGER)
                    AND month = CAST(strftime('%m', NEW.date) AS INTEGER);
                        
                    UPDATE monthly_targets 
                    SET 
                        remaining_amount = target_amount - achieved_amount,
                        achievement_percentage = CASE 
                            WHEN target_amount > 0 THEN (achieved_amount / target_amount) * 100 
                            ELSE 0 
                        END,
                        daily_target_amount = CASE 
                            WHEN working_days_in_month > 0 THEN target_amount / working_days_in_month 
                            ELSE 0 
                        END
                    WHERE order_booker_id = NEW.order_booker_id 
                    AND year = CAST(strftime('%Y', NEW.date) AS INTEGER)
                    AND month = CAST(strftime('%m', NEW.date) AS INTEGER);
                END;",
            kind: MigrationKind::Up,
        },
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
        },
        Migration {
            version: 7,
            description: "replace_with_july_2025_data",
            sql: "-- Remove old dummy data
                DELETE FROM monthly_targets;
                DELETE FROM daily_entries;
                DELETE FROM order_bookers;
                
                -- Insert July 2025 Order Bookers
                INSERT INTO order_bookers (
                    id, name, name_urdu, phone, email, join_date, is_active, 
                    monthly_target, territory, created_at, updated_at
                ) VALUES 
                    ('ob1', 'Abdu Rehman', 'عبدالرحمن', '+92-300-1000001', 'abdu.rehman@email.com', '2025-01-01', 1, 700000, 'Territory 1', datetime('now'), datetime('now')),
                    ('ob2', 'Waqar', 'وقار', '+92-300-1000002', 'waqar@email.com', '2025-01-01', 1, 700000, 'Territory 2', datetime('now'), datetime('now')),
                    ('ob3', 'Kashif', 'کاشف', '+92-300-1000003', 'kashif@email.com', '2025-01-01', 1, 700000, 'Territory 3', datetime('now'), datetime('now')),
                    ('ob4', 'Mobin', 'موبن', '+92-300-1000004', 'mobin@email.com', '2025-01-01', 1, 700000, 'Territory 4', datetime('now'), datetime('now'));

                -- Insert Daily Entries for July 2025
                INSERT INTO daily_entries (
                    id, order_booker_id, date, sales, returns, net_sales, notes, created_at, updated_at
                ) VALUES 
                    -- Abdu Rehman entries
                    ('de1', 'ob1', '2025-07-01', 50000, 0, 50000, 'July 1st sales', datetime('now'), datetime('now')),
                    ('de2', 'ob1', '2025-07-02', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de3', 'ob1', '2025-07-03', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de4', 'ob1', '2025-07-04', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    
                    -- Waqar entries
                    ('de5', 'ob2', '2025-07-01', 100000, 50000, 50000, 'July 1st sales with returns', datetime('now'), datetime('now')),
                    ('de6', 'ob2', '2025-07-02', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de7', 'ob2', '2025-07-03', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de8', 'ob2', '2025-07-04', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    
                    -- Kashif entries
                    ('de9', 'ob3', '2025-07-01', 600000, 0, 600000, 'July 1st sales', datetime('now'), datetime('now')),
                    ('de10', 'ob3', '2025-07-02', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de11', 'ob3', '2025-07-03', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de12', 'ob3', '2025-07-04', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    
                    -- Mobin entries
                    ('de13', 'ob4', '2025-07-01', 50000, 0, 50000, 'July 1st sales', datetime('now'), datetime('now')),
                    ('de14', 'ob4', '2025-07-02', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de15', 'ob4', '2025-07-03', 0, 0, 0, 'No sales', datetime('now'), datetime('now')),
                    ('de16', 'ob4', '2025-07-04', 0, 0, 0, 'No sales', datetime('now'), datetime('now'));

                -- Update the monthly targets with correct target amounts
                -- The triggers will have created the monthly_targets entries, now we need to set the correct target amounts
                UPDATE monthly_targets 
                SET 
                    target_amount = 700000,
                    remaining_amount = 700000 - achieved_amount,
                    achievement_percentage = CASE 
                        WHEN 700000 > 0 THEN (achieved_amount / 700000) * 100 
                        ELSE 0 
                    END,
                    daily_target_amount = 700000 / 31.0
                WHERE year = 2025 AND month = 7;",
            kind: MigrationKind::Up,
        },
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
        },
        Migration {
            version: 9,
            description: "add_carton_fields_to_daily_entries",
            sql: "-- Add total_carton and return_carton columns to daily_entries table
                ALTER TABLE daily_entries ADD COLUMN total_carton INTEGER NOT NULL DEFAULT 0;
                ALTER TABLE daily_entries ADD COLUMN return_carton INTEGER NOT NULL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:app.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

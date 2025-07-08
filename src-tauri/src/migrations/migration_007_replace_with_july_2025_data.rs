use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
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
    }
}

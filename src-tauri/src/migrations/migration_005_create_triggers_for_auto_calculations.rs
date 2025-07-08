use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
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
    }
}

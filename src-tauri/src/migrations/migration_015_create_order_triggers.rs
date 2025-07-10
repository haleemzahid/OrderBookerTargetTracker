use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 15,
        description: "create_order_triggers_for_auto_calculations",
        sql: "
        -- Trigger to calculate order item totals when inserting/updating
        CREATE TRIGGER IF NOT EXISTS calculate_order_item_totals
        AFTER INSERT ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE order_items SET
                total_cost = NEW.quantity * NEW.cost_price,
                total_amount = NEW.quantity * NEW.sell_price,
                profit = (NEW.quantity * NEW.sell_price) - (NEW.quantity * NEW.cost_price),
                cartons = NEW.quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id),
                return_amount = NEW.return_quantity * NEW.sell_price,
                return_cartons = NEW.return_quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
            WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS update_order_item_totals
        AFTER UPDATE ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE order_items SET
                total_cost = NEW.quantity * NEW.cost_price,
                total_amount = NEW.quantity * NEW.sell_price,
                profit = (NEW.quantity * NEW.sell_price) - (NEW.quantity * NEW.cost_price),
                cartons = NEW.quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id),
                return_amount = NEW.return_quantity * NEW.sell_price,
                return_cartons = NEW.return_quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
            WHERE id = NEW.id;
        END;

        -- Trigger to update order totals when order items change
        CREATE TRIGGER IF NOT EXISTS update_order_totals_on_insert
        AFTER INSERT ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (SELECT COALESCE(SUM(total_amount), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_profit = (SELECT COALESCE(SUM(profit), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_cartons = (SELECT COALESCE(SUM(cartons), 0) FROM order_items WHERE order_id = NEW.order_id),
                return_cartons = (SELECT COALESCE(SUM(return_cartons), 0) FROM order_items WHERE order_id = NEW.order_id),
                return_amount = (SELECT COALESCE(SUM(return_amount), 0) FROM order_items WHERE order_id = NEW.order_id),
                updated_at = datetime('now')
            WHERE id = NEW.order_id;
        END;

        CREATE TRIGGER IF NOT EXISTS update_order_totals_on_update
        AFTER UPDATE ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (SELECT COALESCE(SUM(total_amount), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_profit = (SELECT COALESCE(SUM(profit), 0) FROM order_items WHERE order_id = NEW.order_id),
                total_cartons = (SELECT COALESCE(SUM(cartons), 0) FROM order_items WHERE order_id = NEW.order_id),
                return_cartons = (SELECT COALESCE(SUM(return_cartons), 0) FROM order_items WHERE order_id = NEW.order_id),
                return_amount = (SELECT COALESCE(SUM(return_amount), 0) FROM order_items WHERE order_id = NEW.order_id),
                updated_at = datetime('now')
            WHERE id = NEW.order_id;
        END;

        CREATE TRIGGER IF NOT EXISTS update_order_totals_on_delete
        AFTER DELETE ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (SELECT COALESCE(SUM(total_amount), 0) FROM order_items WHERE order_id = OLD.order_id),
                total_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM order_items WHERE order_id = OLD.order_id),
                total_profit = (SELECT COALESCE(SUM(profit), 0) FROM order_items WHERE order_id = OLD.order_id),
                total_cartons = (SELECT COALESCE(SUM(cartons), 0) FROM order_items WHERE order_id = OLD.order_id),
                return_cartons = (SELECT COALESCE(SUM(return_cartons), 0) FROM order_items WHERE order_id = OLD.order_id),
                return_amount = (SELECT COALESCE(SUM(return_amount), 0) FROM order_items WHERE order_id = OLD.order_id),
                updated_at = datetime('now')
            WHERE id = OLD.order_id;
        END;",
        kind: MigrationKind::Up,
    }
}

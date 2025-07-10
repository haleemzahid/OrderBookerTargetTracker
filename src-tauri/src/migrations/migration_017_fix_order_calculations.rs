use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 17,
        description: "fix_order_calculations_with_proper_triggers",
        sql: "
        -- Drop existing triggers that have issues
        DROP TRIGGER IF EXISTS calculate_order_item_totals;
        DROP TRIGGER IF EXISTS update_order_item_totals;
        DROP TRIGGER IF EXISTS update_order_totals_on_insert;
        DROP TRIGGER IF EXISTS update_order_totals_on_update;
        DROP TRIGGER IF EXISTS update_order_totals_on_delete;

        -- Create BEFORE INSERT trigger for order items to calculate totals
        CREATE TRIGGER calculate_order_item_totals_before_insert
        BEFORE INSERT ON order_items
        FOR EACH ROW
        WHEN NEW.total_cost IS NULL OR NEW.total_amount IS NULL OR NEW.profit IS NULL OR NEW.cartons IS NULL
        BEGIN
            UPDATE order_items SET
                total_cost = NEW.quantity * NEW.cost_price,
                total_amount = NEW.quantity * NEW.sell_price,
                profit = (NEW.quantity * NEW.sell_price) - (NEW.quantity * NEW.cost_price),
                cartons = CASE 
                    WHEN (SELECT unit_per_carton FROM products WHERE id = NEW.product_id) > 0 
                    THEN NEW.quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
                    ELSE 0
                END,
                return_amount = COALESCE(NEW.return_quantity, 0) * NEW.sell_price,
                return_cartons = CASE 
                    WHEN (SELECT unit_per_carton FROM products WHERE id = NEW.product_id) > 0 
                    THEN COALESCE(NEW.return_quantity, 0) / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
                    ELSE 0
                END
            WHERE 1=0; -- This won't execute, just forces the calculation
        END;

        -- Create BEFORE UPDATE trigger for order items to recalculate totals
        CREATE TRIGGER calculate_order_item_totals_before_update
        BEFORE UPDATE ON order_items
        FOR EACH ROW
        WHEN NEW.quantity != OLD.quantity OR NEW.cost_price != OLD.cost_price OR NEW.sell_price != OLD.sell_price OR NEW.return_quantity != OLD.return_quantity
        BEGIN
            UPDATE order_items SET
                total_cost = NEW.quantity * NEW.cost_price,
                total_amount = NEW.quantity * NEW.sell_price,
                profit = (NEW.quantity * NEW.sell_price) - (NEW.quantity * NEW.cost_price),
                cartons = CASE 
                    WHEN (SELECT unit_per_carton FROM products WHERE id = NEW.product_id) > 0 
                    THEN NEW.quantity / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
                    ELSE 0
                END,
                return_amount = COALESCE(NEW.return_quantity, 0) * NEW.sell_price,
                return_cartons = CASE 
                    WHEN (SELECT unit_per_carton FROM products WHERE id = NEW.product_id) > 0 
                    THEN COALESCE(NEW.return_quantity, 0) / (SELECT unit_per_carton FROM products WHERE id = NEW.product_id)
                    ELSE 0
                END
            WHERE 1=0; -- This won't execute, just forces the calculation
        END;

        -- Create AFTER INSERT trigger to update order totals
        CREATE TRIGGER update_order_totals_after_item_insert
        AFTER INSERT ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (
                    SELECT COALESCE(SUM(total_amount), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_cost = (
                    SELECT COALESCE(SUM(total_cost), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_profit = (
                    SELECT COALESCE(SUM(profit), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_cartons = (
                    SELECT COALESCE(SUM(cartons), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                return_cartons = (
                    SELECT COALESCE(SUM(return_cartons), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                return_amount = (
                    SELECT COALESCE(SUM(return_amount), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                updated_at = datetime('now')
            WHERE id = NEW.order_id;
        END;

        -- Create AFTER UPDATE trigger to update order totals
        CREATE TRIGGER update_order_totals_after_item_update
        AFTER UPDATE ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (
                    SELECT COALESCE(SUM(total_amount), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_cost = (
                    SELECT COALESCE(SUM(total_cost), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_profit = (
                    SELECT COALESCE(SUM(profit), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                total_cartons = (
                    SELECT COALESCE(SUM(cartons), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                return_cartons = (
                    SELECT COALESCE(SUM(return_cartons), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                return_amount = (
                    SELECT COALESCE(SUM(return_amount), 0) 
                    FROM order_items 
                    WHERE order_id = NEW.order_id
                ),
                updated_at = datetime('now')
            WHERE id = NEW.order_id;
        END;

        -- Create AFTER DELETE trigger to update order totals
        CREATE TRIGGER update_order_totals_after_item_delete
        AFTER DELETE ON order_items
        FOR EACH ROW
        BEGIN
            UPDATE orders SET
                total_amount = (
                    SELECT COALESCE(SUM(total_amount), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                total_cost = (
                    SELECT COALESCE(SUM(total_cost), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                total_profit = (
                    SELECT COALESCE(SUM(profit), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                total_cartons = (
                    SELECT COALESCE(SUM(cartons), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                return_cartons = (
                    SELECT COALESCE(SUM(return_cartons), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                return_amount = (
                    SELECT COALESCE(SUM(return_amount), 0) 
                    FROM order_items 
                    WHERE order_id = OLD.order_id
                ),
                updated_at = datetime('now')
            WHERE id = OLD.order_id;
        END;

        -- Update existing order items to calculate their totals
        UPDATE order_items SET
            total_cost = quantity * cost_price,
            total_amount = quantity * sell_price,
            profit = (quantity * sell_price) - (quantity * cost_price),
            cartons = CASE 
                WHEN (SELECT unit_per_carton FROM products WHERE id = order_items.product_id) > 0 
                THEN quantity / (SELECT unit_per_carton FROM products WHERE id = order_items.product_id)
                ELSE 0
            END,
            return_amount = COALESCE(return_quantity, 0) * sell_price,
            return_cartons = CASE 
                WHEN (SELECT unit_per_carton FROM products WHERE id = order_items.product_id) > 0 
                THEN COALESCE(return_quantity, 0) / (SELECT unit_per_carton FROM products WHERE id = order_items.product_id)
                ELSE 0
            END
        WHERE total_cost IS NULL OR total_amount IS NULL OR profit IS NULL OR cartons IS NULL;

        -- Update existing orders to calculate their totals
        UPDATE orders SET
            total_amount = (
                SELECT COALESCE(SUM(total_amount), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            total_cost = (
                SELECT COALESCE(SUM(total_cost), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            total_profit = (
                SELECT COALESCE(SUM(profit), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            total_cartons = (
                SELECT COALESCE(SUM(cartons), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            return_cartons = (
                SELECT COALESCE(SUM(return_cartons), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            return_amount = (
                SELECT COALESCE(SUM(return_amount), 0) 
                FROM order_items 
                WHERE order_id = orders.id
            ),
            updated_at = datetime('now')
        WHERE total_amount IS NULL OR total_cost IS NULL OR total_profit IS NULL;",
        kind: MigrationKind::Up,
    }
}

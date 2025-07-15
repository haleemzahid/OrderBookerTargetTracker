use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 21,
        description: "create_stock_triggers",
        sql: "-- Trigger to update product stock when stock transactions are inserted
        CREATE TRIGGER IF NOT EXISTS update_product_stock_after_transaction_insert
        AFTER INSERT ON stock_transactions
        BEGIN
            UPDATE products 
            SET current_stock = CASE 
                WHEN NEW.transaction_type = 'IN' THEN current_stock + NEW.quantity
                WHEN NEW.transaction_type = 'OUT' THEN current_stock - NEW.quantity
                WHEN NEW.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN NEW.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock - NEW.quantity
                        ELSE current_stock + NEW.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = NEW.product_id;
        END;

        -- Trigger to update product stock when stock transactions are updated
        CREATE TRIGGER IF NOT EXISTS update_product_stock_after_transaction_update
        AFTER UPDATE ON stock_transactions
        BEGIN
            -- First, reverse the old transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN OLD.transaction_type = 'IN' THEN current_stock - OLD.quantity
                WHEN OLD.transaction_type = 'OUT' THEN current_stock + OLD.quantity
                WHEN OLD.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN OLD.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock + OLD.quantity
                        ELSE current_stock - OLD.quantity
                    END
                ELSE current_stock
            END
            WHERE id = OLD.product_id;
            
            -- Then apply the new transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN NEW.transaction_type = 'IN' THEN current_stock + NEW.quantity
                WHEN NEW.transaction_type = 'OUT' THEN current_stock - NEW.quantity
                WHEN NEW.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN NEW.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock - NEW.quantity
                        ELSE current_stock + NEW.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = NEW.product_id;
        END;

        -- Trigger to update product stock when stock transactions are deleted
        CREATE TRIGGER IF NOT EXISTS update_product_stock_after_transaction_delete
        AFTER DELETE ON stock_transactions
        BEGIN
            -- Reverse the deleted transaction
            UPDATE products 
            SET current_stock = CASE 
                WHEN OLD.transaction_type = 'IN' THEN current_stock - OLD.quantity
                WHEN OLD.transaction_type = 'OUT' THEN current_stock + OLD.quantity
                WHEN OLD.transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN OLD.reason IN ('EXPIRED', 'DAMAGED', 'LOST') THEN current_stock + OLD.quantity
                        ELSE current_stock - OLD.quantity
                    END
                ELSE current_stock
            END,
            updated_at = datetime('now')
            WHERE id = OLD.product_id;
        END;",
        kind: MigrationKind::Up,
    }
}

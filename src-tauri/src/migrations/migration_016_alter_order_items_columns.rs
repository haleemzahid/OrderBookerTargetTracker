use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migration() -> Migration {
    Migration {
        version: 16,
        description: "alter_order_items_columns_to_nullable_with_defaults",
        sql: "
        -- Create a temporary table with the new structure
        CREATE TABLE order_items_temp (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            cost_price REAL NOT NULL,
            sell_price REAL NOT NULL,
            total_cost REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            profit REAL DEFAULT 0,
            cartons REAL DEFAULT 0,
            return_quantity INTEGER DEFAULT 0,
            return_amount REAL DEFAULT 0,
            return_cartons REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        -- Copy data from the original table to the temporary table
        INSERT INTO order_items_temp 
        SELECT 
            id,
            order_id,
            product_id,
            quantity,
            cost_price,
            sell_price,
            COALESCE(total_cost, 0) as total_cost,
            COALESCE(total_amount, 0) as total_amount,
            COALESCE(profit, 0) as profit,
            COALESCE(cartons, 0) as cartons,
            COALESCE(return_quantity, 0) as return_quantity,
            COALESCE(return_amount, 0) as return_amount,
            COALESCE(return_cartons, 0) as return_cartons,
            created_at,
            updated_at
        FROM order_items;

        -- Drop the original table
        DROP TABLE order_items;

        -- Rename the temporary table to the original name
        ALTER TABLE order_items_temp RENAME TO order_items;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);",
        kind: MigrationKind::Up,
    }
}

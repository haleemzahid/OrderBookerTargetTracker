use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 26,
        description: "create_customer_credit_triggers",
        sql: "
            -- Trigger to update customer outstanding balance when credit transaction is added
            CREATE TRIGGER update_customer_balance_on_credit_transaction
            AFTER INSERT ON customer_credit_transactions
            BEGIN
                UPDATE customers 
                SET 
                    current_outstanding = NEW.balance_after,
                    last_payment_date = CASE 
                        WHEN NEW.transaction_type = 'PAYMENT' THEN NEW.transaction_date 
                        ELSE last_payment_date 
                    END,
                    total_orders_count = CASE 
                        WHEN NEW.transaction_type = 'SALE' THEN total_orders_count + 1 
                        ELSE total_orders_count 
                    END,
                    total_lifetime_value = total_lifetime_value + CASE 
                        WHEN NEW.transaction_type = 'SALE' THEN NEW.amount 
                        WHEN NEW.transaction_type = 'PAYMENT' THEN 0
                        ELSE 0 
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.customer_id;
            END;

            -- Trigger to update credit status based on outstanding amount and behavior
            CREATE TRIGGER update_customer_credit_status
            AFTER UPDATE OF current_outstanding ON customers
            WHEN OLD.current_outstanding != NEW.current_outstanding
            BEGIN
                UPDATE customers 
                SET 
                    credit_status = CASE
                        -- Check if customer is blocked due to overdue payments
                        WHEN NEW.current_outstanding > 0 AND 
                             (julianday('now') - julianday(NEW.last_payment_date)) > (NEW.credit_days + 30) 
                             THEN 'blocked'
                        -- Check if customer exceeds credit limit significantly
                        WHEN NEW.current_outstanding > NEW.credit_limit * 1.1 THEN 'blocked'
                        -- Warning when close to credit limit or payment behavior is poor
                        WHEN NEW.current_outstanding > NEW.credit_limit * 0.9 OR NEW.payment_behavior = 'problematic' 
                             THEN 'warning'
                        -- Cash only for customers with very poor payment history
                        WHEN NEW.payment_behavior = 'problematic' AND NEW.average_delay_days > 60 
                             THEN 'cash_only'
                        -- Good status for customers within limits and good behavior
                        ELSE 'good'
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END;

            -- Trigger to update payment behavior based on payment patterns
            CREATE TRIGGER update_payment_behavior_on_payment
            AFTER INSERT ON customer_credit_transactions
            WHEN NEW.transaction_type = 'PAYMENT'
            BEGIN
                UPDATE customers
                SET 
                    payment_behavior = CASE
                        -- Excellent: Early payments or overpayments
                        WHEN NEW.transaction_date < (
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        ) THEN 'excellent'
                        -- Good: On-time payments (within grace period)
                        WHEN julianday(NEW.transaction_date) - julianday((
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        )) <= 5 THEN 'good'
                        -- Delayed: Late but within 30 days
                        WHEN julianday(NEW.transaction_date) - julianday((
                            SELECT MIN(due_date) 
                            FROM customer_credit_transactions 
                            WHERE customer_id = NEW.customer_id 
                              AND transaction_type = 'SALE' 
                              AND balance_after > 0
                        )) <= 30 THEN 'delayed'
                        -- Problematic: Very late payments
                        ELSE 'problematic'
                    END,
                    average_delay_days = (
                        SELECT AVG(julianday(t1.transaction_date) - julianday(t2.due_date))
                        FROM customer_credit_transactions t1
                        JOIN customer_credit_transactions t2 ON t1.customer_id = t2.customer_id
                        WHERE t1.customer_id = NEW.customer_id
                          AND t1.transaction_type = 'PAYMENT'
                          AND t2.transaction_type = 'SALE'
                          AND t1.transaction_date >= t2.transaction_date
                          AND t2.due_date IS NOT NULL
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.customer_id;
            END;

            -- Trigger to create collection alerts for overdue payments
            CREATE TRIGGER create_collection_alert_on_overdue
            AFTER INSERT ON customer_credit_transactions
            WHEN NEW.transaction_type = 'SALE' AND NEW.due_date < date('now')
            BEGIN
                INSERT INTO collection_alerts (
                    id, customer_id, alert_type, priority, amount_involved,
                    days_overdue, overdue_amount, suggested_action, status,
                    assigned_to, next_action_date
                )
                SELECT 
                    hex(randomblob(16)),
                    NEW.customer_id,
                    'overdue',
                    CASE 
                        WHEN julianday('now') - julianday(NEW.due_date) > 60 THEN 'urgent'
                        WHEN julianday('now') - julianday(NEW.due_date) > 30 THEN 'high'
                        WHEN julianday('now') - julianday(NEW.due_date) > 15 THEN 'medium'
                        ELSE 'low'
                    END,
                    NEW.amount,
                    julianday('now') - julianday(NEW.due_date),
                    NEW.balance_after,
                    CASE 
                        WHEN c.preferred_contact_method = 'visit' THEN 'visit'
                        WHEN c.preferred_contact_method = 'whatsapp' THEN 'whatsapp'
                        ELSE 'call'
                    END,
                    'open',
                    c.collection_agent,
                    date('now', '+1 day')
                FROM customers c
                WHERE c.id = NEW.customer_id;
            END;

            -- Trigger to auto-escalate collection alerts
            CREATE TRIGGER auto_escalate_collection_alerts
            AFTER UPDATE OF next_action_date ON collection_alerts
            WHEN NEW.next_action_date < date('now') AND NEW.status = 'open'
            BEGIN
                UPDATE collection_alerts
                SET 
                    escalation_level = MIN(escalation_level + 1, 5),
                    priority = CASE 
                        WHEN escalation_level >= 4 THEN 'urgent'
                        WHEN escalation_level >= 3 THEN 'high'
                        ELSE priority
                    END,
                    next_action_date = date('now', '+' || 
                        CASE escalation_level
                            WHEN 1 THEN '3 days'
                            WHEN 2 THEN '2 days' 
                            WHEN 3 THEN '1 day'
                            ELSE '1 day'
                        END
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END;
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

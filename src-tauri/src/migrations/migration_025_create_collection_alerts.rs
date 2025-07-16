use tauri_plugin_sql::Migration;

pub fn migration() -> Migration {
    Migration {
        version: 25,
        description: "create_collection_alerts",
        sql: "
            -- Create collection alerts table for automated payment collection management
            CREATE TABLE collection_alerts (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                
                -- Alert Classification
                alert_type TEXT NOT NULL CHECK (alert_type IN ('overdue', 'approaching_due', 'credit_limit', 'no_contact', 'behavior_change')),
                priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                
                -- Financial Context
                amount_involved REAL NOT NULL CHECK (amount_involved > 0),
                days_overdue INTEGER DEFAULT 0,
                overdue_amount REAL DEFAULT 0,
                
                -- Communication Tracking
                last_contact_date DATE,
                contact_attempts INTEGER DEFAULT 0,
                excuse_count INTEGER DEFAULT 0,
                last_excuse TEXT,
                contact_response TEXT CHECK (contact_response IN ('positive', 'neutral', 'negative', 'hostile', 'no_response')),
                
                -- Pakistani Business and Cultural Context
                relationship_consideration TEXT CHECK (relationship_consideration IN ('handle_gently', 'family_friend', 'strict_business', 'respect_required', 'elder_customer')),
                cultural_notes TEXT, -- 'avoid_during_ramadan', 'festival_season', 'wedding_in_family', etc.
                language_preference TEXT DEFAULT 'urdu' CHECK (language_preference IN ('urdu', 'english', 'punjabi', 'sindhi', 'pashto')),
                
                -- Action Management
                assigned_to TEXT, -- Which order booker is responsible
                escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
                suggested_action TEXT CHECK (suggested_action IN ('call', 'whatsapp', 'visit', 'sms', 'email', 'stop_credit', 'legal_notice')),
                best_contact_time TEXT,
                preferred_contact_method TEXT,
                
                -- Visit Planning
                last_visit_date DATE,
                next_planned_visit DATE,
                visit_result TEXT,
                distance_from_office REAL, -- For route planning
                
                -- Resolution and Follow-up
                status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
                resolution_notes TEXT,
                resolved_date DATE,
                resolved_by TEXT,
                resolution_amount REAL,
                
                -- Automation and Scheduling
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                next_action_date DATE,
                alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
                auto_escalate_after_days INTEGER DEFAULT 7,
                
                -- Business Intelligence
                collection_difficulty_score INTEGER DEFAULT 1 CHECK (collection_difficulty_score BETWEEN 1 AND 10),
                customer_cooperation_level TEXT DEFAULT 'unknown' CHECK (customer_cooperation_level IN ('excellent', 'good', 'fair', 'poor', 'hostile', 'unknown'))
            );

            -- Indexes for performance and reporting
            CREATE INDEX idx_alerts_customer ON collection_alerts(customer_id);
            CREATE INDEX idx_alerts_status ON collection_alerts(status);
            CREATE INDEX idx_alerts_priority ON collection_alerts(priority);
            CREATE INDEX idx_alerts_assigned ON collection_alerts(assigned_to);
            CREATE INDEX idx_alerts_next_action ON collection_alerts(next_action_date);
            CREATE INDEX idx_alerts_type ON collection_alerts(alert_type);
            CREATE INDEX idx_alerts_escalation ON collection_alerts(escalation_level);
            CREATE INDEX idx_alerts_amount ON collection_alerts(amount_involved);
            CREATE INDEX idx_alerts_overdue_days ON collection_alerts(days_overdue);
        ",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }
}

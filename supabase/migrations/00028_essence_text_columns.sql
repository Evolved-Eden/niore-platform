-- Migration 00028: Fix agent_id columns that were incorrectly created as UUID type
-- Agent IDs in this system are TEXT values like "AGT-215", so any column storing them
-- must be TEXT, not UUID.
--
-- Also ensures essence_intelligence.linked_swarm_id is TEXT (not UUID).
-- Uses IF EXISTS / IF NOT EXISTS throughout for idempotency.

-- ──────────────────────────────────────────────
-- Table: client_essence_actions
-- ──────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'client_essence_actions'
    ) THEN
        -- Table exists. Check if agent_id column is present and is UUID, then alter.
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'client_essence_actions'
              AND column_name = 'agent_id'
              AND data_type = 'uuid'
        ) THEN
            ALTER TABLE client_essence_actions
                ALTER COLUMN agent_id TYPE TEXT;
        END IF;
    ELSE
        -- Table does not exist — create it with all columns.
        CREATE TABLE client_essence_actions (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id        TEXT NOT NULL,
            essence_item_id UUID NOT NULL REFERENCES essence_intelligence(id) ON DELETE CASCADE,
            action          TEXT NOT NULL,
            input_data      JSONB,
            output_data     JSONB,
            token_count     INTEGER,
            duration_ms     INTEGER,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- ──────────────────────────────────────────────
-- Table: essence_intelligence
-- ──────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'essence_intelligence'
    ) THEN
        -- Table exists.
        -- Ensure linked_agent_id is TEXT (alter if UUID, add if missing).
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'essence_intelligence'
              AND column_name = 'linked_agent_id'
              AND data_type = 'uuid'
        ) THEN
            ALTER TABLE essence_intelligence
                ALTER COLUMN linked_agent_id TYPE TEXT;
        ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'essence_intelligence'
              AND column_name = 'linked_agent_id'
        ) THEN
            ALTER TABLE essence_intelligence
                ADD COLUMN linked_agent_id TEXT;
        END IF;

        -- Ensure linked_swarm_id is TEXT (alter if UUID).
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'essence_intelligence'
              AND column_name = 'linked_swarm_id'
              AND data_type = 'uuid'
        ) THEN
            ALTER TABLE essence_intelligence
                ALTER COLUMN linked_swarm_id TYPE TEXT;
        END IF;
    END IF;
END $$;

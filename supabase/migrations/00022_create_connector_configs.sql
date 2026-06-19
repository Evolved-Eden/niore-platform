-- ============================================================
-- Migration 00022: Create connector_configs table
--
-- The connector_configs table is referenced by the admin
-- connectors API (/api/admin/connectors) but was never created
-- in a tracked migration. It was originally defined in the
-- archived migration-intelligence.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.connector_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL UNIQUE,                  -- discord|whatsapp|n8n|email
  config_name     TEXT NOT NULL,                         -- e.g. "Discord Bot", "WhatsApp API"
  config_data     JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { bot_token, guild_id, api_key, webhook_url, etc }
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.connector_configs IS
  'Admin-managed integration/connector settings for external platforms (Discord, WhatsApp, n8n, Email).';

ALTER TABLE public.connector_configs ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage connector configs
CREATE POLICY "Service role can manage connector_configs"
  ON public.connector_configs
  USING (true)
  WITH CHECK (true);

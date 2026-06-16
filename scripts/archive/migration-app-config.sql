-- App Configuration table for admin-managed settings
-- Allows API keys and configuration to be managed via admin panel
-- instead of requiring .env file changes.

CREATE TABLE IF NOT EXISTS app_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL DEFAULT '',
  value_type    TEXT NOT NULL DEFAULT 'string',  -- string|number|boolean|json
  category      TEXT NOT NULL DEFAULT 'general',  -- ai|n8n|stripe|connector|general
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default config entries
INSERT INTO app_config (key, value, value_type, category, description) VALUES
  ('ESSENCE_AI_PROVIDER', 'openai', 'string', 'ai', 'AI provider for essence generation (openai|anthropic|local|disabled)'),
  ('ESSENCE_AI_MODEL', 'gpt-4o-mini', 'string', 'ai', 'Model name for essence AI generation'),
  ('OPENAI_API_KEY', '', 'string', 'ai', 'OpenAI API key for Zuri chat, blueprint, and essence'),
  ('ANTHROPIC_API_KEY', '', 'string', 'ai', 'Anthropic API key as alternative AI provider'),
  ('N8N_MCP_TOKEN', '', 'string', 'n8n', 'n8n MCP server token for workflow automation'),
  ('N8N_PUBLIC_API_KEY', '', 'string', 'n8n', 'n8n public API key for REST API access'),
  ('SITE_NAME', 'Evolved Eden', 'string', 'general', 'Site name used in emails and branding'),
  ('DEFAULT_FROM_EMAIL', 'zuri@evolvededen.ai', 'string', 'general', 'Default from address for system emails'),
  ('DEFAULT_FROM_NAME', 'Zuri', 'string', 'general', 'Default from name for system emails'),
  ('SYSTEM_NOTIFICATIONS_ENABLED', 'true', 'boolean', 'general', 'Enable system-wide email notifications')
ON CONFLICT (key) DO NOTHING;

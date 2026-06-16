-- ── Client Notification Preferences ─────────────────────────────
-- Persists per-client notification toggle state from the connectors page.

CREATE TABLE IF NOT EXISTS client_notification_prefs (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  discord_briefings BOOLEAN NOT NULL DEFAULT true,
  whatsapp_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_prefs_updated_at ON client_notification_prefs;
CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON client_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION update_notification_prefs_updated_at();

COMMENT ON TABLE client_notification_prefs IS 'Per-client notification preferences for Discord briefings, WhatsApp reminders, and daily digests';
COMMENT ON COLUMN client_notification_prefs.discord_briefings IS 'Receive essence briefings on Discord';
COMMENT ON COLUMN client_notification_prefs.whatsapp_reminders IS 'Receive consultation reminders on WhatsApp';
COMMENT ON COLUMN client_notification_prefs.daily_digest IS 'End-of-day intelligence digest';

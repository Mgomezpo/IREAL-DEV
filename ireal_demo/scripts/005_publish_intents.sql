-- Publish intents history (dry-run friendly)

CREATE TABLE IF NOT EXISTS publish_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL,
  run_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL,
  error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publish_intents_calendar_id
  ON publish_intents (calendar_id);

CREATE INDEX IF NOT EXISTS idx_publish_intents_user_id
  ON publish_intents (user_id);

CREATE INDEX IF NOT EXISTS idx_publish_intents_run_id
  ON publish_intents (run_id);

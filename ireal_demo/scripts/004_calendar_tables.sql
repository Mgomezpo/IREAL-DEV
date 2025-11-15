-- Calendar run history and entries

CREATE TABLE IF NOT EXISTS calendar_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'timeout', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tokens INTEGER,
  model TEXT,
  latency_ms INTEGER,
  piece_count INTEGER NOT NULL DEFAULT 0,
  diff JSONB,
  constraints JSONB,
  cadence TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES calendar_runs(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  entry_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_runs_calendar_id
  ON calendar_runs (calendar_id);

CREATE INDEX IF NOT EXISTS idx_calendar_runs_user_id
  ON calendar_runs (user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_calendar_id
  ON calendar_entries (calendar_id);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_run_id
  ON calendar_entries (run_id);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_entry_key
  ON calendar_entries (entry_key);

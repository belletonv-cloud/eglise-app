-- Rate limiter storage (persistent across Workers instances)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  row_key TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  path TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON api_rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);

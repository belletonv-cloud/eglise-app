-- Create runtime tables previously created at runtime in src/index.js
CREATE TABLE IF NOT EXISTS email_oneclicks (
  id INTEGER PRIMARY KEY,
  token TEXT UNIQUE,
  payload_json TEXT,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME
);

CREATE TABLE IF NOT EXISTS invitation_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES members(id),
  token TEXT UNIQUE,
  expires_at TEXT,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_firebase (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER UNIQUE REFERENCES members(id),
  firebase_uid TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- webhooks & webhook_logs already partially present in migrations; ensure full definition
CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  events TEXT,
  secret TEXT,
  label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER,
  event TEXT,
  status INTEGER,
  response TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 6,
  next_retry_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- api_logs already exists in migrations/007_logs.sql, keep duplicate-safe creation

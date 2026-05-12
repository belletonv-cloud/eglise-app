ALTER TABLE webhook_logs ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE webhook_logs ADD COLUMN next_retry_at TEXT;
ALTER TABLE webhook_logs ADD COLUMN max_retries INTEGER DEFAULT 6;

-- Add indexes and unique constraints to improve performance and integrity
-- Safe, idempotent statements

-- Indexes for webhook logs: lookup by webhook_id and retry scheduling
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry_at ON webhook_logs(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Indexes for webhooks: lookup by secret (used for incoming webhooks)
CREATE INDEX IF NOT EXISTS idx_webhooks_secret ON webhooks(secret);

-- Ensure email_oneclicks token uniqueness exists (table declares UNIQUE but create index is safe)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_oneclicks_token ON email_oneclicks(token);

-- Invitation tokens: ensure lookup by token is fast
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_tokens_token ON invitation_tokens(token);

-- Member firebase lookup/indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_firebase_firebase_uid ON member_firebase(firebase_uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_firebase_member_id ON member_firebase(member_id);

-- Misc: webhooks URL lookup
CREATE INDEX IF NOT EXISTS idx_webhooks_url ON webhooks(url);

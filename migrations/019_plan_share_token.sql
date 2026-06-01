-- Migration 019: public share token on plans
-- Allows generating a read-only shareable link for a plan
ALTER TABLE plans ADD COLUMN share_token TEXT DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_share_token ON plans(share_token) WHERE share_token IS NOT NULL;

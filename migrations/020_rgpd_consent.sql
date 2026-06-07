-- Migration 020: RGPD consent and data tracking for members
ALTER TABLE members ADD COLUMN consent_data_sharing INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN consent_photo INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN consent_communication INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN data_origin TEXT DEFAULT 'manual';
ALTER TABLE members ADD COLUMN gdpr_data_exported_at TEXT;
ALTER TABLE members ADD COLUMN gdpr_erased_at TEXT;
CREATE INDEX IF NOT EXISTS idx_members_data_origin ON members(data_origin);

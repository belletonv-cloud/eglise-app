-- PCO Sync - Ajout des colonnes de tracking PCO + tables de synchronisation
-- Safe migration: run inside a transaction
-- 1. PCO IDs & timestamps sur toutes les tables syncées
ALTER TABLE members ADD COLUMN pco_id TEXT;
ALTER TABLE members ADD COLUMN pco_updated_at TEXT;
ALTER TABLE members ADD COLUMN pco_deleted_at TEXT;

ALTER TABLE teams ADD COLUMN pco_id TEXT;
ALTER TABLE teams ADD COLUMN pco_updated_at TEXT;
ALTER TABLE teams ADD COLUMN pco_deleted_at TEXT;

ALTER TABLE service_types ADD COLUMN pco_id TEXT;
ALTER TABLE service_types ADD COLUMN pco_updated_at TEXT;

ALTER TABLE plans ADD COLUMN pco_id TEXT;
ALTER TABLE plans ADD COLUMN pco_updated_at TEXT;
ALTER TABLE plans ADD COLUMN pco_deleted_at TEXT;

ALTER TABLE plan_items ADD COLUMN pco_id TEXT;
ALTER TABLE plan_items ADD COLUMN pco_updated_at TEXT;

ALTER TABLE songs ADD COLUMN pco_id TEXT;
ALTER TABLE songs ADD COLUMN pco_updated_at TEXT;
ALTER TABLE songs ADD COLUMN pco_deleted_at TEXT;

ALTER TABLE arrangements ADD COLUMN pco_id TEXT;
ALTER TABLE arrangements ADD COLUMN pco_updated_at TEXT;
ALTER TABLE arrangements ADD COLUMN pco_deleted_at TEXT;

ALTER TABLE scheduled_people ADD COLUMN pco_id TEXT;
ALTER TABLE scheduled_people ADD COLUMN pco_updated_at TEXT;

-- 2. Index pour les lookups par pco_id
CREATE INDEX IF NOT EXISTS idx_members_pco_id ON members(pco_id);
CREATE INDEX IF NOT EXISTS idx_teams_pco_id ON teams(pco_id);
CREATE INDEX IF NOT EXISTS idx_service_types_pco_id ON service_types(pco_id);
CREATE INDEX IF NOT EXISTS idx_plans_pco_id ON plans(pco_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_pco_id ON plan_items(pco_id);
CREATE INDEX IF NOT EXISTS idx_songs_pco_id ON songs(pco_id);
CREATE INDEX IF NOT EXISTS idx_arrangements_pco_id ON arrangements(pco_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_people_pco_id ON scheduled_people(pco_id);

-- 3. Table de verrouillage (mutex anti-sync parallèle)
CREATE TABLE IF NOT EXISTS sync_locks (
    lock_name TEXT PRIMARY KEY,
    locked_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);

-- 4. État de la sync (dernière synchro, etc.)
CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Note: D1 remote manages transactions; explicit BEGIN/COMMIT removed for remote execution

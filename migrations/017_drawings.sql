-- Migration 017: arrangement_drawings (canvas annotations for Music Stand)
-- One drawing per member per arrangement, stored as JSON paths

CREATE TABLE IF NOT EXISTS arrangement_drawings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    arrangement_id INTEGER NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    paths TEXT NOT NULL DEFAULT '[]',   -- JSON array of stroke objects
    is_shared INTEGER DEFAULT 0,         -- 1 = visible to all team members
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(arrangement_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_drawings_arrangement ON arrangement_drawings(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_drawings_member ON arrangement_drawings(member_id);

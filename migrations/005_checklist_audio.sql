-- Migration: add checklist, audio, directory features
-- Run with: wrangler d1 execute eglise-db --file=migrations/005_checklist_audio.sql

-- Checklist par poste (template par service_type)
CREATE TABLE IF NOT EXISTS checklist_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type_id INTEGER REFERENCES service_types(id),
    position TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checklist_template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER REFERENCES checklist_templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plan_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id),
    position TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    label TEXT,
    done_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Add audio columns to plans if not exist
ALTER TABLE plans ADD COLUMN audio_url TEXT;
ALTER TABLE plans ADD COLUMN audio_title TEXT;

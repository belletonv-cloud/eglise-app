-- Migration 011 : Tables de segmentation audio (audio-splitter integration)

CREATE TABLE IF NOT EXISTS plan_audio_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    segment_index INTEGER NOT NULL,
    start_seconds REAL NOT NULL,
    end_seconds REAL NOT NULL,
    segment_type TEXT NOT NULL,
    title TEXT,
    text TEXT,
    confidence REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_audio_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    song_index INTEGER NOT NULL,
    title TEXT,
    start_seconds REAL NOT NULL,
    end_seconds REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audio_segments_plan ON plan_audio_segments(plan_id);
CREATE INDEX IF NOT EXISTS idx_audio_songs_plan ON plan_audio_songs(plan_id);

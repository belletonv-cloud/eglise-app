CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    max_votes INTEGER DEFAULT 1,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id),
    poll_option_id INTEGER REFERENCES poll_options(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(poll_id, member_id, poll_option_id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'announcement',
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES members(id),
    plan_id INTEGER REFERENCES plans(id),
    created_at TEXT DEFAULT (datetime('now'))
);

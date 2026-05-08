-- Membres (People)
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    birth_date TEXT,
    membership_type TEXT DEFAULT 'guest', -- member, inactive, guest
    baptism_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Équipes (Teams)
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    service_type TEXT, -- Traditional, Contemporary, Youth
    created_at TEXT DEFAULT (datetime('now'))
);

-- Membres dans les équipes
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    position TEXT, -- leader, musician, tech, etc.
    UNIQUE(team_id, member_id)
);

-- Types de services (Service Types)
CREATE TABLE service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- Traditional, Contemporary, Youth
    recurrence TEXT, -- weekly, monthly, custom
    created_at TEXT DEFAULT (datetime('now'))
);

-- Plans (services planifiés)
CREATE TABLE plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type_id INTEGER REFERENCES service_types(id),
    date TEXT NOT NULL,
    time TEXT,
    theme TEXT,
    notes TEXT,
    status TEXT DEFAULT 'planned', -- planned, completed, cancelled
    created_at TEXT DEFAULT (datetime('now'))
);

-- Éléments de l'ordre du culte (Items)
CREATE TABLE plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- song, header, media, announcement
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER,
    length_minutes INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Chants (Songs)
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    ccli_number TEXT,
    copyright TEXT,
    themes TEXT, -- comma-separated
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Arrangements de chants
CREATE TABLE arrangements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT, -- Original key
    tempo INTEGER,
    chord_chart TEXT, -- ChordPro format
    created_at TEXT DEFAULT (datetime('now'))
);

-- Liaison plan_items ↔ arrangements (chant dans un plan)
CREATE TABLE plan_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_item_id INTEGER REFERENCES plan_items(id) ON DELETE CASCADE,
    arrangement_id INTEGER REFERENCES arrangements(id),
    transposed_key TEXT, -- Clé transposée pour ce plan
    UNIQUE(plan_item_id)
);

-- Bénévoles planifiés (scheduled people)
CREATE TABLE scheduled_people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id),
    position TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, declined
    UNIQUE(plan_id, member_id, team_id)
);

-- Fichiers joints (attachments)
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- song, arrangement, plan, member
    entity_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- pdf, mp3, image
    created_at TEXT DEFAULT (datetime('now'))
);

-- Préférences bénévoles (disponibilités)
CREATE TABLE volunteer_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    unavailable_dates TEXT, -- JSON array of dates
    max_services_per_month INTEGER DEFAULT 4,
    notes TEXT
);

-- Présences (check-in)
CREATE TABLE attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'present', -- present, late, excused
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Index pour les performances
CREATE INDEX idx_attendances_plan ON attendances(plan_id);
CREATE INDEX idx_attendances_member ON attendances(member_id);

-- Groupes de maisons (House Groups)
CREATE TABLE house_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    leader_id INTEGER REFERENCES members(id),
    meeting_day TEXT, -- Monday, Tuesday, etc.
    meeting_time TEXT,
    location TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Membres dans les groupes de maisons
CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER REFERENCES house_groups(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- leader, co-leader, member
    join_date TEXT DEFAULT (datetime('now')),
    UNIQUE(group_id, member_id)
);

-- Réunions de groupe
CREATE TABLE group_meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER REFERENCES house_groups(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Index pour les performances
CREATE INDEX idx_team_members_member ON team_members(member_id);
CREATE INDEX idx_scheduled_people_plan ON scheduled_people(plan_id);
CREATE INDEX idx_plan_items_plan ON plan_items(plan_id);
CREATE INDEX idx_plans_date ON plans(date);
CREATE INDEX idx_arrangements_song ON arrangements(song_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_member ON group_members(member_id);
CREATE INDEX idx_group_meetings_group ON group_meetings(group_id);

-- Modèles d'emails (Email Templates)
CREATE TABLE email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL, -- HTML content with {{variables}}
    variables TEXT, -- JSON array of available variables
    created_at TEXT DEFAULT (datetime('now'))
);

-- Logs d'emails envoyés
CREATE TABLE email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER REFERENCES email_templates(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_member_id INTEGER REFERENCES members(id),
    status TEXT DEFAULT 'sent', -- sent, failed, pending
    error_message TEXT,
    sent_at TEXT DEFAULT (datetime('now'))
);

-- Préférences de communication des membres
CREATE TABLE communication_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    receive_emails BOOLEAN DEFAULT 1,
    receive_sms BOOLEAN DEFAULT 1,
    email_types TEXT, -- JSON array: newsletters, announcements, etc.
    UNIQUE(member_id)
);

-- Index
CREATE INDEX idx_email_logs_template ON email_logs(template_id);
CREATE INDEX idx_email_logs_member ON email_logs(recipient_member_id);
CREATE INDEX idx_comm_prefs_member ON communication_preferences(member_id);

-- Tokens de notification push (FCM)
CREATE TABLE IF NOT EXISTS notification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT DEFAULT 'web',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(member_id, token)
);

CREATE INDEX idx_notification_tokens_member ON notification_tokens(member_id);

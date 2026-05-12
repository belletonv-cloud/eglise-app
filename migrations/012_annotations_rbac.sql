-- Annotations partagées/privées sur les grilles d'accords
CREATE TABLE IF NOT EXISTS arrangement_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arrangement_id INTEGER NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_shared INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_arr_annotations_arrangement ON arrangement_annotations(arrangement_id);
CREATE INDEX idx_arr_annotations_member ON arrangement_annotations(member_id);

-- Permissions fines (RBAC) par ressource (plan, chant, etc.)
CREATE TABLE IF NOT EXISTS resource_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'plan', 'song', 'team', 'arrangement'
  resource_id INTEGER NOT NULL,
  permission TEXT NOT NULL, -- 'view', 'edit', 'schedule', 'admin'
  granted INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_res_perm_member ON resource_permissions(member_id);
CREATE INDEX idx_res_perm_resource ON resource_permissions(resource_type, resource_id);

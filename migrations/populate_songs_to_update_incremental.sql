-- Populate songs_to_update with songs updated since last sync (incremental)
INSERT OR REPLACE INTO sync_state (key, value) VALUES (
  'songs_to_update',
  COALESCE((
    SELECT json_group_array(pco_id)
    FROM songs
    WHERE pco_id IS NOT NULL
      AND pco_updated_at > (SELECT value FROM sync_state WHERE key = 'pco_last_sync_at')
  ), '[]')
);
INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'pass2');

SELECT COUNT(*) as c FROM sync_locks;
SELECT COUNT(*) as c FROM sync_state;
SELECT * FROM sync_state WHERE key='pco_last_sync_at';

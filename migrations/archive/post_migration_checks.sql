PRAGMA table_info('plans');
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_locks','sync_state');
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%_pco_id';

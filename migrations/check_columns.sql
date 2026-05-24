SELECT 'members' AS tbl, (SELECT COUNT(*) FROM pragma_table_info('members') WHERE name='pco_id') AS has_pco_id;
SELECT 'plans' AS tbl, (SELECT COUNT(*) FROM pragma_table_info('plans') WHERE name='pco_id') AS has_pco_id;
SELECT 'songs' AS tbl, (SELECT COUNT(*) FROM pragma_table_info('songs') WHERE name='pco_id') AS has_pco_id;
SELECT 'arrangements' AS tbl, (SELECT COUNT(*) FROM pragma_table_info('arrangements') WHERE name='pco_id') AS has_pco_id;
SELECT 'scheduled_people' AS tbl, (SELECT COUNT(*) FROM pragma_table_info('scheduled_people') WHERE name='pco_id') AS has_pco_id;

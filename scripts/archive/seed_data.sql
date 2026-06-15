-- ============================================================
-- SEED DATA — Église App
-- Données d'exemple pour toutes les sections
-- ============================================================

-- ------------------------------------------------------------
-- SERVICE TYPES
-- ------------------------------------------------------------
INSERT OR IGNORE INTO service_types (id, name, recurrence) VALUES (1, 'Culte du dimanche', 'weekly');
INSERT OR IGNORE INTO service_types (id, name, recurrence) VALUES (2, 'Groupe de jeunesse', 'weekly');
INSERT OR IGNORE INTO service_types (id, name, recurrence) VALUES (3, 'Réunion de prière', 'weekly');

-- ------------------------------------------------------------
-- MEMBERS
-- ------------------------------------------------------------
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (1, 'Pierre', 'Dubois', 'pierre.dubois@email.fr', '0612345678', '1985-03-15', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (2, 'Marie', 'Laurent', 'marie.laurent@email.fr', '0623456789', '1990-07-22', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (3, 'Jean', 'Petit', 'jean.petit@email.fr', '0634567890', '1982-11-08', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (4, 'Sophie', 'Martin', 'sophie.martin@email.fr', '0645678901', '1995-05-30', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (5, 'Luc', 'Bernard', 'luc.bernard@email.fr', '0656789012', '1988-09-12', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (6, 'Anne', 'Richard', 'anne.richard@email.fr', '0667890123', '1992-01-25', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (7, 'Thomas', 'Moreau', 'thomas.moreau@email.fr', '0678901234', '1980-06-18', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (8, 'Emma', 'Leroy', 'emma.leroy@email.fr', '0689012345', '1998-12-03', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (9, 'David', 'Simon', 'david.simon@email.fr', '0690123456', '1987-04-20', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (10, 'Claire', 'Michel', 'claire.michel@email.fr', '0601234567', '1993-08-14', 'member');
INSERT OR IGNORE INTO members (id, first_name, last_name, email, phone, birth_date, membership_type) VALUES
  (11, 'Nicolas', 'Garcia', 'nicolas.garcia@email.fr', '0611112233', '1986-02-28', 'member');

-- ------------------------------------------------------------
-- TEAMS
-- ------------------------------------------------------------
INSERT OR IGNORE INTO teams (id, name, description, service_type) VALUES
  (1, 'Louange', 'Équipe de louange et musique', 'Contemporary');
INSERT OR IGNORE INTO teams (id, name, description, service_type) VALUES
  (2, 'Son', 'Équipe technique son', 'Contemporary');
INSERT OR IGNORE INTO teams (id, name, description, service_type) VALUES
  (3, 'Lumière', 'Équipe technique lumière et vidéo', 'Contemporary');
INSERT OR IGNORE INTO teams (id, name, description, service_type) VALUES
  (4, 'Accueil', 'Équipe d''accueil et café', 'Traditional');

-- team_members
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (1, 1, 'leader');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (1, 5, 'musicien');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (1, 6, 'chanteur');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (1, 9, 'musicien');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (2, 3, 'leader');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (2, 8, 'technicien');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (3, 7, 'leader');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (3, 11, 'technicien');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (4, 2, 'leader');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (4, 4, 'accueil');
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (4, 10, 'accueil');

-- ------------------------------------------------------------
-- HOUSE GROUPS
-- ------------------------------------------------------------
INSERT OR IGNORE INTO house_groups (id, name, description, leader_id, meeting_day, meeting_time, location) VALUES
  (1, 'Groupe Jean & Marie', 'Groupe de maison du quartier nord', 1, 'Wednesday', '19:30', '12 Rue des Lilas, 75000 Paris');
INSERT OR IGNORE INTO house_groups (id, name, description, leader_id, meeting_day, meeting_time, location) VALUES
  (2, 'Jeunes Ensemble', 'Groupe de jeunes adultes (18-30 ans)', 4, 'Friday', '20:00', '8 Avenue de la République, 75000 Paris');

-- group_members
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (1, 1, 'leader');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (1, 2, 'co-leader');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (1, 3, 'member');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (1, 5, 'member');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (2, 4, 'leader');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (2, 8, 'co-leader');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (2, 9, 'member');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (2, 10, 'member');
INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (2, 11, 'member');

-- group_meetings
INSERT OR IGNORE INTO group_meetings (group_id, date, notes) VALUES (1, date('now', '-7 days'), 'Étude de Romains 8. Très bonne soirée');
INSERT OR IGNORE INTO group_meetings (group_id, date, notes) VALUES (1, date('now', '-14 days'), 'Partage sur la prière');
INSERT OR IGNORE INTO group_meetings (group_id, date, notes) VALUES (2, date('now', '-5 days'), 'Soirée jeux et louange');

-- ------------------------------------------------------------
-- PLANS (services)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO plans (id, service_type_id, date, time, theme, notes, status) VALUES
  (1, 1, date('now', '+7 days'), '10:00', 'La foi qui déplace des montagnes', 'Prédication de Pierre', 'planned');
INSERT OR IGNORE INTO plans (id, service_type_id, date, time, theme, notes, status) VALUES
  (2, 1, date('now'), '10:00', 'L''espérance chrétienne', 'Culte du jour', 'planned');
INSERT OR IGNORE INTO plans (id, service_type_id, date, time, theme, notes, status) VALUES
  (3, 2, date('now', '+3 days'), '18:00', 'Jeunes en mission', NULL, 'planned');

-- ------------------------------------------------------------
-- PLAN ITEMS (order of service)
-- ------------------------------------------------------------
-- Plan 1 (dimanche +7)
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (1, 1, 'header', 'Accueil', 'Accueil et annonces', 1, 5);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (2, 1, 'song', 'A CELUI QUI NOUS AIME', 'Chant d''entrée', 2, 5);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (3, 1, 'song', 'BENI SOIT LE NOM DU SEIGNEUR', 'Louange', 3, 6);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (4, 1, 'header', 'Prédication', 'Message du jour', 4, 30);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (5, 1, 'header', 'Offrandes', 'Collecte et prière', 5, 10);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (6, 1, 'song', 'A L''AGNEAU DE DIEU', 'Chant final', 6, 5);

-- Plan 2 (aujourd'hui)
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (7, 2, 'header', 'Accueil', 'Mot d''accueil', 1, 5);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (8, 2, 'song', 'AMOUR EXTRAVAGANT', 'Louange', 2, 6);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (9, 2, 'media', 'Vidéo témoignage', 'Témoignage de Marie', 3, 8);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (10, 2, 'header', 'Message', NULL, 4, 25);

-- Plan 3 (jeunesse)
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (11, 3, 'header', 'Jeux brise-glace', 'Ice breakers', 1, 15);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (12, 3, 'song', 'AU CŒUR DE LA LOUANGE', 'Louange', 2, 10);
INSERT OR IGNORE INTO plan_items (id, plan_id, type, title, description, position, length_minutes) VALUES
  (13, 3, 'header', 'Enseignement', 'Parole du jour', 3, 20);

-- ------------------------------------------------------------
-- PLAN SONGS (liaison plan_items ↔ arrangements)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key)
  SELECT 2, a.id, 'G' FROM arrangements a WHERE a.song_id = (SELECT id FROM songs WHERE title = 'A CELUI QUI NOUS AIME') LIMIT 1;
INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key)
  SELECT 3, a.id, 'D' FROM arrangements a WHERE a.song_id = (SELECT id FROM songs WHERE title = 'BENI SOIT LE NOM DU SEIGNEUR') LIMIT 1;
INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key)
  SELECT 6, a.id, 'C' FROM arrangements a WHERE a.song_id = (SELECT id FROM songs WHERE title = 'A L''AGNEAU DE DIEU') LIMIT 1;
INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key)
  SELECT 8, a.id, 'E' FROM arrangements a WHERE a.song_id = (SELECT id FROM songs WHERE title = 'AMOUR EXTRAVAGANT') LIMIT 1;
INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key)
  SELECT 12, a.id, 'A' FROM arrangements a WHERE a.song_id = (SELECT id FROM songs WHERE title = 'AU CŒUR DE LA LOUANGE') LIMIT 1;

-- ------------------------------------------------------------
-- SCHEDULED PEOPLE (bénévoles planifiés)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (1, 1, 1, 'leader de louange', 'confirmed');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (1, 5, 1, 'guitare', 'confirmed');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (1, 3, 2, 'régie son', 'pending');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (2, 6, 1, 'leader de louange', 'confirmed');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (2, 9, 1, 'clavier', 'confirmed');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (2, 7, 3, 'vidéo', 'pending');
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (2, 4, 4, 'accueil', 'confirmed');

-- ------------------------------------------------------------
-- EMAIL TEMPLATES
-- ------------------------------------------------------------
INSERT OR IGNORE INTO email_templates (id, name, subject, body, variables) VALUES
  (1, 'Rappel de service', 'Rappel: Service du {{date}}', '<h2>Bonjour {{first_name}},</h2><p>Tu es planifié pour le service du <strong>{{date}}</strong> à {{time}}.</p><p>Merci de confirmer ta présence.</p><p>Béni soit le Seigneur !</p>', '["first_name", "date", "time"]');
INSERT OR IGNORE INTO email_templates (id, name, subject, body, variables) VALUES
  (2, 'Bienvenue', 'Bienvenue à l''Église !', '<h2>Bienvenue {{first_name}} !</h2><p>Nous sommes ravis de t''accueillir parmi nous.</p><p>Voici quelques informations pratiques...</p>', '["first_name"]');

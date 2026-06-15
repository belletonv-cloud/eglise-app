-- Seed: créer équipes supplémentaires et planifier sur 8 semaines
-- Ajoute équipes: Multimédia, Ménage, Enfants
INSERT OR IGNORE INTO teams (id, name, description, service_type) VALUES
  (5, 'Multimédia', 'Son + lumière + vidéo', 'Contemporary'),
  (6, 'Ménage', 'Équipe de nettoyage', 'All'),
  (7, 'Enfants', 'Équipe enfants et culte enfants', 'Children');

-- Assigner des membres existants aux nouvelles équipes
-- Multimédia: membres 3 (Jean), 7 (Thomas)
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (5, 3, 'tech'), (5, 7, 'tech');

-- Ménage: membres 4 (Sophie), 10 (Claire)
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (6, 4, 'nettoyage'), (6, 10, 'nettoyage');

-- Enfants: membres 11 (Nicolas), 2 (Marie)
INSERT OR IGNORE INTO team_members (team_id, member_id, position) VALUES (7, 11, 'animateur'), (7, 2, 'animateur');

-- Créer 8 plans (Culte du dimanche) sur les 8 semaines à venir (commençant dans 2 semaines)
INSERT OR IGNORE INTO plans (id, service_type_id, date, time, theme, notes, status) VALUES
  (4, 1, date('now', '+14 days'), '10:00', 'Semaine 1', 'Planification automatique', 'planned'),
  (5, 1, date('now', '+21 days'), '10:00', 'Semaine 2', 'Planification automatique', 'planned'),
  (6, 1, date('now', '+28 days'), '10:00', 'Semaine 3', 'Planification automatique', 'planned'),
  (7, 1, date('now', '+35 days'), '10:00', 'Semaine 4', 'Planification automatique', 'planned'),
  (8, 1, date('now', '+42 days'), '10:00', 'Semaine 5', 'Planification automatique', 'planned'),
  (9, 1, date('now', '+49 days'), '10:00', 'Semaine 6', 'Planification automatique', 'planned'),
  (10,1, date('now', '+56 days'), '10:00', 'Semaine 7', 'Planification automatique', 'planned'),
  (11,1, date('now', '+63 days'), '10:00', 'Semaine 8', 'Planification automatique', 'planned');

-- Pour chaque plan, ajouter des bénévoles pour toutes les équipes (rotation simple)
-- Rappel des équipes et membres (utilisés pour la rotation):
-- Louange (1): [1,5,6,9]
-- Son (2): [3,8]
-- Lumière (3): [7,11]
-- Accueil (4): [2,4,10]
-- Multimédia (5): [3,7]
-- Ménage (6): [4,10]
-- Enfants (7): [11,2]

-- Plan 4 (offset 0)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (4, 1, 1, 'leader de louange', 'confirmed'),
  (4, 5, 1, 'guitare', 'confirmed'),
  (4, 3, 2, 'tech son', 'pending'),
  (4, 7, 3, 'tech lumière', 'pending'),
  (4, 2, 4, 'accueil', 'confirmed'),
  (4, 3, 5, 'multimédia', 'pending'),
  (4, 4, 6, 'ménage', 'confirmed'),
  (4,11, 7, 'animateur enfants', 'confirmed');

-- Plan 5 (offset 1)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (5, 5, 1, 'leader de louange', 'confirmed'),
  (5, 6, 1, 'basse', 'confirmed'),
  (5, 8, 2, 'tech son', 'pending'),
  (5,11, 3, 'tech lumière', 'pending'),
  (5, 4, 4, 'accueil', 'confirmed'),
  (5, 7, 5, 'multimédia', 'pending'),
  (5,10, 6, 'ménage', 'confirmed'),
  (5, 2, 7, 'animateur enfants', 'confirmed');

-- Plan 6 (offset 2)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (6, 6, 1, 'leader de louange', 'confirmed'),
  (6, 9, 1, 'clavier', 'confirmed'),
  (6, 3, 2, 'tech son', 'pending'),
  (6, 7, 3, 'tech lumière', 'pending'),
  (6,10, 4, 'accueil', 'confirmed'),
  (6, 3, 5, 'multimédia', 'pending'),
  (6, 4, 6, 'ménage', 'confirmed'),
  (6,11, 7, 'animateur enfants', 'confirmed');

-- Plan 7 (offset 3)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (7, 9, 1, 'leader de louange', 'confirmed'),
  (7, 1, 1, 'guitare', 'confirmed'),
  (7, 8, 2, 'tech son', 'pending'),
  (7,11, 3, 'tech lumière', 'pending'),
  (7, 2, 4, 'accueil', 'confirmed'),
  (7, 7, 5, 'multimédia', 'pending'),
  (7,10, 6, 'ménage', 'confirmed'),
  (7, 2, 7, 'animateur enfants', 'confirmed');

-- Plan 8 (offset 4)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (8, 1, 1, 'leader de louange', 'confirmed'),
  (8, 5, 1, 'batterie', 'confirmed'),
  (8, 3, 2, 'tech son', 'pending'),
  (8, 7, 3, 'tech lumière', 'pending'),
  (8, 4, 4, 'accueil', 'confirmed'),
  (8, 3, 5, 'multimédia', 'pending'),
  (8, 4, 6, 'ménage', 'confirmed'),
  (8,11, 7, 'animateur enfants', 'confirmed');

-- Plan 9 (offset 5)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (9, 5, 1, 'leader de louange', 'confirmed'),
  (9, 6, 1, 'guitare', 'confirmed'),
  (9, 8, 2, 'tech son', 'pending'),
  (9,11, 3, 'tech lumière', 'pending'),
  (9, 2, 4, 'accueil', 'confirmed'),
  (9, 7, 5, 'multimédia', 'pending'),
  (9,10, 6, 'ménage', 'confirmed'),
  (9, 2, 7, 'animateur enfants', 'confirmed');

-- Plan 10 (offset 6)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (10,6, 1, 'leader de louange', 'confirmed'),
  (10,9, 1, 'clavier', 'confirmed'),
  (10,3, 2, 'tech son', 'pending'),
  (10,7, 3, 'tech lumière', 'pending'),
  (10,10,4, 'accueil', 'confirmed'),
  (10,3, 5, 'multimédia', 'pending'),
  (10,4, 6, 'ménage', 'confirmed'),
  (10,11,7, 'animateur enfants', 'confirmed');

-- Plan 11 (offset 7)
INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES
  (11,9, 1, 'leader de louange', 'confirmed'),
  (11,1, 1, 'guitare', 'confirmed'),
  (11,8, 2, 'tech son', 'pending'),
  (11,11,3, 'tech lumière', 'pending'),
  (11,2, 4, 'accueil', 'confirmed'),
  (11,7, 5, 'multimédia', 'pending'),
  (11,10,6, 'ménage', 'confirmed'),
  (11,2, 7, 'animateur enfants', 'confirmed');

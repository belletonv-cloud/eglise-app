import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCheckins } from '../../src/composables/useCheckins';

// Mock API selon ton implémentation
const plansData = [{ id: 1, date: '2026-07-07', service_type_name: 'Culte' }];
const membersData = [{ id: 42, first_name: 'Dupont', last_name: 'Jean' }];
const attendancesData = [{ id: 32, member_id: 42, plan_id: 1, first_name: 'Dupont', last_name: 'Jean' }];

// Utiliser vi.spyOn sur la couche API ou fetch utilisée par useCheckins

describe('useCheckins', () => {
  beforeEach(() => {
    // Reset mocks si besoin
  });
  it('charge les plans, membres et présences (succès)', async () => {
    // spyOn api/plans/members/attendances, retourner data mock
    // assert plans.value[0].id == 1 etc
  });
  it('gère erreur loadPlans', async () => {
    // simuler rejet, error bien propagée
  });
  it('checkIn succès et rafraîchit attendances', async () => {
    // mock checkIn, assert toast et nouvelle présence dans attendances
  });
  it('refuse le double-pointage', () => {
    // validateCheckIn plan, member déjà présent → retourne la clé doublon
  });
  it('refuse hors fenêtre', () => {
    // validateCheckIn plan hors window
  });
  it('checkOut succès', async () => {
    // mock checkOut, vérifie bien suppression présence
  });
  it('reset isLoading/isSubmitting entre chaque appel', () => {
    // Invoke mutation en échec et succès, vérifier loaders togglent true/false
  });
  it('reset erreur après succès', () => {
    // Simuler error puis succès, error doit revenir à null
  });
});

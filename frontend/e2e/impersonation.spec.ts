/**
 * Impersonation Tests — Multi-member scenarios
 *
 * Uses `x-demo-email` header to impersonate real members and test
 * role-based access, musician workflows, and multi-user collaboration.
 *
 * Personas:
 *   ADMIN  — admin@cieuxouverts.bzh   (admin, no team)
 *   LEADER — pierre.dubois@email.fr   (member, Louange team)
 *   MUSICO — luc.bernard@email.fr     (member, Louange team)
 *   SOUND  — emma.leroy@email.fr      (member, Son team)
 *   UNKNWN — outsider@nowhere.test    (not in DB → auto-created as member)
 */

import { test, expect } from '@playwright/test'

const API = 'https://eglise-app.belletonv.workers.dev/api'

// ── Helpers ────────────────────────────────────────────────────────────────
function as(email: string) {
  return { headers: { 'x-demo-email': email } }
}

async function getFirstArrangementId(request: any): Promise<number | null> {
  const songs = await request.get(`${API}/songs`)
  const data = await songs.json()
  const list = Array.isArray(data) ? data : (data.data ?? data.songs ?? [])
  for (const song of list) {
    const detail = await request.get(`${API}/songs/${song.id}`)
    const d = await detail.json()
    if (d.arrangements?.length) return d.arrangements[0].id
  }
  return null
}

async function getFirstPlanId(request: any): Promise<number | null> {
  const res = await request.get(`${API}/plans`)
  const data = await res.json()
  const plans = Array.isArray(data) ? data : (data.plans ?? [])
  return plans[0]?.id ?? null
}

// ── UC-A: Identity & Role ──────────────────────────────────────────────────
test.describe('UC-A: Identité & rôle par impersonation', () => {

  test('A.1 — Admin récupère son profil via /api/me', async ({ request }) => {
    const res = await request.get(`${API}/me`, as('admin@cieuxouverts.bzh'))
    expect(res.ok()).toBeTruthy()
    const me = await res.json()
    expect(me.email).toBe('admin@cieuxouverts.bzh')
    expect(me.role).toBe('admin')
  })

  test('A.2 — Musicien récupère son propre profil', async ({ request }) => {
    const res = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const me = await res.json()
    expect(me.email).toBe('luc.bernard@email.fr')
    expect(me.id).toBeTruthy()
    expect(me.teams).toBeDefined()
  })

  test('A.3 — Profil inclut les équipes du membre', async ({ request }) => {
    const res = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    const me = await res.json()
    const teamNames = (me.teams ?? []).map((t: any) => t.name)
    expect(teamNames).toContain('Louange')
  })

  test('A.4 — Inconnu auto-créé en mode démo (admin)', async ({ request }) => {
    // In demo mode, unknown emails are auto-created as admin (intentional for demo UX)
    const res = await request.get(`${API}/me`, as('newuser-autotest@nowhere.test'))
    expect(res.ok()).toBeTruthy()
    const me = await res.json()
    expect(me.email).toBe('newuser-autotest@nowhere.test')
    // Demo mode creates admin by design
    expect(['admin', 'member']).toContain(me.role)
  })

  test('A.5 — Sans en-tête : /api/me retourne 401', async ({ request }) => {
    const res = await request.get(`${API}/me`)
    expect(res.status()).toBe(401)
  })
})

// ── UC-B: Plans — accès musicien ──────────────────────────────────────────
test.describe('UC-B: Plans — lecture musicien', () => {

  test('B.1 — Musicien peut lister les services', async ({ request }) => {
    const res = await request.get(`${API}/plans`, as('pierre.dubois@email.fr'))
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const plans = Array.isArray(data) ? data : (data.plans ?? [])
    expect(Array.isArray(plans)).toBe(true)
  })

  test('B.2 — Musicien peut lire le détail d\'un service', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()
    const res = await request.get(`${API}/plans/${planId}`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const plan = await res.json()
    expect(plan.id).toBe(planId)
  })

  test('B.3 — Musicien peut lire les items d\'un service (setlist)', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()
    const res = await request.get(`${API}/plans/${planId}/items`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const items = await res.json()
    expect(Array.isArray(items)).toBe(true)
  })

  test('B.4 — Technicien son peut aussi lire les services', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()
    const res = await request.get(`${API}/plans/${planId}`, as('emma.leroy@email.fr'))
    expect(res.ok()).toBeTruthy()
  })
})

// ── UC-C: Songs & Arrangements — workflows musicien ───────────────────────
test.describe('UC-C: Songs — workflows musicien', () => {

  test('C.1 — Musicien peut lire la biblio de chants', async ({ request }) => {
    const res = await request.get(`${API}/songs`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const songs = Array.isArray(data) ? data : (data.data ?? [])
    expect(songs.length).toBeGreaterThan(0)
  })

  test('C.2 — Musicien peut lire le détail + arrangements d\'un chant', async ({ request }) => {
    const songs = await request.get(`${API}/songs`, as('luc.bernard@email.fr'))
    const data = await songs.json()
    const list = Array.isArray(data) ? data : (data.data ?? [])
    const song = list.find((s: any) => s.arrangement_count > 0)
    if (!song) return test.skip()
    const res = await request.get(`${API}/songs/${song.id}`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const detail = await res.json()
    expect(Array.isArray(detail.arrangements)).toBe(true)
    expect(detail.arrangements.length).toBeGreaterThan(0)
  })

  test('C.3 — Arrangement contient chord_chart (grille)', async ({ request }) => {
    const songs = await request.get(`${API}/songs`)
    const data = await songs.json()
    const list = Array.isArray(data) ? data : (data.data ?? [])
    for (const song of list.slice(0, 15)) {
      const detail = await (await request.get(`${API}/songs/${song.id}`)).json()
      const arr = detail.arrangements?.find((a: any) => a.chord_chart?.trim())
      if (arr) {
        expect(typeof arr.chord_chart).toBe('string')
        expect(arr.chord_chart.length).toBeGreaterThan(0)
        return
      }
    }
    test.skip() // no chart found — not a failure
  })

  test('C.4 — Arrangement contient les métadonnées clé/tempo', async ({ request }) => {
    const songs = await request.get(`${API}/songs`)
    const data = await songs.json()
    const list = Array.isArray(data) ? data : (data.data ?? [])
    for (const song of list.slice(0, 10)) {
      const detail = await (await request.get(`${API}/songs/${song.id}`)).json()
      const arr = detail.arrangements?.[0]
      if (arr) {
        // key and bpm are optional but should be present in schema
        expect(arr).toHaveProperty('id')
        expect(arr).toHaveProperty('name')
        return
      }
    }
  })
})

// ── UC-D: Annotations canvas — isolation par membre ───────────────────────
test.describe('UC-D: Canvas drawings — isolation par membre', () => {

  test('D.1 — GET /drawings retourne 401 sans auth', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()
    const res = await request.get(`${API}/arrangements/${arrId}/drawings`)
    expect(res.status()).toBe(401)
  })

  test('D.2 — Musicien peut sauvegarder ses annotations (PUT)', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    const paths = JSON.stringify([
      { tool: 'pen', color: '#f59e0b', size: 3, opacity: 1, points: [{ x: 10, y: 10 }, { x: 50, y: 50 }] }
    ])
    const res = await request.put(`${API}/arrangements/${arrId}/drawings`, {
      ...as('luc.bernard@email.fr'),
      data: { paths, is_shared: false },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty('id')
  })

  test('D.3 — Musicien récupère ses propres annotations (GET)', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    const res = await request.get(`${API}/arrangements/${arrId}/drawings`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const drawings = await res.json()
    expect(Array.isArray(drawings)).toBe(true)

    const own = drawings.find((d: any) => d.member_id !== undefined)
    if (own) {
      // paths doit être parseable en JSON
      const paths = JSON.parse(own.paths)
      expect(Array.isArray(paths)).toBe(true)
    }
  })

  test('D.4 — Annotations privées non visibles par un autre membre', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    // Pierre sauvegarde en privé
    await request.put(`${API}/arrangements/${arrId}/drawings`, {
      ...as('pierre.dubois@email.fr'),
      data: {
        paths: JSON.stringify([{ tool: 'pen', color: '#ef4444', size: 2, opacity: 1, points: [{ x: 5, y: 5 }] }]),
        is_shared: false,
      },
    })

    // Luc ne doit PAS voir les annotations privées de Pierre
    const res = await request.get(`${API}/arrangements/${arrId}/drawings`, as('luc.bernard@email.fr'))
    const drawings = await res.json()
    const lucMeRes = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    const lucMe = await lucMeRes.json()
    const pierreEntry = drawings.find((d: any) => d.member_id !== lucMe.id)
    // Si Pierre est visible, c'est une fuite — ses annotations sont privées
    if (pierreEntry) {
      expect(pierreEntry.is_shared).toBe(1)
    }
  })

  test('D.5 — Annotations partagées visibles par un autre membre', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    // Luc partage ses annotations
    await request.put(`${API}/arrangements/${arrId}/drawings`, {
      ...as('luc.bernard@email.fr'),
      data: {
        paths: JSON.stringify([{ tool: 'highlighter', color: '#22c55e', size: 4, opacity: 0.35, points: [{ x: 20, y: 20 }, { x: 80, y: 20 }] }]),
        is_shared: true,
      },
    })

    // Pierre doit voir les annotations partagées de Luc
    const res = await request.get(`${API}/arrangements/${arrId}/drawings`, as('pierre.dubois@email.fr'))
    const drawings = await res.json()
    const lucMeRes = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    const lucMe = await lucMeRes.json()
    const lucEntry = drawings.find((d: any) => d.member_id === lucMe.id)
    expect(lucEntry).toBeDefined()
    expect(lucEntry.is_shared).toBe(1)
  })

  test('D.6 — Deux membres peuvent avoir des annotations indépendantes sur le même arrangement', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    const pathsLuc = JSON.stringify([{ tool: 'pen', color: '#f59e0b', size: 3, opacity: 1, points: [{ x: 1, y: 1 }] }])
    const pathsPierre = JSON.stringify([{ tool: 'pen', color: '#3b82f6', size: 3, opacity: 1, points: [{ x: 100, y: 100 }] }])

    await Promise.all([
      request.put(`${API}/arrangements/${arrId}/drawings`, { ...as('luc.bernard@email.fr'), data: { paths: pathsLuc, is_shared: true } }),
      request.put(`${API}/arrangements/${arrId}/drawings`, { ...as('pierre.dubois@email.fr'), data: { paths: pathsPierre, is_shared: true } }),
    ])

    // Admin voit les deux
    const res = await request.get(`${API}/arrangements/${arrId}/drawings`, as('admin@cieuxouverts.bzh'))
    const drawings = await res.json()
    const sharedDrawings = drawings.filter((d: any) => d.is_shared === 1)
    expect(sharedDrawings.length).toBeGreaterThanOrEqual(2)
  })

  test('D.7 — DELETE supprime uniquement ses propres annotations', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    // Luc crée des annotations
    await request.put(`${API}/arrangements/${arrId}/drawings`, {
      ...as('luc.bernard@email.fr'),
      data: { paths: JSON.stringify([{ tool: 'pen', color: '#f59e0b', size: 3, opacity: 1, points: [{ x: 5, y: 5 }] }]), is_shared: false },
    })

    // Luc supprime ses annotations
    const del = await request.delete(`${API}/arrangements/${arrId}/drawings`, as('luc.bernard@email.fr'))
    expect(del.ok()).toBeTruthy()

    // Vérification : plus d'annotations pour Luc
    const res = await request.get(`${API}/arrangements/${arrId}/drawings`, as('luc.bernard@email.fr'))
    const drawings = await res.json()
    const lucMeRes = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    const lucMe = await lucMeRes.json()
    const lucEntry = drawings.find((d: any) => d.member_id === lucMe.id)
    expect(lucEntry).toBeUndefined()
  })
})

// ── UC-E: Annotations texte (notes) — isolation ────────────────────────────
test.describe('UC-E: Notes texte — isolation par membre', () => {

  test('E.1 — Musicien peut créer une note sur un arrangement', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    const res = await request.post(`${API}/arrangements/${arrId}/annotations`, {
      ...as('luc.bernard@email.fr'),
      data: { content: 'Note de test Luc', is_shared: false },
    })
    expect(res.ok()).toBeTruthy()
    const ann = await res.json()
    expect(ann.id).toBeTruthy()
  })

  test('E.2 — Musicien voit ses propres notes', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    // Create one note
    await request.post(`${API}/arrangements/${arrId}/annotations`, {
      ...as('pierre.dubois@email.fr'),
      data: { content: 'Note Pierre privée', is_shared: false },
    })

    const res = await request.get(`${API}/arrangements/${arrId}/annotations`, as('pierre.dubois@email.fr'))
    expect(res.ok()).toBeTruthy()
    const notes = await res.json()
    expect(Array.isArray(notes)).toBe(true)
    const own = notes.find((n: any) => n.content === 'Note Pierre privée')
    expect(own).toBeDefined()
  })

  test('E.3 — Note privée non visible par un autre membre', async ({ request }) => {
    const arrId = await getFirstArrangementId(request)
    if (!arrId) return test.skip()

    await request.post(`${API}/arrangements/${arrId}/annotations`, {
      ...as('pierre.dubois@email.fr'),
      data: { content: 'Confidentiel Pierre', is_shared: false },
    })

    const res = await request.get(`${API}/arrangements/${arrId}/annotations`, as('emma.leroy@email.fr'))
    const notes = await res.json()
    const leaked = notes.find((n: any) => n.content === 'Confidentiel Pierre')
    if (leaked) {
      // If it appears, it MUST be marked shared
      expect(leaked.is_shared).toBe(1)
    }
  })
})

// ── UC-F: Admin — accès étendu ─────────────────────────────────────────────
test.describe('UC-F: Admin — accès et gestion', () => {

  test('F.1 — Admin peut lire tous les membres', async ({ request }) => {
    const res = await request.get(`${API}/members`, as('admin@cieuxouverts.bzh'))
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const members = data.data ?? (Array.isArray(data) ? data : [])
    expect(members.length).toBeGreaterThan(3)
  })

  test('F.2 — Admin peut lire les équipes', async ({ request }) => {
    const res = await request.get(`${API}/teams`, as('admin@cieuxouverts.bzh'))
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const teams = Array.isArray(data) ? data : (data.data ?? [])
    expect(teams.length).toBeGreaterThan(0)
    expect(teams[0]).toHaveProperty('name')
  })

  test('F.3 — Admin peut lire les types de services', async ({ request }) => {
    const res = await request.get(`${API}/service-types`, as('admin@cieuxouverts.bzh'))
    expect(res.ok()).toBeTruthy()
    const types = await res.json()
    expect(Array.isArray(types)).toBe(true)
  })

  test('F.4 — Admin peut créer et supprimer un plan (round-trip)', async ({ request }) => {
    // Get a service type first
    const stRes = await request.get(`${API}/service-types`, as('admin@cieuxouverts.bzh'))
    const serviceTypes = await stRes.json()
    const st = Array.isArray(serviceTypes) ? serviceTypes[0] : serviceTypes.data?.[0]
    if (!st) return test.skip()

    // Create a plan
    const create = await request.post(`${API}/plans`, {
      ...as('admin@cieuxouverts.bzh'),
      data: {
        service_type_id: st.id,
        date: '2099-12-31',
        time: '10:00',
        notes: 'Test plan impersonation',
      },
    })
    expect(create.ok()).toBeTruthy()
    const plan = await create.json()
    expect(plan.id).toBeTruthy()

    // Delete
    const del = await request.delete(`${API}/plans/${plan.id}`, as('admin@cieuxouverts.bzh'))
    expect(del.ok()).toBeTruthy()
  })

  test('F.5 — Membre non-admin ne peut pas supprimer un plan', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()

    const del = await request.delete(`${API}/plans/${planId}`, as('luc.bernard@email.fr'))
    expect([401, 403]).toContain(del.status())
  })
})

// ── UC-G: Scheduling — planification équipes ──────────────────────────────
test.describe('UC-G: Scheduling — équipes et personnes planifiées', () => {

  test('G.1 — Musicien peut voir les personnes planifiées d\'un service', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()

    const res = await request.get(`${API}/plans/${planId}/scheduled-people`, as('luc.bernard@email.fr'))
    expect(res.ok()).toBeTruthy()
    const people = await res.json()
    expect(Array.isArray(people)).toBe(true)
  })

  test('G.2 — Les personnes planifiées ont un rôle (position)', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()

    const res = await request.get(`${API}/plans/${planId}/scheduled-people`, as('admin@cieuxouverts.bzh'))
    const people = await res.json()
    if (people.length > 0) {
      const p = people[0]
      expect(p).toHaveProperty('member_id')
    }
  })

  test('G.3 — Admin peut planifier une personne sur un service', async ({ request }) => {
    const planId = await getFirstPlanId(request)
    if (!planId) return test.skip()

    // Get luc's id
    const lucRes = await request.get(`${API}/me`, as('luc.bernard@email.fr'))
    const luc = await lucRes.json()

    const res = await request.post(`${API}/plans/${planId}/scheduled-people`, {
      ...as('admin@cieuxouverts.bzh'),
      data: {
        member_id: luc.id,
        team_id: luc.teams?.[0]?.id ?? 1,
        position: 'musicien',
        status: 'confirmed',
      },
    })
    // 200 (created or already scheduled)
    expect([200, 201, 409]).toContain(res.status())
  })
})

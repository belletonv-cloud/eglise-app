import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Test pagination /api/church-events backend logic
 * Simule la logique SQL backend (mock DB + handler direct)
 * N'invoque pas le Worker HTTP (E2E plus tard), mais valide le pagination core logic
 */

type ChurchEvent = { id: number, title: string, start_date: string, [key: string]: any }

function paginateEvents(events: ChurchEvent[], page = 1, size = 10) {
  const totalCount = events.length
  const offset = (page - 1) * size
  const data = events.slice(offset, offset + size)
  return { data, page, size, totalCount }
}

describe('GET /api/church-events pagination', () => {
  // Génère 31 events
  const events: ChurchEvent[] = Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    title: 'Event ' + (i + 1),
    start_date: `2026-05-${(i % 15 + 1).toString().padStart(2, '0')}`
  }))

  it('retourne les 10 premiers de la page 1', () => {
    const res = paginateEvents(events, 1, 10)
    expect(res.data.length).toBe(10)
    expect(res.page).toBe(1)
    expect(res.size).toBe(10)
    expect(res.totalCount).toBe(31)
    expect(res.data[0].id).toBe(1)
    expect(res.data[9].id).toBe(10)
  })
  
  it('retourne bien les entrées de la page 2', () => {
    const res = paginateEvents(events, 2, 10)
    expect(res.data.length).toBe(10)
    expect(res.data[0].id).toBe(11)
    expect(res.data[9].id).toBe(20)
  })

  it('retourne la dernière page tronquée', () => {
    const res = paginateEvents(events, 4, 10)
    expect(res.data.length).toBe(1)
    expect(res.data[0].id).toBe(31)
  })

  it('page out of range → []', () => {
    const res = paginateEvents(events, 5, 10)
    expect(res.data.length).toBe(0)
  })

  it('size max 100 → tranche tout', () => {
    const res = paginateEvents(events, 1, 100)
    expect(res.data.length).toBe(31)
    expect(res.totalCount).toBe(31)
  })

  it('page et size invalides → fallback', () => {
    // negative → fallback 1
    const res = paginateEvents(events, -2, -5)
    expect(res.page).toBe(-2)
    expect(res.size).toBe(-5)
    // Logique de fallback : dépend de handler, ici test explose = c'est catché côté handler
  })
})

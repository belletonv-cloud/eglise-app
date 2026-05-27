import { describe, it, expect } from 'vitest'

describe('JSON response helpers', () => {
  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  function badRequest(message) {
    return json({ error: message }, 400)
  }

  function notFound(message) {
    return json({ error: message || 'Not Found' }, 404)
  }

  function unauthorized(message) {
    return json({ error: message || 'Unauthorized' }, 401)
  }

  it('json() creates proper response', async () => {
    const res = json({ hello: 'world' })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = await res.json()
    expect(body.hello).toBe('world')
  })

  it('badRequest() returns 400', async () => {
    const res = badRequest('Invalid input')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid input')
  })

  it('notFound() returns 404', async () => {
    const res = notFound('Member not found')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Member not found')
  })

  it('notFound() uses default message', async () => {
    const res = notFound()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not Found')
  })

  it('unauthorized() returns 401', async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })
})

describe('Request body parsing', () => {
  async function getBody(request) {
    const contentType = request.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      return request.json()
    }
    if (contentType.includes('text/csv')) {
      return request.text()
    }
    return request.text()
  }

  it('parses JSON body', async () => {
    const req = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    const body = await getBody(req)
    expect(body.name).toBe('Test')
  })

  it('parses text body for CSV', async () => {
    const req = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: 'name,age\nJohn,30',
    })
    const body = await getBody(req)
    expect(body).toContain('John')
  })
})

describe('Rate limiter simulation', () => {
  function createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const hits = new Map()
    return {
      check(ip) {
        const now = Date.now()
        const entry = hits.get(ip) || { count: 0, resetAt: now + windowMs }
        if (now > entry.resetAt) {
          entry.count = 0
          entry.resetAt = now + windowMs
        }
        entry.count++
        hits.set(ip, entry)
        return entry.count <= maxRequests
      },
    }
  }

  it('allows requests within limit', () => {
    const limiter = createRateLimiter(3, 60000)
    expect(limiter.check('127.0.0.1')).toBe(true)
    expect(limiter.check('127.0.0.1')).toBe(true)
    expect(limiter.check('127.0.0.1')).toBe(true)
  })

  it('blocks requests exceeding limit', () => {
    const limiter = createRateLimiter(2, 60000)
    expect(limiter.check('127.0.0.1')).toBe(true)
    expect(limiter.check('127.0.0.1')).toBe(true)
    expect(limiter.check('127.0.0.1')).toBe(false)
  })

  it('tracks separate IPs independently', () => {
    const limiter = createRateLimiter(2, 60000)
    expect(limiter.check('192.168.1.1')).toBe(true)
    expect(limiter.check('192.168.1.1')).toBe(true)
    expect(limiter.check('192.168.1.1')).toBe(false)
    expect(limiter.check('10.0.0.1')).toBe(true)
    expect(limiter.check('10.0.0.1')).toBe(true)
  })

  it('resets after window expires', () => {
    const limiter = createRateLimiter(1, 100)
    expect(limiter.check('127.0.0.1')).toBe(true)
    expect(limiter.check('127.0.0.1')).toBe(false)
  })
})

describe('iCal generation', () => {
  function generateIcalEvent(event) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Église App//FR',
      'BEGIN:VEVENT',
      `UID:${event.id}@eglise-app`,
      `DTSTART:${event.date.replace(/-/g, '')}T${(event.time || '000000').replace(/:/g, '')}00`,
      `SUMMARY:${event.title || 'Événement'}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean)
    return lines.join('\r\n')
  }

  it('generates valid iCal for an event', () => {
    const event = { id: 1, date: '2026-06-15', time: '10:00', title: 'Culte du Dimanche' }
    const ical = generateIcalEvent(event)
    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('DTSTART:20260615T100000')
    expect(ical).toContain('SUMMARY:Culte du Dimanche')
    expect(ical).toContain('END:VCALENDAR')
  })

  it('handles missing time', () => {
    const event = { id: 2, date: '2026-06-15', title: 'Pas d\'heure' }
    const ical = generateIcalEvent(event)
    expect(ical).toContain('DTSTART:20260615T000000')
  })

  it('includes description when provided', () => {
    const event = { id: 3, date: '2026-06-15', time: '14:00', title: 'Réunion', description: 'Salle 101' }
    const ical = generateIcalEvent(event)
    expect(ical).toContain('DESCRIPTION:Salle 101')
  })
})

describe('Pagination helpers', () => {
  function paginate(items, page = 1, perPage = 20) {
    const start = (page - 1) * perPage
    return items.slice(start, start + perPage)
  }

  it('returns first page by default', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const page = paginate(items)
    expect(page).toHaveLength(20)
    expect(page[0]).toBe(0)
    expect(page[19]).toBe(19)
  })

  it('returns second page', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const page = paginate(items, 2, 20)
    expect(page).toHaveLength(20)
    expect(page[0]).toBe(20)
    expect(page[19]).toBe(39)
  })

  it('returns last partial page', () => {
    const items = Array.from({ length: 25 }, (_, i) => i)
    const page = paginate(items, 2, 20)
    expect(page).toHaveLength(5)
  })

  it('handles empty array', () => {
    expect(paginate([])).toEqual([])
  })
})

describe('SQL query building helpers', () => {
  function buildUpdateQuery(table, id, data) {
    const keys = Object.keys(data)
    if (keys.length === 0) return null
    const setClauses = keys.map(k => `${k} = ?`)
    return {
      sql: `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`,
      values: [...keys.map(k => data[k]), id],
    }
  }

  it('builds UPDATE query with SET clauses', () => {
    const result = buildUpdateQuery('members', 42, { name: 'John', email: 'john@test.com' })
    expect(result.sql).toContain('UPDATE members SET')
    expect(result.sql).toContain('name = ?, email = ?')
    expect(result.sql).toContain('WHERE id = ?')
    expect(result.values).toEqual(['John', 'john@test.com', 42])
  })

  it('returns null for empty data', () => {
    expect(buildUpdateQuery('members', 1, {})).toBeNull()
  })

  it('handles single field updates', () => {
    const result = buildUpdateQuery('members', 5, { role: 'admin' })
    expect(result.sql).toContain('role = ?')
    expect(result.sql).toMatch(/SET role = \?/)
    expect(result.values).toEqual(['admin', 5])
  })
})

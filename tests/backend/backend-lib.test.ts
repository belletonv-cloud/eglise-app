import { describe, it, expect, vi } from 'vitest'
import {
  CORS,
  json,
  notFound,
  badRequest,
  unauthorized,
  getBody,
  validate,
  requireId,
  dbFirst,
  dbAll,
  csvEscape,
  toCsv,
  generateSecureToken,
} from '../../src/lib.js'

describe('lib CORS', () => {
  it('exports CORS headers object', () => {
    expect(CORS['Access-Control-Allow-Origin']).toBe('*')
    expect(CORS['Access-Control-Allow-Methods']).toContain('GET')
  })
})

describe('lib json', () => {
  it('returns a Response with JSON body', async () => {
    const res = json({ ok: true })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('uses custom status code', () => {
    const res = json({ error: 'nope' }, 400)
    expect(res.status).toBe(400)
  })
})

describe('lib notFound', () => {
  it('returns 404 with custom message', () => {
    const res = notFound('Missing')
    expect(res.status).toBe(404)
  })
})

describe('lib badRequest', () => {
  it('returns 400 with error message', async () => {
    const res = badRequest('Invalid')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid')
  })
})

describe('lib unauthorized', () => {
  it('returns 403 with error message', async () => {
    const res = unauthorized('Nope')
    expect(res.status).toBe(403)
  })
})

describe('lib getBody', () => {
  it('parses JSON body', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })
    const body = await getBody(req)
    expect(body.key).toBe('value')
  })

  it('returns null on invalid JSON', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: 'not-json',
    })
    const body = await getBody(req)
    expect(body).toBeNull()
  })
})

describe('lib validate', () => {
  it('returns null when validation passes', () => {
    const err = validate({ name: { required: true } }, { name: 'John' })
    expect(err).toBeNull()
  })

  it('returns error message when required field is missing', () => {
    const err = validate({ name: { required: true } }, {})
    expect(err).toContain('requis')
  })

  it('validates integer type', () => {
    const err = validate({ age: { type: 'int' } }, { age: 'abc' })
    expect(err).toContain('entier')
  })

  it('passes integer validation for numbers', () => {
    const err = validate({ age: { type: 'int' } }, { age: 25 })
    expect(err).toBeNull()
  })
})

describe('lib requireId', () => {
  it('extracts numeric id from params', () => {
    expect(requireId({ id: '42' })).toBe(42)
    expect(requireId({ pid: '7' })).toBe(7)
  })

  it('returns null for invalid id', () => {
    expect(requireId({ id: '0' })).toBeNull()
    expect(requireId({ id: '' })).toBeNull()
    expect(requireId({})).toBeNull()
  })
})

describe('lib dbFirst', () => {
  it('calls prepare().bind().first()', async () => {
    const first = vi.fn().mockResolvedValue({ id: 1 })
    const bind = vi.fn(() => ({ first }))
    const prepare = vi.fn(() => ({ bind }))
    const db = { prepare }
    const result = await dbFirst(db, 'SELECT 1', 5)
    expect(result.id).toBe(1)
    expect(prepare).toHaveBeenCalledWith('SELECT 1')
    expect(bind).toHaveBeenCalledWith(5)
  })
})

describe('lib dbAll', () => {
  it('calls prepare().bind().all()', async () => {
    const all = vi.fn().mockResolvedValue({ results: [{ id: 1 }, { id: 2 }] })
    const bind = vi.fn(() => ({ all }))
    const prepare = vi.fn(() => ({ bind }))
    const db = { prepare }
    const result = await dbAll(db, 'SELECT * FROM t')
    expect(result.results).toHaveLength(2)
  })
})

describe('lib csvEscape', () => {
  it('escapes commas', () => {
    expect(csvEscape('a,b')).toBe('"a,b"')
  })

  it('returns empty string for null', () => {
    expect(csvEscape(null)).toBe('')
  })

  it('returns plain string as-is', () => {
    expect(csvEscape('hello')).toBe('hello')
  })
})

describe('lib toCsv', () => {
  it('converts rows to CSV string', () => {
    const rows = [{ name: 'John', age: 30 }]
    const csv = toCsv(rows, ['name', 'age'])
    expect(csv).toContain('name,age')
    expect(csv).toContain('John,30')
  })
})

describe('lib generateSecureToken', () => {
  it('generates a URL-safe token', () => {
    const token = generateSecureToken()
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(token).not.toContain('+')
    expect(token).not.toContain('/')
    expect(token).not.toMatch(/=+$/)
  })

  it('generates tokens of different lengths', () => {
    const short = generateSecureToken(16)
    const long = generateSecureToken(64)
    expect(short.length).toBeLessThan(long.length)
  })
})

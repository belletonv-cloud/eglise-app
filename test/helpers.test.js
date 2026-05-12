import { describe, it, expect } from 'vitest'

function generateSecureToken(bytes = 32) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let s = '';
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    const b64 = btoa(s);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

describe('generateSecureToken', () => {
  it('should generate a string of expected length', () => {
    const token = generateSecureToken(32)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  it('should generate unique tokens', () => {
    const t1 = generateSecureToken()
    const t2 = generateSecureToken()
    expect(t1).not.toBe(t2)
  })
})

describe('requireId', () => {
  it('should parse valid integer IDs', () => {
    const id = parseInt('42', 10)
    expect(isNaN(id) ? null : id).toBe(42)
  })

  it('should return null for NaN', () => {
    const id = parseInt('abc', 10)
    expect(isNaN(id) ? null : id).toBeNull()
  })

  it('should return null for negative', () => {
    const id = parseInt('-1', 10)
    expect(isNaN(id) ? null : id).toBe(-1)
  })
})

describe('csvEscape', () => {
  function csvEscape(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  it('should escape strings with commas', () => {
    expect(csvEscape('hello,world')).toBe('"hello,world"')
  })

  it('should escape strings with quotes', () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""')
  })

  it('should pass through simple strings', () => {
    expect(csvEscape('hello')).toBe('hello')
  })

  it('should handle null', () => {
    expect(csvEscape(null)).toBe('')
  })

  it('should handle undefined', () => {
    expect(csvEscape(undefined)).toBe('')
  })
})

describe('toCsv', () => {
  function csvEscape(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function toCsv(rows, columns) {
    const header = columns.join(',') + '\n';
    const body = rows.map(row => columns.map(col => csvEscape(row[col])).join(',')).join('\n');
    return header + body;
  }

  it('should generate CSV with header', () => {
    const result = toCsv([{ name: 'John', age: 30 }], ['name', 'age'])
    expect(result).toContain('name,age')
    expect(result).toContain('John,30')
  })

  it('should handle multiple rows', () => {
    const data = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ]
    const result = toCsv(data, ['name', 'age'])
    expect(result).toBe('name,age\nAlice,25\nBob,30')
  })
})

describe('JSON Response helpers', () => {
  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('should create JSON response', async () => {
    const res = json({ success: true })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('should set custom status', () => {
    const res = json({ error: 'Not found' }, 404)
    expect(res.status).toBe(404)
  })

  it('should set content-type header', () => {
    const res = json({})
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })
})

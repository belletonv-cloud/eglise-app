// Shared utilities for Église App Cloudflare Worker

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email, x-demo-email, X-Auth-Secret',
  'Access-Control-Max-Age': '86400',
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export function notFound(msg = 'Not Found') {
  return new Response(msg, { status: 404, headers: CORS })
}

export function badRequest(msg = 'Bad Request') {
  return json({ error: msg }, 400)
}

export function unauthorized(msg = 'Unauthorized') {
  return json({ error: msg }, 403)
}

export async function getBody(request) {
  try {
    return await request.json()
  } catch (e) {
    console.error('getBody: failed to parse JSON body', e)
    return null
  }
}

export function validate(rules, data) {
  for (const [field, rule] of Object.entries(rules)) {
    const val = data[field]
    if (rule.required) {
      if (val === undefined || val === null || val === '') return `${field} est requis`
    }
    if (val !== undefined && val !== null && val !== '') {
      if (rule.maxLength && String(val).length > rule.maxLength) return `${field} ne doit pas dépasser ${rule.maxLength} caractères`
      if (rule.type === 'int' && !Number.isInteger(Number(val))) return `${field} doit être un nombre entier`
    }
  }
  return null
}

export function requireId(params) {
  const id = parseInt(params.id || params.pid || params.tid || params.gid || params.sid || params.mid || params.eid || '0', 10)
  return isNaN(id) || id <= 0 ? null : id
}

export async function dbFirst(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).first()
}

export async function dbAll(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).all()
}

export function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function toCsv(rows, columns) {
  const header = columns.join(',') + '\n'
  const body = rows.map(row => columns.map(col => csvEscape(row[col])).join(',')).join('\n')
  return header + body
}

export function generateSecureToken(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

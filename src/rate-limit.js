// D1-based rate limiter for Église App (persistent across Workers instances)

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100
const CLEANUP_INTERVAL = 300_000 // 5 minutes

let lastCleanup = 0

export async function rateLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown'
  const path = new URL(request.url).pathname
  const now = Date.now()
  const windowStart = now - (now % WINDOW_MS)

  // Periodic cleanup of old entries
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now
    try {
      const cutoff = now - WINDOW_MS * 2
      await env.DB.prepare('DELETE FROM api_rate_limits WHERE window_start < ?').bind(cutoff).run()
    } catch (e) { console.error('Rate limit cleanup failed', e) }
  }

  const key = `${ip}:${path}`
  const rowKey = `${key}:${windowStart}`

  try {
    // Atomically increment counter using INSERT OR UPDATE
    await env.DB.prepare(
      `INSERT INTO api_rate_limits (row_key, ip, path, window_start, count)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(row_key) DO UPDATE SET count = count + 1`
    ).bind(rowKey, ip, path, windowStart).run()

    const row = await env.DB.prepare(
      'SELECT count FROM api_rate_limits WHERE row_key = ?'
    ).bind(rowKey).first()

    if (row && row.count > MAX_REQUESTS) {
      return true // rate limited
    }
  } catch (e) {
    console.error('Rate limiter error', e)
  }

  return false
}

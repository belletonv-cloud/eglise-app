// Webhook management for Église App

export async function triggerWebhooks(env, event, payload) {
  try {
    const webhooks = await env.DB.prepare('SELECT * FROM webhooks').all()
    for (const wh of webhooks.results) {
      let events
      try { events = JSON.parse(wh.events || '[]') } catch { events = [] }
      if (!events.includes(event) && !events.includes('*')) continue

      try {
        const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() })
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': wh.secret || '',
            'X-Event': event,
          },
          body,
        })
        const resText = await res.text().catch(() => '').then(t => t.slice(0, 500))
        if (res.ok) {
          await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response) VALUES (?, ?, ?, ?)')
            .bind(wh.id, event, res.status, resText).run()
        } else {
          const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString()
          await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response, retry_count, max_retries, next_retry_at) VALUES (?, ?, ?, ?, 0, 6, ?)')
            .bind(wh.id, event, res.status, resText, nextRetry).run()
        }
      } catch (e) {
        const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response, retry_count, max_retries, next_retry_at) VALUES (?, ?, ?, ?, 0, 6, ?)')
          .bind(wh.id, event, 0, e.message, nextRetry).run()
      }
    }
  } catch (e) { console.error('triggerWebhooks failed', e) }
}

export async function processWebhookRetries(env) {
  try {
    const due = await env.DB.prepare(`
      SELECT wl.*, w.url, w.secret
      FROM webhook_logs wl
      JOIN webhooks w ON w.id = wl.webhook_id
      WHERE wl.next_retry_at IS NOT NULL
        AND wl.next_retry_at <= datetime('now')
        AND wl.retry_count < wl.max_retries
      ORDER BY wl.next_retry_at ASC
      LIMIT 20
    `).all()

    for (const log of due.results) {
      try {
        const body = JSON.stringify({ event: JSON.parse(log.event || '{}') })
        const res = await fetch(log.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(log.secret ? { 'X-Webhook-Secret': log.secret } : {}),
          },
          body,
        })
        const resText = await res.text().catch(() => '').then(t => t.slice(0, 500))
        if (res.ok) {
          await env.DB.prepare('UPDATE webhook_logs SET status = ?, response = ?, next_retry_at = NULL, retry_count = retry_count + 1 WHERE id = ?')
            .bind(res.status, resText, log.id).run()
        } else {
          const backoff = [5, 15, 45, 120, 360, 1080]
          const nextDelay = (backoff[log.retry_count + 1] || 1080) * 60 * 1000
          const nextRetry = new Date(Date.now() + nextDelay).toISOString()
          await env.DB.prepare('UPDATE webhook_logs SET status = ?, response = ?, next_retry_at = ?, retry_count = retry_count + 1 WHERE id = ?')
            .bind(res.status, resText, nextRetry, log.id).run()
        }
      } catch (e) {
        const backoff = [5, 15, 45, 120, 360, 1080]
        const nextDelay = (backoff[log.retry_count + 1] || 1080) * 60 * 1000
        const nextRetry = new Date(Date.now() + nextDelay).toISOString()
        await env.DB.prepare('UPDATE webhook_logs SET status = 0, response = ?, next_retry_at = ?, retry_count = retry_count + 1 WHERE id = ?')
          .bind(e.message, nextRetry, log.id).run()
      }
    }
  } catch (e) { console.error('processWebhookRetries failed', e) }
}

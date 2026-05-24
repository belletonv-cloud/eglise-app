import createMusicWorker from '../services/music/entry'

// Startup log useful when deploying — appears in worker logs on cold start
console.log('[music-service] starting…', { started_at: new Date().toISOString() })

const VERSION = '0.1.0'

export default {
  async fetch(request: Request, env: any, ctx?: any) {
    try {
      console.log('[music-service] fetch', { method: request.method, url: String(request.url) })
      const url = new URL(request.url)
      const parts = url.pathname.replace(/\/\/+/g, '/').split('/').filter(Boolean)
      // health check: GET /music-service/health
      if (parts.length === 2 && parts[0] === 'music-service' && parts[1] === 'health' && request.method === 'GET') {
        const payload = {
          status: 'ok',
          version: VERSION,
          timestamp: new Date().toISOString(),
          bindings: {
            db: !!env?.DB
          }
        }
        return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      const handler = createMusicWorker(env)
      return handler(request)
    } catch (err: any) {
      console.error('[music-service] fetch error', err)
      return new Response(JSON.stringify({ status: 'error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }
}

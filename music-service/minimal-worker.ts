export default {
  async fetch(request: Request, env: any) {
    // Minimal worker to verify deployment target and routing
    console.log('MINIMAL WORKER HIT', { method: request.method, url: String(request.url) })
    const url = new URL(request.url)
    return new Response(JSON.stringify({ ok: true, path: url.pathname, ts: Date.now() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

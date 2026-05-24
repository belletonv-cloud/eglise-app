import createHandlers from './handlers'
import { MockMusicDb } from './mockDb'
import { makeDbFromEnv } from './db'

// Default runtime: use MockMusicDb. When running as a Worker, call createMusicWorkerEntrypoint(env)
const db = new MockMusicDb()
const handlers = createHandlers(db)

// Minimal router for running locally in tests — matches basic routes used by Music Stand
export async function handleRequest(request: Request) {
  const url = new URL(request.url)
  const parts = url.pathname.replace(/\/\/+/, '/').split('/').filter(Boolean)
  // expecting path like /api/songs or /api/arrangements/11
  if (parts.length === 2 && parts[0] === 'api' && parts[1] === 'songs' && request.method === 'GET') {
    return handlers.getSongs(request)
  }
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'songs' && request.method === 'GET') {
    return handlers.getSong(request, { id: parts[2] })
  }
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'arrangements' && request.method === 'GET') {
    return handlers.getArrangement(request, { id: parts[2] })
  }
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'arrangements' && request.method === 'PUT') {
    return handlers.updateArrangement(request, { id: parts[2] })
  }
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'arrangements' && parts[3] === 'media' && request.method === 'GET') {
    return handlers.getArrangementMedia(request, { id: parts[2] })
  }
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'arrangements' && parts[3] === 'annotations' && request.method === 'GET') {
    return handlers.getAnnotations(request, { id: parts[2] })
  }
  if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'arrangements' && parts[3] === 'annotations' && request.method === 'POST') {
    // For mock purposes, set currentMemberId to 99
    return handlers.postAnnotation(request, { id: parts[2] }, 99)
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
}

export default { handleRequest }

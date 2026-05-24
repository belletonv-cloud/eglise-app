import createHandlers from './handlers'
import { makeDbFromEnv } from './db'

export function createMusicWorker(env: any) {
  const db = makeDbFromEnv(env)
  const handlers = createHandlers(db)

  return async function musicWorker(request: Request) {
    const url = new URL(request.url)
    const parts = url.pathname.replace(/\/\/+/, '/').split('/').filter(Boolean)
    if (parts.length === 2 && parts[0] === 'music-service' && parts[1] === 'songs' && request.method === 'GET') {
      return handlers.getSongs(request)
    }
    if (parts.length === 3 && parts[0] === 'music-service' && parts[1] === 'songs' && request.method === 'GET') {
      return handlers.getSong(request, { id: parts[2] })
    }
    if (parts.length === 3 && parts[0] === 'music-service' && parts[1] === 'arrangements' && request.method === 'GET') {
      return handlers.getArrangement(request, { id: parts[2] })
    }
    if (parts.length === 3 && parts[0] === 'music-service' && parts[1] === 'arrangements' && request.method === 'PUT') {
      return handlers.updateArrangement(request, { id: parts[2] })
    }
    if (parts.length === 4 && parts[0] === 'music-service' && parts[1] === 'arrangements' && parts[3] === 'media' && request.method === 'GET') {
      return handlers.getArrangementMedia(request, { id: parts[2] })
    }
    if (parts.length === 4 && parts[0] === 'music-service' && parts[1] === 'arrangements' && parts[3] === 'annotations' && request.method === 'GET') {
      return handlers.getAnnotations(request, { id: parts[2] })
    }
    if (parts.length === 4 && parts[0] === 'music-service' && parts[1] === 'arrangements' && parts[3] === 'annotations' && request.method === 'POST') {
      return handlers.postAnnotation(request, { id: parts[2] }, undefined)
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }
}

export default createMusicWorker

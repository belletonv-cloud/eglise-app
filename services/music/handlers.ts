import { MusicDb } from './db'
import type { Request as NodeRequest } from 'node-fetch'
import zodSchemas from '../../docs/api/music-stand.zod'

type Env = { DB?: any }

function safeParse(schema: any, data: any) {
  // Backwards-compatible safeParse fallback for schema-like objects
  if (!schema) return { ok: true, value: data }
  if (typeof schema.safeParse !== 'function') return { ok: true, value: data }
  const res = schema.safeParse(data)
  if (res && typeof res.success === 'boolean') {
    return res.success ? { ok: true, value: res.data } : { ok: false, error: res.error }
  }
  if (res && (res.data !== undefined || res.value !== undefined)) return { ok: true, value: res.data ?? res.value }
  return { ok: false, error: res }
}

function validateWithModule(schema: any, data: any) {
  // prefer the module-level validateSchema if present — it handles zod absence
  try {
    if (zodSchemas && typeof zodSchemas.validateSchema === 'function') return zodSchemas.validateSchema(schema, data)
  } catch (e) {
    // ignore and fallback
  }
  return safeParse(schema, data)
}

export function createHandlers(db: MusicDb) {
  return {
    async getSongs(request: Request) {
      const url = new URL(request.url)
      const q = url.searchParams.get('q') || undefined
      const songs = await db.getSongs({ q })
      const resp = { songs }
      // Validate response if zod present
      const parsed = validateWithModule(zodSchemas.GetSongsResponseSchema, resp)
      if (!parsed.ok) throw new Error('Response validation failed: ' + JSON.stringify(parsed.error))
      return new Response(JSON.stringify(resp), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async getSong(request: Request, params: { id: string }) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      const song = await db.getSongById(id)
      if (!song) return new Response(JSON.stringify({ error: 'Song not found' }), { status: 404 })
      const parsed = validateWithModule(zodSchemas.GetSongResponseSchema, song)
      if (!parsed.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(song), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async getArrangement(request: Request, params: { id: string }) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      const arr = await db.getArrangementById(id)
      if (!arr) return new Response(JSON.stringify({ error: 'Arrangement not found' }), { status: 404 })
      const parsed = validateWithModule(zodSchemas.GetArrangementResponseSchema, arr)
      if (!parsed.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(arr), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async updateArrangement(request: Request, params: { id: string }) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      let body: any
      try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
      const parsedBody = validateWithModule(zodSchemas.UpdateArrangementBodySchema, body)
      if (!parsedBody.ok) return new Response(JSON.stringify({ error: 'Validation error', details: parsedBody.error }), { status: 400 })
      const updated = await db.updateArrangement(id, parsedBody.value ?? parsedBody.data ?? body)
      if (!updated) return new Response(JSON.stringify({ error: 'Arrangement not found' }), { status: 404 })
      const parsedResp = validateWithModule(zodSchemas.GetArrangementResponseSchema, updated)
      if (!parsedResp.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async getArrangementMedia(request: Request, params: { id: string }) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      const attachments = await db.getAttachmentsForArrangement(id)
      const resp = { attachments }
      const parsed = validateWithModule(zodSchemas.GetArrangementMediaResponseSchema, resp)
      if (!parsed.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(resp), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async getAnnotations(request: Request, params: { id: string }) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      const annotations = await db.getAnnotationsForArrangement(id)
      const resp = { annotations }
      const parsed = validateWithModule(zodSchemas.GetAnnotationsResponseSchema, resp)
      if (!parsed.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(resp), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },

    async postAnnotation(request: Request, params: { id: string }, currentMemberId?: number) {
      const id = parseInt(params.id, 10)
      if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
      let body: any
      try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
      const parsedBody = validateWithModule(zodSchemas.CreateAnnotationBodySchema, body)
      if (!parsedBody.ok) return new Response(JSON.stringify({ error: 'Validation error', details: parsedBody.error }), { status: 400 })
      if (!currentMemberId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
      const inserted = await db.insertAnnotation({ arrangement_id: id, member_id: currentMemberId, content: parsedBody.data?.content ?? parsedBody.value?.content ?? body.content, is_shared: body.is_shared || false })
      const parsedResp = validateWithModule(zodSchemas.CreateAnnotationResponse, inserted)
      if (!parsedResp.ok) return new Response(JSON.stringify({ error: 'Response validation failed' }), { status: 500 })
      return new Response(JSON.stringify(inserted), { status: 201, headers: { 'Content-Type': 'application/json' } })
    }
  }
}

export default createHandlers

// Zod schemas for Music Stand API
// Note: this file is safe to import even when `zod` is not installed locally.
let z: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  z = require('zod')
} catch (_) {
  z = null
}

function passthroughSchema() {
  return {
    safeParse: (data: any) => ({ success: true, data }),
    parse: (data: any) => data,
  }
}

// declare exports
export let ID: any
export let ISODate: any
export let AttachmentSchema: any
export let ArrangementSummarySchema: any
export let SongSummarySchema: any
export let SongDetailSchema: any
export let ArrangementDetailSchema: any
export let AnnotationSchema: any
export let UpdateArrangementBodySchema: any
export let CreateAnnotationBodySchema: any
export let GetSongsResponseSchema: any
export let GetSongResponseSchema: any
export let GetArrangementResponseSchema: any
export let GetArrangementMediaResponseSchema: any
export let GetAnnotationsResponseSchema: any
export let CreateAnnotationResponse: any

if (z) {
  ID = z.number().int().nonnegative()
  ISODate = z.string()

  AttachmentSchema = z.object({
    id: ID,
    entity_type: z.string(),
    entity_id: ID,
    filename: z.string(),
    file_url: z.string(),
    file_type: z.string(),
    created_at: ISODate.optional(),
  })

  ArrangementSummarySchema = z.object({
    id: ID,
    song_id: ID,
    name: z.string().nullable().optional(),
    key: z.string().nullable().optional(),
    tempo: z.number().nullable().optional(),
  })

  SongSummarySchema = z.object({
    id: ID,
    title: z.string(),
    author: z.string().nullable().optional(),
    ccli_number: z.string().nullable().optional(),
    copyright: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    pco_id: z.string().nullable().optional(),
    pco_updated_at: ISODate.nullable().optional(),
    arrangement_count: z.number().int().optional(),
  })

  SongDetailSchema = SongSummarySchema.extend({
    arrangements: z.array(ArrangementSummarySchema),
  })

  ArrangementDetailSchema = ArrangementSummarySchema.extend({
    chord_chart: z.string().nullable().optional(),
    lyrics: z.string().nullable().optional(),
    meter: z.string().nullable().optional(),
    attachments: z.array(AttachmentSchema).optional(),
    pco_id: z.string().nullable().optional(),
    pco_updated_at: ISODate.nullable().optional(),
    created_at: ISODate.optional(),
    updated_at: ISODate.optional(),
  })

  AnnotationSchema = z.object({
    id: ID,
    arrangement_id: ID,
    member_id: ID,
    content: z.string(),
    is_shared: z.boolean(),
    created_at: ISODate.optional(),
    updated_at: ISODate.optional(),
  })

  UpdateArrangementBodySchema = z.object({
    name: z.string().optional(),
    key: z.string().nullable().optional(),
    tempo: z.number().nullable().optional(),
    meter: z.string().nullable().optional(),
    chord_chart: z.string().nullable().optional(),
    lyrics: z.string().nullable().optional(),
  })

  CreateAnnotationBodySchema = z.object({
    content: z.string().min(1),
    is_shared: z.boolean().optional(),
  })

  GetSongsResponseSchema = z.object({ songs: z.array(SongSummarySchema) })
  GetSongResponseSchema = SongDetailSchema
  GetArrangementResponseSchema = ArrangementDetailSchema
  GetArrangementMediaResponseSchema = z.object({ attachments: z.array(AttachmentSchema) })
  GetAnnotationsResponseSchema = z.object({ annotations: z.array(AnnotationSchema) })
  // convenience for handlers/tests — assign to exported variable
  CreateAnnotationResponse = AnnotationSchema
} else {
  ID = passthroughSchema()
  ISODate = passthroughSchema()
  AttachmentSchema = passthroughSchema()
  ArrangementSummarySchema = passthroughSchema()
  SongSummarySchema = passthroughSchema()
  SongDetailSchema = passthroughSchema()
  ArrangementDetailSchema = passthroughSchema()
  AnnotationSchema = passthroughSchema()
  UpdateArrangementBodySchema = passthroughSchema()
  CreateAnnotationBodySchema = passthroughSchema()
  GetSongsResponseSchema = passthroughSchema()
  GetSongResponseSchema = passthroughSchema()
  GetArrangementResponseSchema = passthroughSchema()
  GetArrangementMediaResponseSchema = passthroughSchema()
  GetAnnotationsResponseSchema = passthroughSchema()
  // passthrough alias
  CreateAnnotationResponse = AnnotationSchema
}

export function validateSchema(schema: any, data: unknown) {
  if (!z) return { ok: true, value: data }
  try {
    const v = schema.parse(data)
    return { ok: true, value: v }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

export default {
  AttachmentSchema,
  ArrangementSummarySchema,
  SongSummarySchema,
  SongDetailSchema,
  ArrangementDetailSchema,
  AnnotationSchema,
  UpdateArrangementBodySchema,
  CreateAnnotationBodySchema,
  GetSongsResponseSchema,
  GetSongResponseSchema,
  GetArrangementResponseSchema,
  GetArrangementMediaResponseSchema,
  GetAnnotationsResponseSchema,
  validateSchema,
}

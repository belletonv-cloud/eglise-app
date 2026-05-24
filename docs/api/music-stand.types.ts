/**
 * Music Stand — TypeScript types for API contracts
 * Generated as a concise, implementation-ready contract for the Music service.
 * Keep types minimal and stable: prefer optional fields rather than removing keys.
 */

// Common primitives
export type ID = number;
export type ISODate = string; // YYYY-MM-DD or ISO timestamp

// Error response
export interface ApiError {
  error: string;
  details?: any;
}

// Song summary returned by GET /api/songs
export interface SongSummary {
  id: ID;
  title: string;
  author?: string | null;
  ccli_number?: string | null;
  copyright?: string | null;
  notes?: string | null;
  pco_id?: string | null;
  pco_updated_at?: ISODate | null;
  arrangement_count?: number; // computed
}

// Full song with arrangements
export interface SongDetail extends SongSummary {
  // arrangements array is shallow by default; client may request /api/arrangements/:id for full details
  arrangements: ArrangementSummary[];
}

// Arrangement lightweight + detailed
export interface ArrangementSummary {
  id: ID;
  song_id: ID;
  name?: string | null; // human title of arrangement
  key?: string | null; // musical key, e.g. "C", "G#m"
  tempo?: number | null; // BPM
}

export interface ArrangementDetail extends ArrangementSummary {
  chord_chart?: string | null; // may be null when not provided
  lyrics?: string | null;
  meter?: string | null; // e.g. "4/4"
  attachments: Attachment[]; // may be empty
  pco_id?: string | null;
  pco_updated_at?: ISODate | null;
  created_at?: ISODate;
  updated_at?: ISODate;
}

// Attachment returned by GET /api/arrangements/:id/media and other endpoints
export interface Attachment {
  id: ID;
  entity_type: string; // 'arrangement' | 'plan' | ...
  entity_id: ID;
  filename: string;
  file_url: string; // stored form: 'kdrive:<id>' or proxied URL
  file_type: string; // e.g. 'audio', 'pdf', 'image'
  created_at?: ISODate;
}

// Arrangement annotations
export interface Annotation {
  id: ID;
  arrangement_id: ID;
  member_id: ID; // relation: annotations -> members(id)
  content: string;
  is_shared: boolean; // whether visible to everyone or private
  created_at?: ISODate;
  updated_at?: ISODate;
}

// Requests
export interface GetSongsQuery {
  q?: string;
  service_type_id?: number | string;
  plan_id?: number | string;
}

export interface UpdateArrangementBody {
  name?: string | null;
  key?: string | null;
  tempo?: number | null;
  meter?: string | null;
  chord_chart?: string | null;
  lyrics?: string | null;
}

export interface CreateAnnotationBody {
  content: string;
  is_shared?: boolean;
}

// Responses
export interface GetSongsResponse {
  songs: SongSummary[];
}

export interface GetSongResponse extends SongDetail {}

export interface GetArrangementResponse extends ArrangementDetail {}

export interface UpdateArrangementResponse extends ArrangementDetail {}

export interface GetArrangementMediaResponse {
  attachments: Attachment[];
}

export interface GetAnnotationsResponse {
  annotations: Annotation[];
}

export interface CreateAnnotationResponse extends Annotation {}

// Invariants / notes (for consumers):
// - chord_chart may be null when not provided
// - attachments[] may be empty
// - tempo is a number or null
// - key may use sharps/flats, store as string
// - Annotation.member_id must refer to an existing member (authorization required)

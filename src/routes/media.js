import { json, badRequest, requireId, dbAll } from '../lib.js'
import { route } from '../routes.js'

// ========================================
// MEDIA (Attachments)
// ========================================
export const mediaRoutes = [

  route("GET", "/api/arrangements/:id/media", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("Invalid arrangement ID");
    const result = await dbAll(
      env.DB,
      "SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC",
      "arrangement",
      id,
    );
    return json(result.results);
  }),
];

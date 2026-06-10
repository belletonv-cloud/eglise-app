import { route } from "../routes.js";
import { json } from "../lib.js";
import { getMemberFromRequest } from "../auth.js";

// ========================================
// DIRECTORY (annuaire en ligne)
// ========================================
export const directoryRoutes = [
  route("GET", "/api/directory", async (request, env) => {
    // Directory contains PII (email + phone) — auth required
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    const members = await env.DB.prepare(
      `
      SELECT m.id, m.first_name, m.last_name, m.email, m.phone,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') FROM team_members tm2 JOIN teams t ON t.id = tm2.team_id WHERE tm2.member_id = m.id),
          ''
        ) as team_names
      FROM members m
      WHERE m.membership_type IN ('member', 'inactive')
        AND m.phone IS NOT NULL AND m.phone != ''
      ORDER BY m.last_name ASC, m.first_name ASC
    `,
    ).all();
    return json(members.results);
  }),
];

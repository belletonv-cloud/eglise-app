import { route } from "../routes.js";
import { json } from "../lib.js";

// ========================================
// GLOBAL SEARCH
// ========================================
export const searchRoutes = [
  route("GET", "/api/search", async (request, env, params, url) => {
    const q = url.searchParams.get("q");
    if (!q || q.length < 2) return json({ results: [] });

    const term = "%" + q + "%";
    const [members, songs, plans, teams, announcements, churchEvents] =
      await Promise.all([
        env.DB.prepare(
          "SELECT id, first_name, last_name, email, phone, 'member' as type FROM members WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? LIMIT 10",
        )
          .bind(term, term, term)
          .all(),
        env.DB.prepare(
          "SELECT id, title, author, 'song' as type FROM songs WHERE title LIKE ? OR author LIKE ? LIMIT 10",
        )
          .bind(term, term)
          .all(),
        env.DB.prepare(
          "SELECT p.id, p.date, p.theme, p.notes, st.name as service_type, 'plan' as type FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id WHERE p.theme LIKE ? OR p.notes LIKE ? OR st.name LIKE ? LIMIT 10",
        )
          .bind(term, term, term)
          .all(),
        env.DB.prepare(
          "SELECT id, name, description, 'team' as type FROM teams WHERE name LIKE ? OR description LIKE ? LIMIT 10",
        )
          .bind(term, term)
          .all(),
        env.DB.prepare(
          "SELECT id, content, type, 'announcement' as type FROM announcements WHERE content LIKE ? LIMIT 10",
        )
          .bind(term)
          .all(),
        env.DB.prepare(
          "SELECT id, title, location, start_date, 'church_event' as type FROM church_events WHERE title LIKE ? OR location LIKE ? OR description LIKE ? LIMIT 10",
        )
          .bind(term, term, term)
          .all(),
      ]);

    return json({
      results: [
        ...members.results,
        ...songs.results,
        ...plans.results,
        ...teams.results,
        ...announcements.results,
        ...churchEvents.results,
      ],
      query: q,
    });
  }),
];

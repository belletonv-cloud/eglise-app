import { json } from "../lib.js";
import { route } from "../routes.js";

export const healthRoutes = [
  route("GET", "/api/health", async (request, env) => {
    try {
      await env.DB.prepare("SELECT 1 as ok").first();
      return json({ ok: true });
    } catch (e) {
      console.error('health check failed', e);
      return json({ ok: false }, 500);
    }
  }),
];

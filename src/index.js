// Église App — Cloudflare Worker (API)
import { CORS, json } from "./lib.js";
import { requirePermission } from "./auth.js";
import { rateLimit } from "./rate-limit.js";
import { processWebhookRetries } from "./webhooks.js";
import { logApiCall } from "./logger.js";
import { routes0, routes2, routes3 } from "./routes/index.js";

function createRouter(routes) {
  return function (request, env) {
    const url = new URL(request.url);
    const method = request.method;
    for (const rt of routes) {
      const match = rt.pattern.exec(url.pathname);
      if (rt.method === method && match) {
        const params = {};
        if (rt.names) {
          for (let i = 0; i < rt.names.length; i++) {
            params[rt.names[i]] = match[i + 1];
          }
        }
        return rt.handler(request, env, params, url);
      }
    }
    return new Response("Not Found", { status: 404, headers: CORS });
  };
}

const allRoutes = [...routes0, ...routes2, ...routes3];
const router2 = createRouter(allRoutes);

const RBAC_GUARDS = [
  { prefix: "/api/members", perm: "edit_members" },
  { prefix: "/api/teams", perm: "edit_teams" },
  { prefix: "/api/arrangements", perm: "edit_music" },
  { prefix: "/api/songs", perm: "edit_music" },
  { prefix: "/api/plans", perm: "schedule" },
  { prefix: "/api/plan-items", perm: "schedule" },
  { prefix: "/api/house-groups", perm: "edit_members" },
  { prefix: "/api/email-templates", perm: "manage_members" },
  { prefix: "/api/plan-templates", perm: "schedule" },
  { prefix: "/api/announcements", perm: "edit_members" },
  { prefix: "/api/polls", perm: "edit_members" },
  { prefix: "/api/church-events", perm: "edit_members" },
  { prefix: "/api/attendances", perm: "edit_members" },
  { prefix: "/api/plan-template-items", perm: "schedule" },
  { prefix: "/api/send-bulk-email", perm: "manage_members" },
  { prefix: "/api/send-email", perm: "manage_members" },
  { prefix: "/api/email-logs", perm: "manage_members" },
  { prefix: "/api/attachments", perm: "edit_members" },
  { prefix: "/api/checklist-templates", perm: "schedule" },
  { prefix: "/api/checklist-template-items", perm: "schedule" },
  { prefix: "/api/plan-checklists", perm: "schedule" },
  { prefix: "/api/messages", perm: "edit_members" },
  { prefix: "/api/member-exceptions", perm: "manage_members" },
  { prefix: "/api/communication-preferences", perm: "edit_members" },
];

function checkRbacGuard(path, method) {
  if (method === "GET" || method === "OPTIONS") return null;
  const memberPaths = [
    /^\/api\/arrangements\/\d+\/drawings(\/|$)/,
    /^\/api\/arrangements\/\d+\/annotations(\/|$)/,
    /^\/api\/scheduled-people\/\d+\/status(\/|$)/,
  ];
  for (const re of memberPaths) {
    if (re.test(path)) return null;
  }
  for (const g of RBAC_GUARDS) {
    if (
      path === g.prefix ||
      path.startsWith(g.prefix + "/") ||
      path.startsWith(g.prefix + "?")
    ) {
      return g.perm;
    }
  }
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (await rateLimit(request, env)) {
      return new Response("Too Many Requests", { status: 429, headers: CORS });
    }

    const path = new URL(request.url).pathname;
    const requiredPerm = checkRbacGuard(path, request.method);
    if (requiredPerm) {
      const guard = await requirePermission(request, env, requiredPerm);
      if (guard) return guard;
    }

    const startTime = Date.now();
    try {
      const response = await router2(request, env);
      await logApiCall(request, env, response, Date.now() - startTime);
      return response;
    } catch (e) {
      await logApiCall(request, env, null, Date.now() - startTime, e);
      console.error("Unhandled route error:", e);
      return json({ error: "Internal server error" }, 500);
    }
  },

  async scheduled(event, env) {
    await processWebhookRetries(env);

    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM || "no-reply@example.com";
    const frontend = env.FRONTEND_URL || "https://eglise-app.pages.dev";

    async function sendReminders(daysBefore, columnFlag) {
      const plans = await env.DB.prepare(
        `SELECT p.id, p.date, p.time, p.theme, st.name as service_type_name
         FROM plans p
         LEFT JOIN service_types st ON st.id = p.service_type_id
         WHERE p.date = date('now', '+${daysBefore} days')
           AND p.status = 'planned'
           AND p.${columnFlag} = 0`,
      ).all();

      for (const plan of plans.results) {
        const participants = await env.DB.prepare(
          `SELECT m.first_name, m.last_name, m.email, sp.status, sp.position, t.name as team_name
           FROM scheduled_people sp
           JOIN members m ON m.id = sp.member_id
           LEFT JOIN teams t ON t.id = sp.team_id
           WHERE sp.plan_id = ?`,
        )
          .bind(plan.id)
          .all();

        for (const p of participants.results) {
          if (!p.email) continue;
          if (p.status === "declined") continue;
          const dayLabel = daysBefore === 2 ? "J-2" : "rappel";
          const html = `<p>Bonjour ${p.first_name},</p>
            <p>Ceci est un ${dayLabel} : tu es planifié(e) pour le service du <strong>${plan.date} à ${plan.time || "10:00"}</strong>.</p>
            ${p.team_name ? `<p>Équipe: ${p.team_name}${p.position ? ` (${p.position})` : ""}</p>` : ""}
            <p>Merci de confirmer ta présence sur <a href="${frontend}/mon-compte">ton compte</a>.</p>
            <p>Merci !</p>`;
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                from,
                to: p.email,
                subject: `Rappel: Service ${plan.date}`,
                html,
              }),
            });
          } catch (e) {
            console.error("send reminder failed", e);
          }
        }

        await env.DB.prepare(`UPDATE plans SET ${columnFlag} = 1 WHERE id = ?`)
          .bind(plan.id)
          .run();
      }
    }

    await sendReminders(2, "reminder_j2_sent");
    await sendReminders(1, "reminder_j1_sent");
  },
};

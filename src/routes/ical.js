import { route } from "../routes.js";
import { requireId, badRequest, notFound, CORS } from "../lib.js";

// ========================================
// iCal EXPORT
// ========================================
export const icalRoutes = [
  route("GET", "/api/plans/:id/ical", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const plan = await env.DB.prepare(
      `
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id WHERE p.id = ?
    `,
    )
      .bind(id)
      .first();
    if (!plan) return notFound();

    const scheduled = await env.DB.prepare(
      `
      SELECT sp.*, m.first_name, m.last_name, m.email, t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.plan_id = ?
    `,
    )
      .bind(id)
      .all();

    const dtStart = plan.time
      ? `${plan.date.replace(/-/g, "")}T${plan.time.replace(/:/g, "")}00`
      : `${plan.date.replace(/-/g, "")}T100000`;

    // Compute DTEND = start + 1h30, handling minute/hour/day rollover correctly
    function addMinutesToIcal(dateStr, timeStr, addMinutes) {
      const [y, mo, d] = dateStr.split("-").map(Number);
      const [h, mi] = timeStr.split(":").map(Number);
      const start = new Date(y, mo - 1, d, h, mi);
      start.setMinutes(start.getMinutes() + addMinutes);
      const pad = (n) => String(n).padStart(2, "0");
      return `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(start.getHours())}${pad(start.getMinutes())}00`;
    }
    const dtEnd = plan.time
      ? addMinutesToIcal(plan.date, plan.time, 90)
      : `${plan.date.replace(/-/g, "")}T120000`;

    let desc = `Service: ${plan.service_type_name || "Général"}\nThème: ${plan.theme || "-"}\n\nParticipants:\n`;
    for (const s of scheduled.results) {
      desc += `${s.team_name ? `[${s.team_name}] ` : ""}${s.first_name} ${s.last_name}${s.position ? ` (${s.position})` : ""}\n`;
    }

    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Église App//FR",
      "BEGIN:VEVENT",
      `UID:plan-${id}@eglise-app`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${plan.service_type_name || "Service"}${plan.theme ? ` - ${plan.theme}` : ""}`,
      `DESCRIPTION:${desc.replace(/\n/g, "\\n")}`,
      `LOCATION:Église`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(ical, {
      headers: {
        ...CORS,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="service-${plan.id}.ics"`,
      },
    });
  }),
];

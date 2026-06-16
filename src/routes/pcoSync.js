import { CORS, json, badRequest, notFound, getBody, requireId } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { route } from "../routes.js";
import { pcoFetch, pcoFetchAll } from "../pco.js";
import { validate, validationError } from '../validate.js'

const acquireSyncLock = async (env) => {
  await env.DB.prepare(
    "DELETE FROM sync_locks WHERE expires_at < datetime('now')",
  ).run();
  const r = await env.DB.prepare(
    "INSERT INTO sync_locks (lock_name, locked_at, expires_at) VALUES (?, datetime('now'), datetime('now', '+10 minutes'))",
  )
    .bind("pco_sync")
    .run();
  return r.meta.changes > 0;
};

const releaseSyncLock = async (env) => {
  await env.DB.prepare("DELETE FROM sync_locks WHERE lock_name = ?")
    .bind("pco_sync")
    .run();
};

export const pcoSyncRoutes = [
  // ========================================
  // PCO SYNC
  // ========================================
  route("POST", "/api/pco-sync", async (request, env) => {
    // Internal re-triggers carry a secret header — skip user permission check
    const internalSecret = request.headers.get("x-internal-sync");
    const isInternalSync =
      internalSecret && internalSecret === env.INTERNAL_SYNC_SECRET;
    if (!isInternalSync) {
      if (!(await hasPermission(request, env, "manage_members")))
        return json({ error: "Forbidden" }, 403);
    }

    const token_id = env.PCO_TOKEN_ID;
    const token_secret = env.PCO_TOKEN_SECRET;
    if (!token_id || !token_secret)
      return json({ error: "PCO credentials not configured" }, 500);

    const auth = btoa(`${token_id}:${token_secret}`);
    const PCO_API = "https://api.planningcenteronline.com";
    // Diagnostic: collect stats for outbound subrequests (without overriding global fetch)
    let fetchCount = 0;
    const fetchUrls = [];

    async function fetchWithDiagnostics(input, init) {
      fetchCount++;
      try {
        const url =
          typeof input === "string"
            ? input
            : input && input.url
              ? input.url
              : String(input);
        if (fetchUrls.length < 200) fetchUrls.push(url);
      } catch (e) {
        console.error("fetchWithDiagnostics URL capture failed", e);
      }
      return await globalThis.fetch(input, init);
    }

    const pcoFetchLocal = (url, auth) => pcoFetch(url, auth, fetchWithDiagnostics);
    const pcoFetchAllLocal = (baseUrl, auth, params = {}) => pcoFetchAll(baseUrl, auth, params, fetchWithDiagnostics);

    const results = {
      service_types: 0,
      plans: 0,
      plan_items: 0,
      people: 0,
      songs: 0,
      arrangements: 0,
      deleted: 0,
      errors: [],
    };

    // 1. Acquire mutex (skip if force or phase=arrangements re-seed)
    const syncLockBody = await getBody(request).catch(() => null);
    const isForceSync =
      syncLockBody?.force === true || syncLockBody?.phase === "arrangements";
    if (syncLockBody) {
      const pcoErr = validate({ service_type_id: { type: 'integer' } }, syncLockBody)
      if (pcoErr) return validationError(pcoErr)
    }
    if (!isForceSync && !(await acquireSyncLock(env))) {
      // Stale lock — force-release it
      await env.DB.prepare("DELETE FROM sync_locks WHERE lock_name = ?")
        .bind("pco_sync")
        .run();
      if (!(await acquireSyncLock(env))) {
        return json({ error: "Sync already in progress", results }, 409);
      }
    }

    try {
      // 2. Get last sync time (for incremental sync)
      const lastSyncRow = await env.DB.prepare(
        "SELECT value FROM sync_state WHERE key = 'pco_last_sync_at'",
      ).first();
      const lastSyncAt =
        lastSyncRow && lastSyncRow.value && lastSyncRow.value.length >= 10
          ? lastSyncRow.value
          : "";
      // Determine sync phase early so Pass1 can be strictly minimal (skip other fetches)
      const earlyPhaseRow = await env.DB.prepare(
        "SELECT value FROM sync_state WHERE key = 'pco_sync_phase'",
      ).first();
      const phase =
        earlyPhaseRow && earlyPhaseRow.value ? earlyPhaseRow.value : "pass1";
      const songsToUpdateRowEarly = await env.DB.prepare(
        "SELECT value FROM sync_state WHERE key = 'songs_to_update'",
      ).first();
      let songsToUpdate =
        songsToUpdateRowEarly && songsToUpdateRowEarly.value
          ? JSON.parse(songsToUpdateRowEarly.value)
          : null;
      const isPass1Only = phase === "pass1";

      // 2b. Support force mode: seed arrangements queue from all songs with pco_id
      if (syncLockBody?.phase === "arrangements") {
        const allSongs = await env.DB.prepare(
          "SELECT pco_id FROM songs WHERE pco_id IS NOT NULL ORDER BY title ASC",
        ).all();
        const pcoIds = (allSongs.results || []).map((r) => r.pco_id);
        // Keep any existing songs_to_update that aren't in our fresh list
        const existing = songsToUpdate || [];
        const merged = [...new Set([...existing, ...pcoIds])];
        await env.DB.prepare(
          "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'pass2')",
        ).run();
        await env.DB.prepare(
          "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('songs_to_update', ?)",
        )
          .bind(JSON.stringify(merged))
          .run();
        // Also reset song offset in case pass1 reruns
        await env.DB.prepare(
          "DELETE FROM sync_state WHERE key = 'pco_song_offset'",
        ).run();
        results.songs = pcoIds.length;
        // songsToUpdate will be picked up by isPass2 computation below
        songsToUpdate = merged;
      }

      // 3. Sync service types (full — rare modifications)
      if (!isPass1Only) {
        try {
          const stData = await pcoFetchAllLocal(
            `${PCO_API}/services/v2/service_types`,
            auth,
          );
          const stmts = [];
          for (const st of stData) {
            const pcoId = st.id;
            const name = st.attributes && st.attributes.name;
            if (!name) continue;

            const existing = await env.DB.prepare(
              "SELECT id, pco_id FROM service_types WHERE pco_id = ?",
            )
              .bind(pcoId)
              .first();
            if (existing) {
              stmts.push(
                env.DB.prepare(
                  "UPDATE service_types SET pco_updated_at = ? WHERE id = ?",
                ).bind(st.attributes.updated_at || null, existing.id),
              );
            } else {
              const byName = await env.DB.prepare(
                "SELECT id FROM service_types WHERE name = ? AND pco_id IS NULL",
              )
                .bind(name)
                .first();
              if (byName) {
                stmts.push(
                  env.DB.prepare(
                    "UPDATE service_types SET pco_id = ?, pco_updated_at = ? WHERE id = ?",
                  ).bind(pcoId, st.attributes.updated_at || null, byName.id),
                );
              } else {
                stmts.push(
                  env.DB.prepare(
                    "INSERT INTO service_types (name, pco_id, pco_updated_at) VALUES (?, ?, ?)",
                  ).bind(name, pcoId, st.attributes.updated_at || null),
                );
              }
            }
            results.service_types++;
          }
          if (stmts.length > 0) await env.DB.batch(stmts);
        } catch (e) {
          results.errors.push(`Service types: ${e.message}`);
        }
      }

      // 3b. Sync permanent team rosters from PCO (team_members)
      // For each PCO team, fetch the standing roster and upsert team_members
      if (!isPass1Only) {
        try {
          const localTeams =
            (
              await env.DB.prepare(
                "SELECT id, pco_id FROM teams WHERE pco_id IS NOT NULL",
              ).all()
            ).results || [];

          for (const team of localTeams) {
            try {
              const tmData = await pcoFetchAllLocal(
                `${PCO_API}/services/v2/teams/${team.pco_id}/team_members`,
                auth,
              );
              for (const tm of tmData) {
                const personPcoId = tm.relationships?.person?.data?.id;
                if (!personPcoId) continue;
                const position = tm.attributes?.site_team_leader
                  ? "leader"
                  : tm.attributes?.status || "member";
                // Look up local member by pco_id
                const localMember = await env.DB.prepare(
                  "SELECT id FROM members WHERE pco_id = ?",
                )
                  .bind(personPcoId)
                  .first();
                if (!localMember) continue; // member not synced yet, will be picked up later
                // Upsert team_member row
                await env.DB.prepare(
                  `INSERT INTO team_members (team_id, member_id, position)
                   VALUES (?, ?, ?)
                   ON CONFLICT(team_id, member_id) DO UPDATE SET position = excluded.position`,
                )
                  .bind(team.id, localMember.id, position)
                  .run();
              }
              results.teams = (results.teams || 0) + 1;
            } catch (e) {
              results.errors.push(`Team roster ${team.pco_id}: ${e.message}`);
            }
          }
        } catch (e) {
          results.errors.push(`Team members sync: ${e.message}`);
        }
      }

      // 4. Sync plans (upcoming 12 weeks) + plan_items + people
      if (!isPass1Only) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const twelveWeeks = new Date(Date.now() + 84 * 86400000)
            .toISOString()
            .slice(0, 10);
          const stList =
            (
              await env.DB.prepare(
                "SELECT id, pco_id FROM service_types WHERE pco_id IS NOT NULL",
              ).all()
            ).results || [];

          for (const stLocal of stList) {
            // Fetch plan_times for this service type with plan included
            const ptUrl = `${PCO_API}/services/v2/service_types/${stLocal.pco_id}/plan_times`;
            let ptData;
            let ptIncluded = []; // embedded plan data from include=plan
            try {
              // Use include=plan to embed plan data and avoid N+1 individual plan fetches
              const ptRaw = await pcoFetchLocal(
                `${ptUrl}?per_page=100&include=plan&filter%5Bstarts_at%5D=${today}..${twelveWeeks}`,
                auth,
              );
              ptData = ptRaw.data || [];
              ptIncluded = ptRaw.included || [];
            } catch (e) {
              console.error("pco-sync: fetch plan items failed, continuing", e);
              continue;
            }

            // Build a lookup map from included plans (pco plan id → attributes)
            const includedPlansMap = {};
            for (const inc of ptIncluded) {
              if (inc.type === "Plan")
                includedPlansMap[inc.id] = inc.attributes;
            }

            const pcoPlanIdsInWindow = new Set();
            const FETCH_BUDGET = 38; // stop before hitting the 50 subrequest limit

            for (const pt of ptData) {
              if (fetchCount >= FETCH_BUDGET) break; // budget exhausted, continue next sync
              await new Promise((r) => setTimeout(r, 50));
              const planRel =
                pt.relationships &&
                pt.relationships.plan &&
                pt.relationships.plan.data;
              if (!planRel) continue;
              const pcoPlanId = planRel.id;
              pcoPlanIdsInWindow.add(pcoPlanId);

              const startsAt = pt.attributes && pt.attributes.starts_at;
              if (!startsAt) continue;
              const date = startsAt.slice(0, 10);
              const time = startsAt.slice(11, 16);

              // Use plan data from included map (no extra fetch needed)
              const planAttrs = includedPlansMap[pcoPlanId] || {
                title: "",
                updated_at: null,
              };

              // Find plan by pco_id
              let planRow = await env.DB.prepare(
                "SELECT id, pco_id FROM plans WHERE pco_id = ?",
              )
                .bind(pcoPlanId)
                .first();

              if (!planRow) {
                // Fallback: date + time + service_type
                planRow = await env.DB.prepare(
                  "SELECT id, pco_id FROM plans WHERE date = ? AND time = ? AND service_type_id = ? AND pco_id IS NULL",
                )
                  .bind(date, time, stLocal.id)
                  .first();
              }

              const theme = planAttrs.title || "";

              if (planRow) {
                await env.DB.prepare(
                  "UPDATE plans SET service_type_id = ?, date = ?, time = ?, theme = ?, pco_id = ?, pco_updated_at = ?, pco_deleted_at = NULL WHERE id = ?",
                )
                  .bind(
                    stLocal.id,
                    date,
                    time,
                    theme,
                    pcoPlanId,
                    planAttrs.updated_at || null,
                    planRow.id,
                  )
                  .run();
                results.plans++;
              } else {
                const ins = await env.DB.prepare(
                  "INSERT INTO plans (service_type_id, date, time, theme, status, pco_id, pco_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                )
                  .bind(
                    stLocal.id,
                    date,
                    time,
                    theme,
                    "planned",
                    pcoPlanId,
                    planAttrs.updated_at || null,
                  )
                  .run();
                planRow = { id: ins.meta.last_row_id };
                results.plans++;
              }

              const planId = planRow.id;

              // 4a. Sync plan_items — delete & re-insert for this plan
              try {
                await new Promise((r) => setTimeout(r, 100));
                const itemsData = await pcoFetchAllLocal(
                  `${PCO_API}/services/v2/plans/${pcoPlanId}/items`,
                  auth,
                );

                await env.DB.prepare("DELETE FROM plan_items WHERE plan_id = ?")
                  .bind(planId)
                  .run();

                for (const item of itemsData) {
                  const attrs = item.attributes || {};
                  if (attrs.item_type === "break") continue;

                  const typeMap = {
                    song: "song",
                    header: "header",
                    media: "media",
                    announcement: "announcement",
                  };
                  const itemType = typeMap[attrs.item_type] || "header";

                  const ins = await env.DB.prepare(
                    "INSERT INTO plan_items (plan_id, type, title, description, position, length_minutes, pco_id, pco_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  )
                    .bind(
                      planId,
                      itemType,
                      attrs.title || "",
                      attrs.description || "",
                      attrs.position || 0,
                      attrs.length_minutes || null,
                      item.id,
                      attrs.updated_at || null,
                    )
                    .run();
                  results.plan_items++;

                  // Link song items to arrangements via plan_songs
                  if (attrs.item_type === "song") {
                    const arrRel =
                      item.relationships &&
                      item.relationships.arrangement &&
                      item.relationships.arrangement.data;
                    if (arrRel) {
                      const arrRow = await env.DB.prepare(
                        "SELECT id FROM arrangements WHERE pco_id = ?",
                      )
                        .bind(arrRel.id)
                        .first();
                      if (arrRow) {
                        await env.DB.prepare(
                          "INSERT OR IGNORE INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)",
                        )
                          .bind(
                            ins.meta.last_row_id,
                            arrRow.id,
                            attrs.key || null,
                          )
                          .run();
                      }
                    }
                  }
                }
              } catch (e) {
                results.errors.push(`Plan items ${pcoPlanId}: ${e.message}`);
              }

              // 4b. Sync people for this plan
              try {
                await new Promise((r) => setTimeout(r, 100));
                const peopleData = await pcoFetchAllLocal(
                  `${PCO_API}/services/v2/plans/${pcoPlanId}/team_members`,
                  auth,
                );

                for (const p of peopleData) {
                  const pAttrs = p.attributes || {};
                  const personName =
                    `${pAttrs.first_name || ""} ${pAttrs.last_name || ""}`.trim() ||
                    "";
                  const status = pAttrs.status || "pending";
                  const teamName = pAttrs.team_name || pAttrs.team || "";
                  const role = pAttrs.role || "";
                  const pcoPersonRel =
                    p.relationships &&
                    p.relationships.person &&
                    p.relationships.person.data;
                  const pcoPersonId = pcoPersonRel && pcoPersonRel.id;
                  if (!pcoPersonId) continue;

                  // Find or create member by pco_id, fallback name
                  let memberRow = await env.DB.prepare(
                    "SELECT id, pco_id FROM members WHERE pco_id = ?",
                  )
                    .bind(pcoPersonId)
                    .first();
                  if (!memberRow && personName) {
                    const [firstName, ...lastNameParts] = personName.split(" ");
                    const lastName = lastNameParts.join(" ") || "";
                    memberRow = await env.DB.prepare(
                      "SELECT id FROM members WHERE first_name = ? AND last_name = ? AND pco_id IS NULL",
                    )
                      .bind(firstName, lastName)
                      .first();
                    if (!memberRow && firstName) {
                      const ins = await env.DB.prepare(
                        "INSERT INTO members (first_name, last_name, pco_id) VALUES (?, ?, ?)",
                      )
                        .bind(firstName, lastName, pcoPersonId)
                        .run();
                      memberRow = { id: ins.meta.last_row_id };
                    }
                  }

                  if (memberRow) {
                    if (!memberRow.pco_id) {
                      await env.DB.prepare(
                        "UPDATE members SET pco_id = ? WHERE id = ?",
                      )
                        .bind(pcoPersonId, memberRow.id)
                        .run();
                    }

                    // Find or create team by pco_id, fallback name
                    let teamRow = null;
                    if (teamName) {
                      const pcoTeamRel =
                        p.relationships &&
                        p.relationships.team &&
                        p.relationships.team.data;
                      const pcoTeamId = pcoTeamRel && pcoTeamRel.id;
                      if (pcoTeamId) {
                        teamRow = await env.DB.prepare(
                          "SELECT id FROM teams WHERE pco_id = ?",
                        )
                          .bind(pcoTeamId)
                          .first();
                      }
                      if (!teamRow) {
                        teamRow = await env.DB.prepare(
                          "SELECT id FROM teams WHERE name = ? AND pco_id IS NULL",
                        )
                          .bind(teamName)
                          .first();
                      }
                      if (!teamRow) {
                        const ins = await env.DB.prepare(
                          "INSERT INTO teams (name, pco_id) VALUES (?, ?)",
                        )
                          .bind(teamName, pcoTeamId || null)
                          .run();
                        teamRow = { id: ins.meta.last_row_id };
                      }
                    }

                    await env.DB.prepare(
                      "INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status, pco_id) VALUES (?, ?, ?, ?, ?, ?)",
                    )
                      .bind(
                        planId,
                        memberRow.id,
                        teamRow ? teamRow.id : null,
                        role,
                        status,
                        pcoPersonId,
                      )
                      .run();
                    results.people++;
                  }
                }
              } catch (e) {
                results.errors.push(`People ${pcoPlanId}: ${e.message}`);
              }
            }

            // 4c. Soft-delete plans with pco_id not in PCO window (planned/future only)
            if (pcoPlanIdsInWindow.size > 0) {
              const placeholders = [...pcoPlanIdsInWindow]
                .map(() => "?")
                .join(",");
              const delRes = await env.DB.prepare(
                `UPDATE plans SET pco_deleted_at = datetime('now') WHERE service_type_id = ? AND pco_id IS NOT NULL AND pco_id NOT IN (${placeholders}) AND status = 'planned' AND pco_deleted_at IS NULL`,
              )
                .bind(stLocal.id, ...pcoPlanIdsInWindow)
                .run();
              if (delRes.meta.changes > 0)
                results.deleted += delRes.meta.changes;
            }
          }
        } catch (e) {
          results.errors.push(`Plans: ${e.message}`);
        }
      }

      // 5. Sync songs + arrangements (incremental if lastSyncAt exists)
      // Patch 1: determine sync phase (pass1 = songs-only, pass2 = arrangements-only)
      // phase and songsToUpdate were already read earlier (earlyPhaseRow / songsToUpdateRowEarly)
      let isPass2 =
        phase === "pass2" ||
        (Array.isArray(songsToUpdate) && songsToUpdate.length > 0);

      if (!isPass2) {
        try {
          // Pass1 minimal: single minimal fetch per invocation (no expansions, no follow-ups)
          const songOffsetRow = await env.DB.prepare(
            "SELECT value FROM sync_state WHERE key = 'pco_song_offset'",
          ).first();
          let offset =
            songOffsetRow && songOffsetRow.value
              ? parseInt(songOffsetRow.value, 10)
              : 0;
          const perPage = 25; // batch songs to reduce subrequests
          // Request minimal fields if supported by PCO to avoid expansions (fields param optional)
          const params = { per_page: String(perPage) };
          if (lastSyncAt) {
            params["filter[updated_at][since]"] = lastSyncAt;
          }
          // songs list to update for pass2
          let songsToUpdateList = Array.isArray(songsToUpdate)
            ? songsToUpdate
            : [];
          while (true) {
            const sp = new URLSearchParams({
              per_page: String(perPage),
              ...params,
              offset: String(offset),
            });
            await new Promise((r) => setTimeout(r, 100));
            // Minimal fetch: avoid includes/expansions, get only essentials (id, updated_at)
            const songsRes = await fetchWithDiagnostics(
              `${PCO_API}/services/v2/songs?${sp.toString()}`,
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                  "User-Agent": "EgliseApp/1.0",
                },
              },
            );
            if (!songsRes.ok) {
              results.errors.push(`Songs offset ${offset}: ${songsRes.status}`);
              break;
            }
            const songsData = await songsRes.json();
            const songsList = songsData.data || [];
            if (songsList.length === 0) break;

            let songFetches = 0;
            let arrFetches = 0;
            let stopForLimits = false;
            for (const s of songsList) {
              if (songFetches >= 1) {
                stopForLimits = true;
                break;
              }
              songFetches++;
              const pcoSongId = s.id;
              const title = s.attributes && s.attributes.title;
              if (!title) continue;

              let songRow = await env.DB.prepare(
                "SELECT id, pco_id FROM songs WHERE pco_id = ?",
              )
                .bind(pcoSongId)
                .first();
              if (!songRow) {
                songRow = await env.DB.prepare(
                  "SELECT id, pco_id FROM songs WHERE title = ? AND pco_id IS NULL",
                )
                  .bind(title)
                  .first();
              }

              const author = s.attributes ? s.attributes.author || null : null;
              const ccli = s.attributes
                ? s.attributes.ccli_number || null
                : null;
              const copyright = s.attributes
                ? s.attributes.copyright || null
                : null;
              const updatedAt = s.attributes
                ? s.attributes.updated_at || null
                : null;
              const themes = s.attributes
                ? s.attributes.themes || null
                : null;

              let songId;
              if (!songRow) {
                const ins = await env.DB.prepare(
                  "INSERT INTO songs (title, author, ccli_number, copyright, themes, pco_id, pco_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                )
                  .bind(title, author, ccli, copyright, themes, pcoSongId, updatedAt)
                  .run();
                songId = ins.meta.last_row_id;
                results.songs++;
              } else {
                songId = songRow.id;
                if (!songRow.pco_id) {
                  await env.DB.prepare(
                    "UPDATE songs SET pco_id = ?, pco_updated_at = ?, copyright = COALESCE(copyright, ?), themes = COALESCE(themes, ?) WHERE id = ?",
                  )
                    .bind(pcoSongId, updatedAt, copyright, themes, songId)
                    .run();
                } else {
                  await env.DB.prepare(
                    "UPDATE songs SET pco_updated_at = ?, copyright = COALESCE(copyright, ?), themes = COALESCE(themes, ?) WHERE id = ?",
                  )
                    .bind(updatedAt, copyright, themes, songId)
                    .run();
                }
              }

              // Pass1: mark song for arrangements update if new or updated (no arrangements fetched here)
              try {
                const meta = await env.DB.prepare(
                  "SELECT pco_updated_at FROM songs WHERE id = ?",
                )
                  .bind(songId)
                  .first();
                const existingUpdated =
                  meta && meta.pco_updated_at ? meta.pco_updated_at : null;
                if (
                  !existingUpdated ||
                  (updatedAt && updatedAt !== existingUpdated)
                ) {
                  songsToUpdateList.push(pcoSongId);
                }
              } catch (e) {
                results.errors.push(`Songs mark ${pcoSongId}: ${e.message}`);
              }
            }

            offset += perPage;
            // persist offset and songsToUpdateList for next run
            await env.DB.prepare(
              "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_song_offset', ?)",
            )
              .bind(String(offset))
              .run();
            await env.DB.prepare(
              "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('songs_to_update', ?)",
            )
              .bind(JSON.stringify(songsToUpdateList))
              .run();
            if (stopForLimits) {
              break;
            }
            if (songsList.length < perPage) {
              // switch to pass2 when done collecting
              await env.DB.prepare(
                "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'pass2')",
              ).run();
              // reset offset
              await env.DB.prepare(
                "DELETE FROM sync_state WHERE key = 'pco_song_offset'",
              ).run();
              break;
            }
          }
        } catch (e) {
          results.errors.push(`Songs: ${e.message}`);
        }
      }

      // 6. Pass2: process songs_to_update (arrangements-only)
      if (isPass2) {
        try {
          const songsRow = await env.DB.prepare(
            "SELECT value FROM sync_state WHERE key = 'songs_to_update'",
          ).first();
          let queue =
            songsRow && songsRow.value ? JSON.parse(songsRow.value) : [];
          if (Array.isArray(queue) && queue.length > 0) {
            const batchSize = 20;
            const toProcess = queue.slice(0, batchSize);
            const remaining = queue.slice(batchSize);
            for (const pcoSongId of toProcess) {
              // fetch arrangements for the song
              const arrRes = await fetchWithDiagnostics(
                `${PCO_API}/services/v2/songs/${pcoSongId}/arrangements?per_page=100`,
                {
                  headers: {
                    Authorization: `Basic ${auth}`,
                    "User-Agent": "EgliseApp/1.0",
                  },
                },
              );
              if (!arrRes.ok) {
                results.errors.push(
                  `Arrangements ${pcoSongId}: ${arrRes.status}`,
                );
                continue;
              }
              const arrJson = await arrRes.json();
              const arrData = arrJson.data || [];
              const songRow = await env.DB.prepare(
                "SELECT id FROM songs WHERE pco_id = ?",
              )
                .bind(pcoSongId)
                .first();
              if (!songRow) {
                results.errors.push(
                  `Arrangements skip ${pcoSongId}: local song not found`,
                );
                continue;
              }
              const songId = songRow.id;
              // Upsert: update existing by pco_id, insert new — preserves id for plan_songs FK
              for (const a of arrData) {
                const aId = a.id;
                const title =
                  a.attributes && a.attributes.title
                    ? a.attributes.title
                    : `arr-${aId}`;
                const content =
                  (a.attributes &&
                    (a.attributes.chord_chart || a.attributes.body)) ||
                  null;
                const updatedAt =
                  (a.attributes && a.attributes.updated_at) || null;
                const key = (a.attributes && a.attributes.key) || null;
                const tempo = (a.attributes && a.attributes.tempo) || null;
                const exists = await env.DB.prepare(
                  "SELECT id FROM arrangements WHERE pco_id = ?",
                )
                  .bind(aId)
                  .first();
                if (exists) {
                  await env.DB.prepare(
                    "UPDATE arrangements SET name = ?, key = ?, tempo = ?, chord_chart = ?, pco_updated_at = ? WHERE id = ?",
                  )
                    .bind(title, key, tempo, content, updatedAt, exists.id)
                    .run();
                } else {
                  await env.DB.prepare(
                    "INSERT INTO arrangements (song_id, pco_id, name, key, tempo, chord_chart, pco_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  )
                    .bind(songId, aId, title, key, tempo, content, updatedAt)
                    .run();
                }
                results.arrangements++;
              }
            }
            // persist remaining queue
            await env.DB.prepare(
              "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('songs_to_update', ?)",
            )
              .bind(JSON.stringify(remaining))
              .run();
            if (remaining.length > 0) {
              await env.DB.prepare(
                "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'pass2')",
              ).run();
              if (!request.headers.get("x-internal-sync")) {
                try {
                  await fetch(request.url, {
                    method: "POST",
                    headers: {
                      "x-internal-sync": "1",
                      "Content-Type": "application/json",
                    },
                    body: "{}",
                  });
                } catch (e) {
                  console.error("internal sync trigger failed (pass2)", e);
                }
              }
            } else {
              // finished
              await env.DB.prepare(
                "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'idle')",
              ).run();
              const now = new Date().toISOString();
              await env.DB.prepare(
                "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_last_sync_at', ?)",
              )
                .bind(now)
                .run();
            }
          } else {
            // nothing to do, mark idle
            await env.DB.prepare(
              "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_sync_phase', 'idle')",
            ).run();
            const now = new Date().toISOString();
            await env.DB.prepare(
              "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_last_sync_at', ?)",
            )
              .bind(now)
              .run();
          }
        } catch (e) {
          results.errors.push(`Pass2: ${e.message}`);
        }
      } else {
        // 6. Save last sync time (no pass2 running)
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('pco_last_sync_at', ?)",
        )
          .bind(now)
          .run();
        // If we have more songs to process, trigger another run (internal) to continue chunked sync.
        const moreRow = await env.DB.prepare(
          "SELECT value FROM sync_state WHERE key = 'pco_song_offset'",
        ).first();
        if (
          moreRow &&
          moreRow.value &&
          !request.headers.get("x-internal-sync")
        ) {
          try {
            await fetch(request.url, {
              method: "POST",
              headers: {
                "x-internal-sync": "1",
                "Content-Type": "application/json",
              },
              body: "{}",
            });
          } catch (e) {
            console.error("internal sync trigger failed (more songs)", e);
          }
        }
      }
    } catch (e) {
      return json({ error: e.message, results }, 500);
    } finally {
      // release DB lock — we do not modify global fetch anymore
      await releaseSyncLock(env);
    }

    // attach diagnostic info
    results.debug = { fetchCount, fetchUrls };
    return json({ success: true, results });
  }),

  // ========================================
  // PCO PEOPLE SYNC — enrich members with email/phone from PCO People API
  // Admin only (contains personal data — RGPD sensitive)
  // ========================================
  route("POST", "/api/pco-sync-people", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const caller = await getMemberFromRequest(request, env);
    if (caller.role !== "admin")
      return json({ error: "Seuls les administrateurs peuvent synchroniser les données personnelles" }, 403);

    const token_id = env.PCO_TOKEN_ID;
    const token_secret = env.PCO_TOKEN_SECRET;
    if (!token_id || !token_secret)
      return json({ error: "PCO credentials not configured" }, 500);
    const auth = btoa(`${token_id}:${token_secret}`);
    const PCO_API = "https://api.planningcenteronline.com";

    const results = { matched: 0, updated: 0, created: 0, errors: [] };

    // Fetch all people from PCO People API with emails + phone numbers included
    let offset = 0;
    const perPage = 100;
    while (true) {
      const sp = new URLSearchParams({
        per_page: String(perPage),
        include: "emails,phone_numbers",
        offset: String(offset),
      });
      let pcoRes;
      try {
        pcoRes = await pcoFetch(`${PCO_API}/people/v2/people?${sp.toString()}`, auth);
      } catch (e) {
        results.errors.push(`Fetch page ${offset / perPage + 1}: ${e.message}`);
        break;
      }
      const people = pcoRes.data || [];
      const included = pcoRes.included || [];

      for (const person of people) {
        const pcoId = person.id;
        const attrs = person.attributes || {};
        const firstName = (attrs.first_name || "").trim();
        const lastName = (attrs.last_name || "").trim();
        if (!firstName && !lastName) continue;

        // Extract primary email and phone from included data
        const relationships = person.relationships || {};
        const emailIds = relationships.emails?.data?.map((e) => e.id) || [];
        const phoneIds = relationships.phone_numbers?.data?.map((p) => p.id) || [];
        const primaryEmail = included
          .filter((i) => i.type === "Email" && emailIds.includes(i.id))
          .sort((a, b) => (b.attributes?.primary ? 1 : 0) - (a.attributes?.primary ? 1 : 0))
          .map((i) => i.attributes?.address)
          .find(Boolean) || null;
        const primaryPhone = included
          .filter((i) => i.type === "PhoneNumber" && phoneIds.includes(i.id))
          .sort((a, b) => (b.attributes?.primary ? 1 : 0) - (a.attributes?.primary ? 1 : 0))
          .map((i) => i.attributes?.number)
          .find(Boolean) || null;

        // Look for existing member by pco_id first, then by name
        const existing = await env.DB.prepare(
          "SELECT id, email, phone FROM members WHERE pco_id = ?",
        ).bind(pcoId).first();
        let memberId;

        if (existing) {
          memberId = existing.id;
          results.matched++;
          // Update email/phone only if not already set or if we have new data
          const newEmail = primaryEmail || existing.email;
          const newPhone = primaryPhone || existing.phone;
          if (newEmail !== existing.email || newPhone !== existing.phone) {
            await env.DB.prepare(`
              UPDATE members SET email = ?, phone = ?, data_origin = 'pco_people', updated_at = datetime('now')
              WHERE id = ?
            `).bind(newEmail, newPhone, memberId).run();
            results.updated++;
          }
        } else {
          // Try to find by name (first_name + last_name match)
          const byName = await env.DB.prepare(
            "SELECT id, email, phone FROM members WHERE first_name = ? AND last_name = ? AND pco_id IS NULL",
          ).bind(firstName, lastName).first();
          if (byName) {
            memberId = byName.id;
            results.matched++;
            await env.DB.prepare(`
              UPDATE members SET pco_id = ?, email = ?, phone = ?, data_origin = 'pco_people', updated_at = datetime('now')
              WHERE id = ?
            `).bind(pcoId, primaryEmail || byName.email, primaryPhone || byName.phone, memberId).run();
            results.updated++;
          }
        }
      }

      if (people.length < perPage) break;
      offset += perPage;
    }

    return json({ success: true, results });
  }),

  // Backup (dump data as JSON)
  route("GET", "/api/backup", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const tables = [
      "members",
      "teams",
      "team_members",
      "service_types",
      "plans",
      "plan_items",
      "songs",
      "arrangements",
      "plan_songs",
      "scheduled_people",
      "attendances",
      "house_groups",
      "group_members",
      "group_meetings",
      "email_templates",
      "email_logs",
      "communication_preferences",
      "notification_tokens",
      "plan_templates",
      "plan_template_items",
      "volunteer_preferences",
      "polls",
      "poll_options",
      "poll_votes",
      "announcements",
      "church_events",
    ];
    const backup = {};
    for (const table of tables) {
      try {
        const rows = await env.DB.prepare(
          `SELECT * FROM ${table} LIMIT 5000`,
        ).all();
        backup[table] = rows.results;
        if (backup[table].length >= 5000) {
          backup[table] = backup[table].concat([
            {
              _truncated: true,
              message: `Tronqué à 5000 lignes — utilisez l\'export CSV pour les données complètes`,
            },
          ]);
        }
      } catch (e) {
        backup[table] = [];
      }
    }
    const jsonStr = JSON.stringify(backup);
    if (jsonStr.length > 10 * 1024 * 1024) {
      return json(
        {
          error:
            "Backup trop volumineux (>10MB). Utilisez les exports CSV par module.",
        },
        413,
      );
    }
    return new Response(jsonStr, {
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eglise-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }),
];

#!/usr/bin/env node
/**
 * Standalone PCO → D1 arrangements sync.
 *
 * Bypasses the Cloudflare Worker timeout by reading/writing D1 directly
 * via the Cloudflare API. Processes all songs in batches of 20.
 *
 * Usage:
 *   node scripts/pco-sync-arrangements.mjs
 *
 * Requires (in env or .env):
 *   PCO_TOKEN_ID, PCO_TOKEN_SECRET, CF_API_TOKEN
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── 1. Load env ─────────────────────────────────────
function loadEnv() {
  for (const p of [".env", "frontend/.env"]) {
    const envPath = resolve(ROOT, p);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const PCO_TOKEN_ID = process.env.PCO_TOKEN_ID;
const PCO_TOKEN_SECRET = process.env.PCO_TOKEN_SECRET;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

if (!PCO_TOKEN_ID || !PCO_TOKEN_SECRET) {
  console.error("Missing PCO_TOKEN_ID or PCO_TOKEN_SECRET in .env");
  process.exit(1);
}
if (!CF_API_TOKEN) {
  console.error("Missing CF_API_TOKEN in .env");
  process.exit(1);
}

// ── 2. Config ───────────────────────────────────────
const CF_ACCOUNT = "c6408608867f869f85cc16572418424a";
const CF_DB_ID = "38d955d1-b300-445e-b06e-cfd9b1b953f0";
const PCO_API = "https://api.planningcenteronline.com";
const AUTH = btoa(`${PCO_TOKEN_ID}:${PCO_TOKEN_SECRET}`);
const BATCH = 20;

// ── 3. Helpers ──────────────────────────────────────
async function d1Query(sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${CF_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`D1 error: ${JSON.stringify(json.errors)}`);
  }
  return json.result?.[0] || {};
}

async function pcoFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${AUTH}`, "User-Agent": "EgliseApp/1.0" },
  });
  if (!res.ok) throw new Error(`PCO ${url}: ${res.status}`);
  return res.json();
}

// ── 4. Main ─────────────────────────────────────────
async function main() {
  console.log("PCO → D1 arrangement sync");
  console.log("─".repeat(50));

  // 4a. Read all songs with pco_id from D1
  console.log("Reading songs from D1 …");
  const songsResult = await d1Query(
    "SELECT id, pco_id, title FROM songs WHERE pco_id IS NOT NULL ORDER BY title ASC",
  );
  const songs = songsResult.results || [];
  console.log(`Found ${songs.length} songs with pco_id`);

  if (songs.length === 0) {
    console.log("Nothing to sync.");
    return;
  }

  let totalArr = 0;
  let errors = 0;

  // 4b. Process in batches
  for (let i = 0; i < songs.length; i += BATCH) {
    const batch = songs.slice(i, i + BATCH);
    console.log(`\nBatch ${Math.floor(i / BATCH) + 1}/${Math.ceil(songs.length / BATCH)} (${batch.length} songs)`);

    for (const song of batch) {
      try {
        // Fetch arrangements from PCO
        const arrJson = await pcoFetch(
          `${PCO_API}/services/v2/songs/${song.pco_id}/arrangements?per_page=100`,
        );
        const arrData = arrJson.data || [];

        if (arrData.length === 0) {
          console.log(`  ${song.title} → 0 arrangements`);
          continue;
        }

        // Delete existing arrangements for this song
        await d1Query("DELETE FROM arrangements WHERE song_id = ?", [song.id]);

        // Insert arrangements
        for (const a of arrData) {
          const attrs = a.attributes || {};
          await d1Query(
            `INSERT INTO arrangements (song_id, pco_id, name, key, tempo, chord_chart, pco_updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              song.id,
              a.id,
              attrs.title || `arr-${a.id}`,
              attrs.key || null,
              attrs.tempo != null ? attrs.tempo : null,
              attrs.chord_chart || attrs.body || null,
              attrs.updated_at || null,
            ],
          );
          totalArr++;
        }
        console.log(`  ${song.title} → ${arrData.length} arrangements`);
      } catch (e) {
        errors++;
        console.error(`  ${song.title} → ERROR: ${e.message}`);
      }
    }

    // Brief pause between batches to avoid rate limits
    if (i + BATCH < songs.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`Done: ${totalArr} arrangements imported, ${errors} errors`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

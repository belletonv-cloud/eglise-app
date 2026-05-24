Music Service (minimal)

Run locally with Wrangler (Cloudflare Workers):

1. Install dependencies

   npm install

2. Set environment variables required for local D1 binding and dev auth (example):

   export CF_ACCOUNT_ID=your-account-id
   export DB_CONNECTION_STRING="file:./dev.sqlite" # for wrangler d1 local usage or configure via Wrangler dashboard
   export DEV_AUTH_SECRET=changeme

3. Start wrangler locally (preview)

   # Use your account id or fill music-service/wrangler.toml
   npx wrangler dev music-service/worker.ts --local

4. Deploy to staging

   # Fill account_id and database_id in music-service/wrangler.toml first.
   npx wrangler publish --env staging

5. Test endpoints locally / on staging

   # Local preview (wrangler dev default port)
   curl http://127.0.0.1:8787/music-service/songs
   curl http://127.0.0.1:8787/music-service/songs/101

   # Staging (after publish) — use your worker URL or configured route
   curl https://music-service-staging.YOUR_ACCOUNT.workers.dev/music-service/songs

Notes:
- The worker binds a D1 database via the `DB` binding declared in music-service/wrangler.toml.
- For staging, set the `database_id` to the target D1 instance.
- The service expects the same schema as the monolith (songs, arrangements, arrangement_annotations, attachments, plan_songs).
- If you need a D1 instance you can create one with `wrangler d1 create <name>` then add the generated id to the config.

Quick D1 create snippet:

  npx wrangler d1 create eglise_db --project music-service
  # then add the returned database_id to music-service/wrangler.toml

Deploy checklist (what to run locally)

1) Confirm Wrangler is authenticated and can access your account:

   npx wrangler whoami

2) (Optional) Create a D1 database and note the database_id:

   npx wrangler d1 create eglise_db --project music-service

   # copy the returned database id and paste it into music-service/wrangler.toml under database_id

3) Fill music-service/wrangler.toml:

   - account_id = "<YOUR_ACCOUNT_ID>"
   - [[env.staging.d1_databases]] database_id = "<YOUR_D1_DATABASE_ID>"

4) Run a local preview (optional quick smoke):

   npx wrangler dev music-service/worker.ts --local

   # verify health locally
   curl http://127.0.0.1:8787/music-service/health

5) Publish to staging:

   npx wrangler publish --env staging

6) Smoke test staging (replace with your staging URL):

   curl https://music-service-staging.YOUR_ACCOUNT.workers.dev/music-service/health
   curl https://music-service-staging.YOUR_ACCOUNT.workers.dev/music-service/songs

Troubleshooting

- If publish fails with authentication errors, run `npx wrangler login` and retry.
- If D1 binding errors appear, ensure `database_id` is set in the env.staging.d1_databases block.
- Use `npx wrangler tail --env staging --service music-service` to stream logs and verify startup messages.

# Secret Scan Report

Generated: automatic scan of repository for high-confidence secret patterns.

Summary (critical)
- .env (root): contains Planning Center PAT and ID. Revoke/regenerate immediately.
- frontend/.env: contains Firebase API key (client) and VAPID public key. Review Firebase restrictions; VAPID public key is safe to keep public.

Findings (by file)

- .env
  - PCO_TOKEN_ID (appears to be an ID)
  - PCO_TOKEN_SECRET (contains pco_pat_... PAT)

- frontend/.env
  - VITE_FIREBASE_API_KEY (AIza...)
  - VITE_API_BASE (points to https://eglise-app.belletonv.workers.dev/api)
  - VITE_VAPID_PUBLIC_KEY (public VAPID key)

- src/index.js
  - References to RESEND_API_KEY (email provider)
  - References to INFOMANIAK_TOKEN (kDrive/Infomaniak token)
  - References to ONECLICK_SECRET (one-click token signing)
  - References to FCM_SERVICE_ACCOUNT (Firebase service account JSON)
  - References to EMAIL_FROM (admin email config)

- frontend/dist (was present in history)
  - Built artifacts sometimes contained client keys; frontend/dist has been purged from history as requested.

Notes on false positives
- Many matches found in package-lock.json and node_modules are integrity hashes or vendor-supplied samples and are NOT application secrets.
- Some long strings in third-party bundles (e.g. wrapped private-key examples) are vendor samples; they do not constitute leaked project secrets.

Immediate recommended actions (in order)
1. Revoke and rotate the Planning Center PAT (PCO_TOKEN_SECRET) and update deployment secrets.
2. Rotate or restrict the Resend API key, Infomaniak token, FCM server key, ONECLICK_SECRET if they were stored in files or exposed.
3. For Firebase API key (client key): restrict HTTP referrers in Google Cloud Console to the app's domain(s) if possible.
4. Update secrets in deployments: Cloudflare Workers (wrangler secrets), GitHub Actions repo secrets, Cloudflare Pages/Vercel/Netlify env, etc.

Helpful commands/examples
- Set a Cloudflare Worker secret (example)
  echo -n 'NEW_VALUE' | wrangler secret put PCO_TOKEN_SECRET

- Set a GitHub repo secret via gh (example)
  echo -n 'NEW_VALUE' | gh secret set PCO_TOKEN_SECRET --repo belletonv-cloud/eglise-app

- Install the local secret-scan hook that was added to the repo
  npm run install-hooks

Next steps taken by me
- I purged selected paths from the repository history and force-pushed the cleaned history (mirror backup retained).
- I added frontend/.env.example and a minimal .githooks/pre-commit script that scans for common secret patterns.

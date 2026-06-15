// FCM v1 HTTP API helper for Cloudflare Workers
// Uses service account JWT to obtain OAuth2 tokens

let cachedToken = null;
let tokenExpiry = 0;

function base64UrlEncode(buf) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(serviceAccount) {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

  const { client_email, private_key } = serviceAccount;
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    iss: client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })));

  const pemHeader = "-----BEGIN PRIVATE KEY-----\n";
  const pemFooter = "\n-----END PRIVATE KEY-----";
  let pem = private_key;
  if (pem.includes(pemHeader)) pem = pem.replace(pemHeader, "").replace(pemFooter, "").trim();
  const binaryDer = Uint8Array.from(atob(pem.replace(/\s/g, "")), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" }, key,
    new TextEncoder().encode(`${header}.${claim}`),
  );
  const jwt = `${header}.${claim}.${base64UrlEncode(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth2 token error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in;
  return cachedToken;
}

function getProjectId(serviceAccount) {
  return serviceAccount.project_id;
}

function buildV1Payload(token, title, message, data) {
  const msg = { token, notification: { title, body: message } };
  if (data) msg.data = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
  return { message: msg };
}

export async function sendFcmV1(serviceAccount, tokens, title, message, data) {
  const accessToken = await getAccessToken(serviceAccount);
  const projectId = getProjectId(serviceAccount);

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const token of tokens) {
    try {
      const payload = buildV1Payload(token, title, message, data);
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (res.ok && !body.error) sent++;
      else {
        failed++;
        errors.push({
          token: token.slice(0, 20) + "...",
          status: res.status,
          error: body.error?.status || body.error?.message || JSON.stringify(body),
        });
      }
    } catch (e) {
      failed++;
      errors.push({ token: token.slice(0, 20) + "...", error: e.message });
    }
  }

  return { sent, failed, errors };
}

export async function sendFcmV1FireAndForget(serviceAccount, token, title, message, data) {
  try {
    await sendFcmV1(serviceAccount, [token], title, message, data);
  } catch (e) {
    console.error("FCM v1 send failed", e);
  }
}

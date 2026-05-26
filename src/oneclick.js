// One-click token helpers (Web Crypto API only — no Node.js dependency)

export async function signOneClickToken(payloadJson, secret) {
  const enc = new TextEncoder()
  const keyData = enc.encode(secret)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadJson))
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return btoa(payloadJson) + '.' + b64
}

export async function verifyOneClickToken(token, secret) {
  try {
    const [b64payload, b64sig] = token.split('.')
    if (!b64payload || !b64sig) return null
    const payloadJson = atob(b64payload)

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sig = Uint8Array.from(atob(b64sig), c => c.charCodeAt(0))
    const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payloadJson))
    if (!ok) return null
    return JSON.parse(payloadJson)
  } catch {
    return null
  }
}

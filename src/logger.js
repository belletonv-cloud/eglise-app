// API request logging for Église App

export async function logApiCall(request, env, response, duration, error) {
  try {
    const status = response ? response.status : 500
    const errMsg = error
      ? error.message
      : (response && response.status >= 400
        ? await response.clone().text().catch(() => '')
        : null)
    await env.DB.prepare(
      'INSERT INTO api_logs (method, path, status, duration, error) VALUES (?, ?, ?, ?, ?)'
    ).bind(request.method, new URL(request.url).pathname, status, duration, errMsg).run()
  } catch (e) { console.error('api log insert failed', e) }
}

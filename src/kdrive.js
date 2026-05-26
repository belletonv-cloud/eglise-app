// kDrive (Infomaniak) storage helpers

const KDRIVE_API = 'https://api.infomaniak.com'

export async function getKdriveToken(env) {
  if (!env.INFOMANIAK_TOKEN) {
    throw new Error('INFOMANIAK_TOKEN not configured')
  }
  return env.INFOMANIAK_TOKEN
}

export async function kdriveUpload(env, file, filename) {
  const token = await getKdriveToken(env)
  const driveId = env.KDRIVE_DRIVE_ID || '3066287'
  const parentId = env.KDRIVE_PARENT_ID || '9'
  const size = file.size
  const buf = await file.arrayBuffer()
  const url = `${KDRIVE_API}/3/drive/${driveId}/upload?directory_id=${parentId}&total_size=${size}&file_name=${encodeURIComponent(filename)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buf,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`kDrive upload failed: ${err}`)
  }
  return res.json()
}

export async function kdriveGet(env, fileId) {
  const token = await getKdriveToken(env)
  const url = `${KDRIVE_API}/3/drive/${env.KDRIVE_DRIVE_ID || '3066287'}/files/${fileId}/download`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('kDrive download failed')
  return res
}

export async function kdriveDelete(env, fileId) {
  const token = await getKdriveToken(env)
  const url = `${KDRIVE_API}/3/drive/${env.KDRIVE_DRIVE_ID || '3066287'}/files/${fileId}`
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('kDrive delete failed')
  return true
}

export function kdriveParseId(url) {
  const m = url.match(/kdrive:\/\/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

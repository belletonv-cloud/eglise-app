import type { Member } from '../utils/types'
import { getApiBase, authenticatedFetch, api } from '../utils/api'

export interface GetMembersResult {
  members: Member[]
  total: number
}

export async function getMembers(params: {
  page: number
  limit: number
  q?: string
  teamId?: number | null
}): Promise<GetMembersResult> {
  const { page, limit, q, teamId } = params
  const base = getApiBase()
  const qs = new URLSearchParams({
    page: String(page),
    size: String(limit),
  })
  if (q?.trim()) qs.set('q', q.trim())
  if (teamId && teamId > 0) qs.set('teamId', String(teamId))
  try {
    const res = await authenticatedFetch(`${base}/api/members?${qs.toString()}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      return { members: data, total: data.length }
    }
    return {
      members: data.data ?? data.members ?? data.items ?? [],
      total: data.totalCount ?? data.total ?? (data.data?.length ?? 0),
    }
  } catch {
    const mock = await api.getMembers()
    const items = mock?.data ?? []
    return { members: items, total: mock?.totalCount ?? items.length }
  }
}

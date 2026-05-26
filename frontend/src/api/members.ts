import type { Member } from '../utils/types'
import { getApiBase } from '../utils/api'

export interface GetMembersResult {
  members: Member[]
  total: number
}

export async function getMembers(params: { page: number; limit: number }): Promise<GetMembersResult> {
  const { page, limit } = params
  const base = getApiBase()
  const res = await fetch(`${base}/members?page=${page}&limit=${limit}`)
  const data = await res.json()

  // Legacy fallback: array only
  if (Array.isArray(data)) {
    return {
      members: data,
      total: data.length,
    }
  }

  // API standard: { items, total } ou { members, total }
  return {
    members: data.members ?? data.items ?? [],
    total: data.total ?? (data.members?.length ?? data.items?.length ?? 0),
  }
}

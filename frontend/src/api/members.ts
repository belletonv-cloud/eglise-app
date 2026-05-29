import type { Member } from '../utils/types'
import { getApiBase, authenticatedFetch, api } from '../utils/api'

export interface GetMembersResult {
  members: Member[]
  total: number
}

export async function getMembers(params: { page: number; limit: number }): Promise<GetMembersResult> {
  const { page, limit } = params
  const base = getApiBase()
  try {
    const res = await authenticatedFetch(`${base}/members?page=${page}&limit=${limit}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      return { members: data, total: data.length }
    }
    return {
      members: data.members ?? data.items ?? [],
      total: data.total ?? (data.members?.length ?? data.items?.length ?? 0),
    }
  } catch {
    const mock = await api.getMembers()
    return { members: mock, total: mock.length }
  }
}

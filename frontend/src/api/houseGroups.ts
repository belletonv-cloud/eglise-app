import type { HouseGroup } from '../utils/types'
import { getApiBase } from '../utils/api'

export interface GetHouseGroupsResult {
  groups: HouseGroup[]
  total: number
}

export async function getHouseGroups(params: { page: number; limit: number }): Promise<GetHouseGroupsResult> {
  const { page, limit } = params
  const base = getApiBase()
  const res = await fetch(`${base}/house-groups?page=${page}&limit=${limit}`)
  const data = await res.json()

  // Legacy fallback: array
  if (Array.isArray(data)) {
    return {
      groups: data,
      total: data.length,
    }
  }
  return {
    groups: data.groups ?? data.items ?? [],
    total: data.total ?? (data.groups?.length ?? data.items?.length ?? 0),
  }
}

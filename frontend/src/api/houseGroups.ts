import type { HouseGroup } from '../utils/types'
import { getApiBase, api } from '../utils/api'

export interface GetHouseGroupsResult {
  groups: HouseGroup[]
  total: number
}

export async function getHouseGroups(params: { page: number; limit: number }): Promise<GetHouseGroupsResult> {
  const { page, limit } = params
  const base = getApiBase()
  try {
    const res = await fetch(`${base}/house-groups?page=${page}&limit=${limit}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      return { groups: data, total: data.length }
    }
    return {
      groups: data.groups ?? data.items ?? [],
      total: data.total ?? (data.groups?.length ?? data.items?.length ?? 0),
    }
  } catch {
    const mock = await api.getHouseGroups()
    return { groups: mock, total: mock.length }
  }
}

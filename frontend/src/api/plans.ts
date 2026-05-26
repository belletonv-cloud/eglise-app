import type { Plan } from '../utils/types'
import { getApiBase } from '../utils/api'

export interface GetPlansResult {
  plans: Plan[]
  total: number
}

export async function getPlans(params: { page: number; limit: number }): Promise<GetPlansResult> {
  const { page, limit } = params
  const base = getApiBase()
  const res = await fetch(`${base}/plans?page=${page}&limit=${limit}`)
  const data = await res.json()

  // Legacy fallback: array
  if (Array.isArray(data)) {
    return {
      plans: data,
      total: data.length,
    }
  }
  return {
    plans: data.plans ?? data.items ?? [],
    total: data.total ?? (data.plans?.length ?? data.items?.length ?? 0),
  }
}

// TODO RBAC UI
// - Vérifier que seuls les rôles autorisés peuvent déclencher l’envoi d’emails

import { ref, computed } from 'vue'
import { user } from './auth'
import { getApiBase } from '../utils/api'

export const member = ref<any>(null)
export const loading = ref(false)
export const error = ref<string | null>(null)

export const role = computed(() => member.value?.role || null)
export const isAdmin = computed(() => role.value === 'admin')
export const isEditor = computed(() => ['admin', 'editor'].includes(role.value))
export const isScheduler = computed(() => ['admin', 'scheduler', 'music_director'].includes(role.value))
export const canManageMembers = computed(() => ['admin', 'editor'].includes(role.value))
export const canManageMusic = computed(() => ['admin', 'music_director'].includes(role.value))

export async function loadCurrentMember() {
  if (!user.value) {
    member.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    const token = await user.value.getIdToken()
    const res = await fetch(`${getApiBase()}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    member.value = await res.json()
  } catch (e: any) {
    error.value = e.message
    member.value = null
  } finally {
    loading.value = false
  }
}

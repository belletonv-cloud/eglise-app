import { ref } from 'vue'
import { api } from '../utils/api'
import type { Team, Member } from '../utils/types'

// État réactif partagé
const teams = ref<Team[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Charge tous les ministères
async function loadTeams() {
  try {
    loading.value = true
    error.value = null
    teams.value = await api.getTeams()
  } catch (e: any) {
    error.value = e.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

// Ajout
async function createTeam(data: Partial<Team>): Promise<Team> {
  loading.value = true
  error.value = null
  try {
    const team = await api.createTeam(data)
    teams.value.push(team)
    return team
  } catch (e: any) {
    error.value = e.message || 'Erreur de création'
    throw e
  } finally {
    loading.value = false
  }
}

// Édition
async function updateTeam(id: number, data: Partial<Team>): Promise<Team> {
  loading.value = true
  error.value = null
  try {
    const team = await api.updateTeam(id, data)
    const idx = teams.value.findIndex(t => t.id === id)
    if (idx !== -1) teams.value[idx] = { ...teams.value[idx], ...team }
    return team
  } catch (e: any) {
    error.value = e.message || 'Erreur de modification'
    throw e
  } finally {
    loading.value = false
  }
}

// Suppression
async function deleteTeam(id: number): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await api.deleteTeam(id)
    teams.value = teams.value.filter(t => t.id !== id)
  } catch (e: any) {
    error.value = e.message || 'Erreur de suppression'
    throw e
  } finally {
    loading.value = false
  }
}

// Ajout d'un membre à un ministère
async function addTeamMember(teamId: number, memberId: number, position?: string): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await api.addTeamMember(teamId, memberId, position)
    // Optionnelment, recharger les équipes ou maj locale
  } catch (e: any) {
    error.value = e.message || 'Erreur d\'ajout du membre'
    throw e
  } finally {
    loading.value = false
  }
}

// Retrait d'un membre d'un ministère
async function removeTeamMember(teamId: number, memberId: number): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await api.removeTeamMember(teamId, memberId)
    // Optionnellement, recharger les équipes ou maj locale
  } catch (e: any) {
    error.value = e.message || 'Erreur de retrait du membre'
    throw e
  } finally {
    loading.value = false
  }
}

export function useTeams() {
  return {
    teams,
    loading,
    error,
    loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember
  }
}

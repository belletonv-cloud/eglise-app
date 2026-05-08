<template>
  <div class="team-detail" v-if="team">
    <button @click="$router.push('/teams')" class="back-btn">← Équipes</button>
    <h1>{{ team.name }}</h1>
    <p v-if="team.description" class="desc">{{ team.description }}</p>

    <div class="card">
      <h3>Membres ({{ team.members?.length || 0 }})</h3>
      <table v-if="team.members && team.members.length > 0">
        <thead>
          <tr><th>Nom</th><th>Rôle</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="m in team.members" :key="m.id">
            <td><router-link :to="`/members/${m.id}`">{{ m.first_name }} {{ m.last_name }}</router-link></td>
            <td>
              <div v-if="editing[m.id]">
                <input v-model="positions[m.id]" class="px-2 py-1 border rounded" />
                <button @click="savePosition(m.id)" class="ml-2 px-2 py-1 bg-blue-600 text-white rounded">OK</button>
                <button @click="cancelEdit(m.id)" class="ml-2 px-2 py-1 bg-gray-200 rounded">Annuler</button>
              </div>
              <div v-else>
                {{ m.position || '-' }}
                <button @click="startEdit(m.id, m.position)" class="ml-2 text-sm text-blue-600">Éditer</button>
              </div>
            </td>
            <td><button @click="removeMember(m.id)" class="delete-btn">Retirer</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">Aucun membre dans cette équipe.</div>
    </div>

    <div class="card">
      <h3>Ajouter un membre</h3>
      <form @submit.prevent="addMember">
        <select v-model="newMemberId" required>
          <option value="" disabled>Choisir un membre...</option>
          <option v-for="m in availableMembers" :key="m.id" :value="m.id">{{ m.first_name }} {{ m.last_name }}</option>
        </select>
        <label style="margin-top:8px">Rôle <input v-model="newPosition" placeholder="leader, musicien, tech..." /></label>
        <button type="submit" class="add-btn">Ajouter</button>
      </form>
    </div>
  </div>
  <div v-else-if="loading" class="loading">Chargement...</div>
  <div v-else class="error">{{ error }}</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import { useToast } from '../stores/toast'

const route = useRoute()
const team = ref<any>(null)
const allMembers = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const newMemberId = ref('')
const newPosition = ref('')
const editing: any = ref({})
const positions: any = ref({})
const { show } = useToast()

const availableMembers = computed(() => {
  const memberIds = new Set((team.value?.members || []).map((m: any) => m.id))
  return allMembers.value.filter(m => !memberIds.has(m.id))
})

async function load() {
  try {
    loading.value = true
    const id = Number(route.params.id)
    if (isNaN(id)) throw new Error('ID invalide')
    const [teamData, membersData] = await Promise.all([
      api.getTeam(id),
      api.getMembers()
    ])
    team.value = teamData
    allMembers.value = membersData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function addMember() {
  if (!newMemberId.value) return
  try {
    await api.addTeamMember(Number(route.params.id), Number(newMemberId.value), newPosition.value || undefined)
    show('Membre ajouté', 'success')
    newMemberId.value = ''
    newPosition.value = ''
    load()
  } catch (e: any) {
    show(e.message || 'Erreur', 'error')
  }
}

async function removeMember(memberId: number) {
  if (!await confirmDialog('Retirer ce membre de l\'équipe ?')) return
  try {
    await api.removeTeamMember(Number(route.params.id), memberId)
    show('Membre retiré', 'success')
    load()
  } catch (e: any) {
    show(e.message || 'Erreur', 'error')
  }
}

function startEdit(memberId: number, current: string) {
  editing.value = { ...editing.value, [memberId]: true }
  positions.value = { ...positions.value, [memberId]: current || '' }
}

function cancelEdit(memberId: number) {
  const copy = { ...editing.value }
  delete copy[memberId]
  editing.value = copy
}

async function savePosition(memberId: number) {
  const teamId = Number(route.params.id)
  const pos = positions.value[memberId]
  try {
    await api.updateTeamMember(teamId, memberId, { position: pos })
    show('Rôle mis à jour', 'success')
    cancelEdit(memberId)
    load()
  } catch (e: any) {
    show(e.message || 'Erreur', 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.team-detail { max-width: 700px; margin: 0 auto; }
.back-btn { background: #7f8c8d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }
h1 { margin: 10px 0 5px; color: #2c3e50; }
.desc { color: #666; margin-bottom: 20px; }
.card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.card h3 { margin-top: 0; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
th { font-weight: 600; }
.empty { color: #999; padding: 15px 0; }
.delete-btn { padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; }
.add-btn { margin-top: 10px; padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; }
.card select, .card input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.loading, .error { padding: 20px; text-align: center; }
</style>

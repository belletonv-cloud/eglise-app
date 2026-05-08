<template>
  <div class="member-detail" v-if="member">
    <button @click="$router.push('/members')" class="back-btn">← Membres</button>
    <h1>{{ member.first_name }} {{ member.last_name }}</h1>

    <div class="card">
      <h3>Informations</h3>
      <p><strong>Email :</strong> {{ member.email || '-' }}</p>
      <p><strong>Téléphone :</strong> {{ member.phone || '-' }}</p>
      <p><strong>Statut :</strong> <span class="badge" :class="member.membership_type">{{ member.membership_type }}</span></p>
      <p><strong>Notes :</strong> {{ member.notes || '-' }}</p>
      <button @click="editing = !editing" class="edit-btn">{{ editing ? 'Annuler' : 'Modifier' }}</button>
    </div>

    <div v-if="editing" class="card">
      <h3>Modifier</h3>
      <form @submit.prevent="saveMember">
        <label>Prénom <input v-model="form.first_name" required /></label>
        <label>Nom <input v-model="form.last_name" required /></label>
        <label>Email <input v-model="form.email" type="email" /></label>
        <label>Téléphone <input v-model="form.phone" /></label>
        <label>Statut
          <select v-model="form.membership_type">
            <option value="guest">Invitée</option>
            <option value="member">Membre</option>
            <option value="inactive">Inactif</option>
          </select>
        </label>
        <label>Notes <textarea v-model="form.notes" rows="3"></textarea></label>
        <button type="submit" class="save-btn">Enregistrer</button>
      </form>
    </div>

    <div class="card" v-if="member.teams && member.teams.length > 0">
      <h3>Équipes ({{ member.teams.length }})</h3>
      <ul>
        <li v-for="t in member.teams" :key="t.id">
          <router-link :to="`/teams/${t.id}`">{{ t.name }}</router-link>
          <span v-if="t.position" class="position">— {{ t.position }}</span>
          <button @click="leaveTeam(t.id)" class="ml-3 text-sm text-red-600">Quitter</button>
        </li>
      </ul>
    </div>

    <div class="card">
      <h3>Rejoindre une équipe</h3>
      <div class="flex gap-2 items-center">
        <select v-model="joinTeamId" class="px-2 py-1 border rounded">
          <option :value="null">-- Choisir une équipe --</option>
          <option v-for="t in teams" :key="t.id" :value="t.id" v-if="!member.teams?.find(x => x.id === t.id)">{{ t.name }}</option>
        </select>
        <input v-model="joinPosition" placeholder="Position (ex: chanteur)" class="px-2 py-1 border rounded" />
        <button @click="joinTeam" class="px-3 py-1 bg-green-600 text-white rounded">Rejoindre</button>
      </div>
    </div>

    <div class="card">
      <h3>Notifications push</h3>
      <NotificationPrefs :member-id="Number(route.params.id)" />
    </div>
  </div>
  <div v-else-if="loading" class="loading">Chargement...</div>
  <div v-else class="error">{{ error }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import NotificationPrefs from '../components/NotificationPrefs.vue'
import { ref } from 'vue'
import { useToast } from '../stores/toast'

const route = useRoute()
const member = ref<any>(null)
const loading = ref(true)
const error = ref('')
const editing = ref(false)
const form = ref<any>({})
const teams = ref<any[]>([])
const joinTeamId = ref<number | null>(null)
const joinPosition = ref('')

async function load() {
  try {
    loading.value = true
    const id = Number(route.params.id)
    if (isNaN(id)) throw new Error('ID invalide')
    member.value = await api.getMember(id)
    teams.value = await api.getTeams()
    form.value = { ...member.value }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveMember() {
  const id = Number(route.params.id)
  if (isNaN(id)) return
  await api.updateMember(id, form.value)
  editing.value = false
  load()
}

onMounted(load)

const { show } = useToast()

const leaveTeam = async (teamId: number) => {
  try {
    const id = Number(route.params.id)
    await api.removeTeamMember(teamId, id)
    show('Membre retiré de l\'équipe', 'success')
    await load()
  } catch (e: any) {
    show(e.message || 'Erreur', 'error')
  }
}

const joinTeam = async () => {
  try {
    if (!joinTeamId.value) return
    const id = Number(route.params.id)
    await api.addTeamMember(joinTeamId.value, id, joinPosition.value || undefined)
    show('Vous avez rejoint l\'équipe', 'success')
    joinTeamId.value = null
    joinPosition.value = ''
    await load()
  } catch (e: any) {
    show(e.message || 'Erreur', 'error')
  }
}
</script>

<style scoped>
.member-detail { max-width: 700px; margin: 0 auto; }
.back-btn { background: #7f8c8d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }
h1 { margin: 10px 0 20px; color: #2c3e50; }
.card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.card h3 { margin-top: 0; }
.card p { margin: 8px 0; }
.card label { display: block; margin-bottom: 12px; }
.card input, .card select, .card textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-top: 4px; box-sizing: border-box; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
.badge.member { background: #d4edda; color: #155724; }
.badge.guest { background: #fff3cd; color: #856404; }
.badge.inactive { background: #f8d7da; color: #721c24; }
.edit-btn, .save-btn { margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
.loading, .error { padding: 20px; text-align: center; }
</style>

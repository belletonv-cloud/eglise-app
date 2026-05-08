<template>
  <div class="teams-page">
    <h2>Équipes ({{ teams.length }})</h2>
    <button @click="showForm = true" class="add-btn">+ Créer une équipe</button>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="t in teams" :key="t.id" class="team-card" @click="$router.push(`/teams/${t.id}`)">
        <div class="team-name">{{ t.name }}</div>
        <div class="team-meta">{{ t.member_count }} membre(s)</div>
        <div v-if="t.description" class="team-desc">{{ t.description }}</div>
      </div>
      <div v-if="teams.length === 0" class="empty">Aucune équipe pour le moment.</div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3>Nouvelle équipe</h3>
        <form @submit.prevent="createTeam">
          <label>Nom <input v-model="form.name" required /></label>
          <label>Description <textarea v-model="form.description" rows="3"></textarea></label>
          <label>Type de service
            <select v-model="form.service_type">
              <option value="">—</option>
              <option value="louange">Louange</option>
              <option value="son">Son</option>
              <option value="lumières">Lumières</option>
              <option value="accueil">Accueil</option>
              <option value="vidéo">Vidéo</option>
              <option value="autres">Autres</option>
            </select>
          </label>
          <div class="form-actions">
            <button type="submit">Créer</button>
            <button type="button" @click="showForm = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const teams = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({ name: '', description: '', service_type: '' })

async function load() {
  try {
    loading.value = true
    teams.value = await api.getTeams()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function createTeam() {
  await api.createTeam(form.value)
  showForm.value = false
  form.value = { name: '', description: '', service_type: '' }
  load()
}

onMounted(load)
</script>

<style scoped>
.teams-page { max-width: 900px; margin: 0 auto; }
.add-btn { margin-bottom: 15px; padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; }
.team-card { background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; border: 1px solid #eee; }
.team-card:hover { background: #eef; }
.team-name { font-size: 1.1em; font-weight: 600; color: #2c3e50; }
.team-meta { font-size: 0.85em; color: #666; margin-top: 4px; }
.team-desc { color: #555; margin-top: 6px; font-size: 0.9em; }
.empty { text-align: center; padding: 40px; color: #999; }
.loading, .error { padding: 20px; text-align: center; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; padding: 25px; border-radius: 8px; min-width: 400px; max-width: 90%; }
.modal h3 { margin-top: 0; }
.modal label { display: block; margin-bottom: 12px; }
.modal input, .modal select, .modal textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-top: 4px; box-sizing: border-box; }
.form-actions { display: flex; gap: 10px; margin-top: 15px; }
.form-actions button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
.form-actions button[type=submit] { background: #3498db; color: white; }
.form-actions button[type=button] { background: #95a5a6; color: white; }
</style>

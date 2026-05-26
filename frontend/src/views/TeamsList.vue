<template>
  <div class="teams-page">
    <h2>{{ $t('menu.ministries') }} ({{ teams.length }})</h2>
    <button @click="showForm = true" class="add-btn">{{ $t('teamsList.create_ministry') }}</button>

    <div v-if="loading" class="loading">{{ $t('loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="t in teams" :key="t.id" class="team-card" @click="$router.push(`/teams/${t.id}`)">
        <div class="team-name">{{ t.name }}</div>
        <div class="team-meta">{{ t.member_count }} {{ $t('table.member') }}(s)</div>
        <div v-if="t.description" class="team-desc">{{ t.description }}</div>
      </div>
      <div v-if="teams.length === 0" class="empty">{{ $t('members.no_members') }}</div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3>{{ $t('teamsList.new_ministry') }}</h3>
        <form @submit.prevent="createTeam">
          <label>{{ $t('houseGroups.name') }} <input v-model="form.name" required /></label>
          <label>{{ $t('houseGroups.description') }} <textarea v-model="form.description" rows="3"></textarea></label>
          <label>{{ $t('planTemplates.service_type') }}
            <select v-model="form.service_type">
              <option value="">—</option>
              <option value="worship">{{ $t('teamsList.service_types_ministry.worship') }}</option>
              <option value="sound">{{ $t('teamsList.service_types_ministry.sound') }}</option>
              <option value="lights">{{ $t('teamsList.service_types_ministry.lights') }}</option>
              <option value="welcome">{{ $t('teamsList.service_types_ministry.welcome') }}</option>
              <option value="video">{{ $t('teamsList.service_types_ministry.video') }}</option>
              <option value="other">{{ $t('teamsList.service_types_ministry.usher') }}</option>
            </select>
          </label>
          <div class="form-actions">
            <button type="submit">{{ $t('houseGroups.create') }}</button>
            <button type="button" @click="showForm = false">{{ $t('houseGroups.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Team } from '../utils/types'
import { useTeams } from '../composables/useTeams'
import { showToast } from '../stores/toast'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { teams, loading, error, loadTeams, createTeam: createTeamComposable } = useTeams()
const showForm = ref(false)
const form = ref<Partial<Team>>({ name: '', description: '', service_type: '' })


async function load() {
  await loadTeams()
}

function validateForm(): { valid: boolean, message?: string } {
  // Nom obligatoire, min 3, pas de doublon (case-insensitive)
  const name = (form.value.name || '').trim()
  if (!name)
    return { valid: false, message: t('teamsList.validation_name_required') }
  if (name.length < 3)
    return { valid: false, message: t('teamsList.validation_name_short') }
  if (teams.value.some(ti => ti.name.trim().toLowerCase() === name.toLowerCase()))
    return { valid: false, message: t('teamsList.validation_name_duplicate') }
  // Ajout description si obligatoire ici ; actuellement optionnelle
  return { valid: true }
}

async function createTeam() {
  const v = validateForm()
  if (!v.valid) {
    showToast(v.message || t('teamsList.validation_error'), 'error')
    return
  }
  try {
    await createTeamComposable(form.value)
    showToast(t('teamsList.create_ministry_success'), 'success')
    showForm.value = false
    form.value = { name: '', description: '', service_type: '' }
    load()
  } catch (e: any) {
    showToast(e.message || t('teamsList.create_ministry_error'), 'error')
  }
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

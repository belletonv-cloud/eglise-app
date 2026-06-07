<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-3 mb-1">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('menu.teams') }} ({{ teams.length }})</h2>
    </div>
    <button @click="showForm = true" class="mb-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer">{{ $t('teamsList.create_ministry') }}</button>

    <div v-if="loading" class="py-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="error" class="py-8 text-center text-red-600 dark:text-red-400">{{ error }}</div>
    <div v-else>
      <div v-for="t in teams" :key="t.id" class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-3 cursor-pointer border border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" @click="$router.push(`/teams/${t.id}`)">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ t.name }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ t.member_count }} {{ $t('table.member') }}(s)</div>
        <div v-if="t.description" class="text-sm text-gray-600 dark:text-gray-300 mt-2">{{ t.description }}</div>
      </div>
      <div v-if="teams.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500">{{ $t('members.no_members') }}</div>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ $t('teamsList.new_ministry') }}</h3>
        <form @submit.prevent="createTeam">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('houseGroups.name') }} <input v-model="form.name" required class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" /></label>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('houseGroups.description') }} <textarea v-model="form.description" rows="3" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"></textarea></label>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('planTemplates.service_type') }}
            <select v-model="form.service_type" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <option value="">—</option>
              <option value="worship">{{ $t('teamsList.service_types.worship') }}</option>
              <option value="sound">{{ $t('teamsList.service_types.sound') }}</option>
              <option value="lights">{{ $t('teamsList.service_types.lights') }}</option>
              <option value="welcome">{{ $t('teamsList.service_types.welcome') }}</option>
              <option value="video">{{ $t('teamsList.service_types.video') }}</option>
              <option value="other">{{ $t('teamsList.service_types.usher') }}</option>
            </select>
          </label>
          <div class="flex gap-3 justify-end pt-4">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('houseGroups.create') }}</button>
            <button type="button" @click="showForm = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{{ $t('houseGroups.cancel') }}</button>
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

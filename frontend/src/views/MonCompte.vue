<template>
  <div class="max-w-3xl mx-auto">
    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="member">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Mon compte</h1>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Prénom</label>
              <p class="mt-1 text-gray-900">{{ member.first_name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Nom</label>
              <p class="mt-1 text-gray-900">{{ member.last_name }}</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-gray-900">{{ member.email || '-' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Téléphone</label>
            <input v-model="form.phone"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Date de naissance</label>
            <input v-model="form.birth_date" type="date"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Notes</label>
            <textarea v-model="form.notes" rows="3"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <button @click="saveProfile"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
            <span v-if="saved" class="text-green-600 text-sm">✓ Enregistré</span>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <VolunteerPreferences :member-id="member.id" />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Mes services à venir</h2>
        <div v-if="schedule.length === 0" class="text-gray-400 py-4 text-center">
          Aucun service planifié pour le moment.
        </div>
        <div v-else class="space-y-3">
          <div v-for="s in schedule" :key="s.id"
            @click="$router.push(`/plans/${s.plan_id}`)"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
            <div>
              <div class="font-medium text-gray-800">{{ formatDate(s.date) }}</div>
              <div class="text-sm text-gray-500">
                {{ s.service_type_name || 'Service' }}
                <span v-if="s.time"> à {{ s.time?.slice(0, 5) }}</span>
              </div>
              <div v-if="s.position" class="text-sm text-gray-400">{{ s.position }}</div>
            </div>
            <span :class="statusClass(s.status)"
              class="px-2 py-1 rounded-full text-xs font-medium">
              {{ statusLabel(s.status) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import VolunteerPreferences from '../components/VolunteerPreferences.vue'

const member = ref<any>(null)
const schedule = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const saved = ref(false)
const form = ref({ phone: '', notes: '', birth_date: '' })

const statusLabel = (s: string) =>
  s === 'confirmed' ? 'Confirmé' : s === 'declined' ? 'Refusé' : 'En attente'
const statusClass = (s: string) =>
  s === 'confirmed' ? 'bg-green-100 text-green-700' :
  s === 'declined' ? 'bg-red-100 text-red-700' :
  'bg-yellow-100 text-yellow-700'

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

async function load() {
  try {
    const [m, sched] = await Promise.all([
      api.getMe(),
      api.getMySchedule(),
    ])
    member.value = m
    schedule.value = sched
    form.value = {
      phone: m.phone || '',
      notes: m.notes || '',
      birth_date: m.birth_date || '',
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  saved.value = false
  try {
    await api.updateMe({
      phone: form.value.phone || undefined,
      notes: form.value.notes || undefined,
      birth_date: form.value.birth_date || undefined,
    })
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
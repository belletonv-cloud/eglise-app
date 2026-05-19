<template>
  <div class="max-w-3xl mx-auto">
    <div v-if="loading" class="text-center py-12 text-gray-500">{{$t('plan.loading')}}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="member">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">{{$t('profile.account')}}</h1>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">{{$t('profile.personal_info')}}</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{$t('profile.first_name')}}</label>
              <p class="mt-1 text-gray-900">{{ member.first_name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{$t('profile.last_name')}}</label>
              <p class="mt-1 text-gray-900">{{ member.last_name }}</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{$t('profile.email')}}</label>
            <p class="mt-1 text-gray-900">{{ member.email || $t('profile.unknown') }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{$t('profile.phone')}}</label>
            <input v-model="form.phone"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{$t('profile.birth_date')}}</label>
            <input v-model="form.birth_date" type="date"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{$t('profile.notes')}}</label>
            <textarea v-model="form.notes" rows="3"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div class="flex items-center gap-3">
<button @click="saveProfile"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
               {{ saving ? $t('profile.saving') : $t('profile.save') }}
            </button>
            <span v-if="saved" class="text-green-600 text-sm">{{$t('profile.saved')}}</span>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <VolunteerPreferences :member-id="member.id" />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">{{$t('profile.upcoming_services')}}</h2>
        <div v-if="schedule.length === 0" class="text-gray-400 py-4 text-center">
          {{$t('profile.no_upcoming')}}
        </div>
        <div v-else class="space-y-3">
          <div v-for="s in schedule" :key="s.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div @click="$router.push(`/plans/${s.plan_id}`)" class="flex-1 cursor-pointer">
              <div class="font-medium text-gray-800">{{ formatDate(s.date) }}</div>
              <div class="text-sm text-gray-500">
                {{ s.service_type_name || $t('profile.service') }}
                <span v-if="s.time"> à {{ s.time?.slice(0, 5) }}</span>
              </div>
              <div v-if="s.position" class="text-sm text-gray-400">{{ s.position }}</div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <span v-if="s.status === 'confirmed'" class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{{$t('profile.confirmed')}}</span>
              <span v-else-if="s.status === 'declined'" class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{{$t('profile.declined')}}</span>
              <template v-else>
<button @click="respond(s.id, 'confirmed')" :disabled="responding === s.id"
                    class="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer">{{$t('profile.accept')}}</button>
                <button @click="respond(s.id, 'declined')" :disabled="responding === s.id"
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer">{{$t('profile.refuse')}}</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import { useToast } from '../stores/toast'
import VolunteerPreferences from '../components/VolunteerPreferences.vue'

const member = ref<any>(null)
const schedule = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const saved = ref(false)
const form = ref({ phone: '', notes: '', birth_date: '' })

const responding = ref<number | null>(null)

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

async function respond(scheduledId: number, status: string) {
  responding.value = scheduledId
  try {
    const planId = schedule.value.find(s => s.id === scheduledId)?.plan_id
    if (!planId) return
    await api.updateSchedule(planId, scheduledId, { status })
    const item = schedule.value.find(s => s.id === scheduledId)
    if (item) item.status = status
  } catch (e: any) {
    useToast().show(e.message || 'Erreur', 'error')
  } finally {
    responding.value = null
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
<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>
    
    <template v-else>
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <button @click="$router.back()" 
            class="text-gray-600 hover:text-gray-800 cursor-pointer">{{ $t('checkin.back') }}</button>
          <h2 class="text-2xl font-bold text-gray-800">{{ $t('checkin.title') }}</h2>
        </div>

        <div v-if="!selectedPlan" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">{{ $t('checkin.select_plan') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="plan in upcomingPlans" :key="plan.id"
              @click="selectPlan(plan)"
              class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer hover:shadow-md transition-all">
              <div class="font-semibold text-gray-800">{{ formatDate(plan.date) }}</div>
              <div class="text-sm text-gray-500">{{ plan.service_type_name || $t('calendar.service') }} 
                <span v-if="plan.time">{{ plan.time?.slice(0, 5) }}</span>
              </div>
              <div v-if="plan.theme" class="text-sm text-gray-600 mt-1 italic">« {{ plan.theme }} »</div>
              <div class="text-xs text-gray-400 mt-2">
                {{ plan.attendance_count || 0 }} {{ $t('checkin.present') }}
              </div>
            </div>
          </div>
          <div v-if="upcomingPlans.length === 0" class="text-center py-8 text-gray-400">
            {{ $t('checkin.no_upcoming') }}
          </div>

          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">{{ $t('checkin.qr_code') }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="plan in upcomingPlans.slice(0, 4)" :key="plan.id"
                class="border border-gray-200 rounded-lg p-3 text-center">
                <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(origin + '/checkin?plan=' + plan.id)}`"
                  alt="QR check-in" class="mx-auto mb-2" loading="lazy" />
                <div class="text-xs text-gray-500">{{ formatDate(plan.date) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-800">{{ formatDate(selectedPlan.date) }}</h3>
                <p class="text-gray-500">{{ selectedPlan.service_type_name }} 
                  <span v-if="selectedPlan.time">{{ selectedPlan.time?.slice(0, 5) }}</span>
                </p>
              </div>
              <button @click="selectedPlan = null"
                class="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">{{ $t('checkin.change') }}</button>
              <button @click="showQR = !showQR"
                class="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer ml-2">QR</button>
            </div>

            <div v-if="showQR" class="mt-3 text-center">
              <img   :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/checkin?plan=' + selectedPlan.id)}`"
                alt="QR check-in" class="mx-auto" />
              <p class="text-xs text-gray-400 mt-1">{{ $t('checkin.scan_hint') }}</p>
            </div>

            <div class="mb-4">
              <input v-model="searchQuery" 
                @input="searchMembers"
                :placeholder="$t('checkin.search_placeholder')"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"
                autofocus>
            </div>

            <div v-if="searchResults.length > 0" class="space-y-2 mb-4 max-h-60 overflow-y-auto">
              <div v-for="member in searchResults" :key="member.id"
                @click="checkIn(member)"
                class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                <div>
                  <div class="font-medium text-gray-800">{{ member.first_name }} {{ member.last_name }}</div>
                  <div class="text-sm text-gray-500">{{ member.email || member.phone || '' }}</div>
                </div>
                <button class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  {{ $t('checkin.checkin_button') }}
                </button>
              </div>
            </div>

            <div class="border-t border-gray-200 pt-4">
              <button @click="showManualCheckIn = true"
                class="text-sm text-blue-600 hover:text-blue-800">
                {{ $t('checkin.manual') }}
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold mb-4">{{ $t('checkin.present_count', { count: attendances.length }) }}</h3>
            <div v-if="attendances.length === 0" class="text-center py-8 text-gray-400">
              {{ $t('checkin.no_checkin') }}
            </div>
            <div v-else class="space-y-2">
              <div v-for="att in attendances" :key="att.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span class="font-medium text-gray-800">{{ att.first_name }} {{ att.last_name }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{ formatTime(att.check_in_time) }}</span>
                </div>
                <button @click="removeAttendance(att.id)"
                  class="text-red-500 hover:text-red-700 text-sm cursor-pointer">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showManualCheckIn" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showManualCheckIn = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="text-lg font-bold mb-4">{{ $t('checkin.manual_title') }}</h3>
          <form @submit.prevent="manualCheckIn" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.last_name') }}</label>
              <input v-model="manualForm.last_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.first_name') }}</label>
              <input v-model="manualForm.first_name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showManualCheckIn = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('checkin.cancel') }}</button>
              <button type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                {{ $t('checkin.checkin_button') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'
import { confirmDialog } from '../stores/confirm'

const router = useRouter()
const { t, locale } = useI18n()
const loading = ref(true)
const error = ref('')
const upcomingPlans = ref<any[]>([])
const selectedPlan = ref<any>(null)
const attendances = ref<any[]>([])
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const showManualCheckIn = ref(false)
const showQR = ref(false)
const manualForm = ref({ first_name: '', last_name: '' })
const allMembers = ref<any[]>([])

const formatDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
}

const formatTime = (tl: string) => {
  return tl ? new Date(tl).toLocaleTimeString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''
}

const origin = typeof window !== 'undefined' ? window.location.origin : ''

const loadData = async () => {
  try {
    const [plans, members] = await Promise.all([
      api.getPlans(),
      api.getMembers()
    ])
    const now = new Date()
    upcomingPlans.value = plans
      .filter((p: any) => new Date(p.date) >= now)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .slice(0, 10)
    allMembers.value = members
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const selectPlan = async (plan: any) => {
  selectedPlan.value = plan
  await loadAttendances()
}

const searchMembers = () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  const query = searchQuery.value.toLowerCase()
  searchResults.value = allMembers.value
    .filter((m: any) => 
      m.first_name?.toLowerCase().includes(query) ||
      m.last_name?.toLowerCase().includes(query)
    )
    .slice(0, 10)
}

const checkIn = async (member: any) => {
  try {
    await api.createAttendance({
      plan_id: selectedPlan.value.id,
      member_id: member.id,
    })
    searchQuery.value = ''
    searchResults.value = []
    await loadAttendances()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const manualCheckIn = async () => {
  if (!manualForm.value.last_name) return
  try {
    let memberId = allMembers.value.find((m: any) => 
      m.last_name.toLowerCase() === manualForm.value.last_name.toLowerCase() &&
      (!manualForm.value.first_name || m.first_name?.toLowerCase() === manualForm.value.first_name.toLowerCase())
    )?.id

    if (!memberId) {
      const newMember = await api.createMember({
        first_name: manualForm.value.first_name,
        last_name: manualForm.value.last_name,
        membership_type: 'guest'
      })
      memberId = newMember.id
      allMembers.value.push(newMember)
    }

    await api.createAttendance({
      plan_id: selectedPlan.value.id,
      member_id: memberId,
    })
    showManualCheckIn.value = false
    manualForm.value = { first_name: '', last_name: '' }
    await loadAttendances()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const loadAttendances = async () => {
  if (!selectedPlan.value) return
  try {
    attendances.value = await api.getPlanAttendances(selectedPlan.value.id)
  } catch (e: any) {
    console.error(e)
  }
}

const removeAttendance = async (id: number) => {
  if (!await confirmDialog(t('checkin.remove_confirm'))) return
  await api.deleteAttendance(id)
  await loadAttendances()
}

onMounted(loadData)
</script>

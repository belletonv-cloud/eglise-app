<template>
  <div>
    <!-- Loader global -->
    <div v-if="isLoading" role="status" data-testid="loader" class="text-center py-12 text-gray-500">
      {{ $t('loading') }}
    </div>
    
    <!-- Error global -->
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg" aria-live="polite">
      {{ error }}
    </div>

    <template v-else>
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <button @click="$router.back()" class="text-gray-600 hover:text-gray-800 cursor-pointer">
            {{ $t('checkin.back') }}
          </button>
          <h2 class="text-2xl font-bold text-gray-800">{{ $t('checkin.title') }}</h2>
            <PageHelp page="checkin" :helpText="$t('help.checkin')" />
        </div>

        <!-- Sélection du plan/service -->
        <div v-if="!currentPlan" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">{{ $t('checkin.select_plan') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="plan in plans" :key="plan.id"
              @click="handleSelectPlan(plan)"
              class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer hover:shadow-md transition-all"
              data-testid="plan-item">
              <div class="font-semibold text-gray-800">{{ formatDate(plan.date) }}</div>
              <div class="text-sm text-gray-500">
                {{ plan.service_type_name || $t('calendar.service') }}
                <span v-if="plan.time">{{ plan.time?.slice(0, 5) }}</span>
              </div>
              <div v-if="plan.theme" class="text-sm text-gray-600 mt-1 italic">« {{ plan.theme }} »</div>
              <div class="text-xs text-gray-400 mt-2">
                {{ plan.attendance_count || 0 }} {{ $t('checkin.present') }}
              </div>
            </div>
          </div>
          <div v-if="plans.length === 0" class="text-center py-8 text-gray-400">
            {{ $t('checkin.no_upcoming') }}
          </div>

          <!-- QR codes -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">{{ $t('checkin.qr_code') }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="plan in plans.slice(0, 4)" :key="plan.id"
                class="border border-gray-200 rounded-lg p-3 text-center">
                <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(origin + '/checkin?plan=' + plan.id)}`"
                  alt="QR check-in" class="mx-auto mb-2" loading="lazy" />
                <div class="text-xs text-gray-500">{{ formatDate(plan.date) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- INTERFACE PRINCIPALE -->
        <div v-else>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-800">{{ formatDate(currentPlan.date) }}</h3>
                <p class="text-gray-500">{{ currentPlan.service_type_name }}
                  <span v-if="currentPlan.time">{{ currentPlan.time?.slice(0, 5) }}</span>
                </p>
              </div>
              <button @click="currentPlan = null"
                class="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">{{ $t('checkin.change') }}</button>
              <button @click="showQR = !showQR"
                class="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer ml-2">QR</button>
            </div>

            <!-- QR affichage sous plan -->
            <div v-if="showQR" class="mt-3 text-center">
              <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/checkin?plan=' + currentPlan.id)}`"
                alt="QR check-in" class="mx-auto" />
              <p class="text-xs text-gray-400 mt-1">{{ $t('checkin.scan_hint') }}</p>
            </div>

            <!-- Recherche membre -->
            <div class="mb-4">
              <input
                ref="searchInputRef"
                v-model="manualForm.search"
                @input="handleSearch($event.target.value)"
                :placeholder="$t('checkin.search_placeholder')"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"
                :aria-describedby="error ? 'checkin-error' : undefined"
                autofocus
                data-testid="search-input"
              >
            </div>
            <!-- Résultats recherche -->
            <div v-if="searchResults.length > 0" class="space-y-2 mb-4 max-h-60 overflow-y-auto">
              <div
                v-for="member in searchResults"
                :key="member.id"
                @click="handleCheckIn(member)"
                class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                data-testid="member-result"
              >
                <div>
                  <div class="font-medium text-gray-800">{{ member.first_name }} {{ member.last_name }}</div>
                  <div class="text-sm text-gray-500">{{ member.email || member.phone || '' }}</div>
                </div>
                <button class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700" data-testid="checkin-button">
                  {{ $t('checkin.checkin_button') }}
                </button>
              </div>
            </div>

            <div class="border-t border-gray-200 pt-4">
              <button @click="showManualCheckIn = true"
                class="text-sm text-blue-600 hover:text-blue-800"
                data-testid="open-manual-checkin">
                {{ $t('checkin.manual') }}
              </button>
            </div>
          </div>

          <!-- Liste des présents -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold mb-4">
              {{ $t('checkin.present_count', { count: attendances.length }) }}
            </h3>
            <div v-if="attendances.length === 0" class="text-center py-8 text-gray-400">
              {{ $t('checkin.no_checkin') }}
            </div>
            <div v-else class="space-y-2">
<div v-for="att in attendances" :key="att.id"
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                 data-testid="attendance-item">
                <div>
                  <span class="font-medium text-gray-800">{{ att.first_name }} {{ att.last_name }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{ formatTime(att.check_in_time) }}</span>
                </div>
                <button @click="handleCheckOut(att.id)"
                  class="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                  data-testid="checkout-button">✕</button>
              </div>
            </div>
          </div>
        </div>

      <!-- Modale check-in manuel -->
      <div v-if="showManualCheckIn"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
           @click.self="showManualCheckIn = false"
           aria-modal="true" role="dialog">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="text-lg font-bold mb-4">{{ $t('checkin.manual_title') }}</h3>
          <form @submit.prevent="handleManualCheckIn" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="manual-lastname">{{ $t('members.last_name') }}</label>
              <input id="manual-lastname"
                v-model="manualForm.last_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2"
                :aria-describedby="error ? 'checkin-error' : undefined"
                data-testid="manual-last-name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="manual-firstname">{{ $t('members.first_name') }}</label>
              <input id="manual-firstname" v-model="manualForm.first_name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2"
                :aria-describedby="error ? 'checkin-error' : undefined"
                data-testid="manual-first-name"
              >
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showManualCheckIn = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('checkin.cancel') }}</button>
              <button type="submit" :disabled="isSubmitting"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                data-testid="manual-checkin-submit">
                <span v-if="isSubmitting" class="spinner mr-1" role="status">&#8635;</span>
                {{ $t('checkin.checkin_button') }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Container pour toasts ARIA-live-->
      <div aria-live="polite" style="position: absolute; left: -9999px; height: 0; width: 0; overflow: hidden;">
        <!-- The actual toasts will be injected globally but reserve slot for a11y compliance -->
      </div>
      
    </div>
  </template>
</div>
</template>

<script setup lang="ts">
import PageHelp from '../components/PageHelp.vue'
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { showToast } from '../stores/toast'
import { useCheckins } from '../composables/useCheckins'
import type { Plan, Member, Presence } from '../composables/useCheckins'

const { t } = useI18n()
const {
  plans, members, attendances, currentPlan, searchResults,
  isLoading, isSubmitting, error,
  loadPlans, loadMembers, loadAttendances,
  checkIn, checkOut, createMember,
  validateCheckIn, searchMembers
} = useCheckins()

const showManualCheckIn = ref(false)
const showQR = ref(false)
const manualForm = ref({ first_name: '', last_name: '', search: '' })
const searchInputRef = ref<HTMLInputElement | null>(null)

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long'})
const formatTime = (tl: string) => tl ? new Date(tl).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'}) : ''
const origin = typeof window !== 'undefined' ? window.location.origin : ''

const handleSelectPlan = async (plan: Plan) => {
  currentPlan.value = plan
  await loadAttendances(plan.id)
}

const handleSearch = (query: string) => {
  searchMembers(query)
}

const handleCheckIn = async (member: Member) => {
  const errorKey = validateCheckIn(currentPlan.value, member)
  if (errorKey) {
    showToast(t(errorKey), 'error')
    if (searchInputRef.value) nextTick(() => searchInputRef.value?.focus())
    return
  }
  try {
    await checkIn({ plan_id: currentPlan.value!.id, member_id: member.id })
    showToast(t('checkin.success'), 'success')
    await loadAttendances(currentPlan.value!.id)
  } catch {
    showToast(t('checkin.api_error'), 'error')
  }
}

const handleManualCheckIn = async () => {
  if (!manualForm.value.last_name) return
  try {
    let member = members.value.find((m) =>
      m.last_name.toLowerCase() === manualForm.value.last_name.toLowerCase() &&
        (!manualForm.value.first_name || m.first_name?.toLowerCase() === manualForm.value.first_name.toLowerCase())
    )
    if (!member) {
      member = await createMember({
        first_name: manualForm.value.first_name,
        last_name: manualForm.value.last_name,
        membership_type: 'guest'
      })
    }
    const errorKey = validateCheckIn(currentPlan.value, member)
    if (errorKey) {
      showToast(t(errorKey), 'error')
      if (searchInputRef.value) nextTick(() => searchInputRef.value?.focus())
      return
    }
    await checkIn({ plan_id: currentPlan.value!.id, member_id: member.id })
    showToast(t('checkin.success'), 'success')
    showManualCheckIn.value = false
    manualForm.value = { first_name: '', last_name: '', search: '' }
    await loadAttendances(currentPlan.value!.id)
  } catch {
    showToast(t('checkin.api_error'), 'error')
  }
}

const handleCheckOut = async (attendanceId: number) => {
  await checkOut(attendanceId)
  showToast(t('checkin.removed'), 'success')
  await loadAttendances(currentPlan.value!.id)
}

onMounted(() => {
  loadPlans()
  loadMembers()
})
</script>

<template>
  <div class="mx-auto max-w-7xl p-4 pb-24 md:pb-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Services Planning</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ total }} service{{ total > 1 ? 's' : '' }}</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
          <button @click="viewMode = 'list'" :class="['px-3 py-1.5 text-sm', viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700']">Schedule</button>
          <button @click="viewMode = 'matrix'" :class="['px-3 py-1.5 text-sm', viewMode === 'matrix' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700']">Matrix</button>
        </div>
        <button @click="showApplyTemplate = true" class="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
          {{ $t('plansList.add_template') }}
        </button>
        <button @click="showForm = true" class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          + {{ $t('plansList.add_new') }}
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Service type</label>
      <select
        v-model="selectedServiceType"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
      >
        <option value="all">Tous</option>
        <option v-for="st in serviceTypes" :key="st.id" :value="String(st.id)">
          {{ st.name }}
        </option>
      </select>
    </div>

    <!-- Skeleton loading -->
    <div v-if="isLoading" class="space-y-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else>
      <!-- === VUE LISTE (style Services Planning) === -->
      <div v-if="viewMode === 'list'">
        <div v-if="visibleUpcomingPlans.length > 0" class="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
            Upcoming
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">Date</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">Service</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">Theme</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">Order</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">People</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="plan in visibleUpcomingPlans"
                  :key="plan.id"
                  class="cursor-pointer border-t border-gray-100 hover:bg-emerald-50/40 dark:border-gray-700 dark:hover:bg-gray-700/40"
                  @click="goToPlan(plan.id)"
                >
                  <td class="px-4 py-2 text-gray-700 dark:text-gray-200">{{ plan.date }}{{ plan.time ? ` · ${plan.time.slice(0,5)}` : '' }}</td>
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{{ plan.service_type_name || 'Service' }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ plan.theme || '—' }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ plan.items_count || 0 }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ plan.people_count || 0 }}</td>
                  <td class="px-4 py-2">
                    <span :class="`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(plan.status)}`">
                      {{ statusLabel(plan.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="visiblePastPlans.length > 0">
          <div class="flex items-center gap-3 mb-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Past
            </h3>
            <button @click="showPast = !showPast" class="text-xs text-blue-500 hover:underline cursor-pointer">
              {{ showPast ? 'Masquer' : `Afficher (${visiblePastPlans.length})` }}
            </button>
          </div>
          <div v-if="showPast" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="min-w-full text-sm opacity-80">
              <tbody>
                <tr
                  v-for="plan in visiblePastPlans"
                  :key="plan.id"
                  class="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
                  @click="goToPlan(plan.id)"
                >
                  <td class="px-4 py-2 text-gray-700 dark:text-gray-200">{{ plan.date }}</td>
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{{ plan.service_type_name || 'Service' }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ plan.theme || '—' }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ plan.items_count || 0 }} items</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="plans.length === 0" class="text-center py-16 text-gray-400">
          <div class="text-4xl mb-3">📅</div>
          <p>{{ $t('plansList.none') }}</p>
        </div>
      </div>

      <!-- === VUE MATRICE === -->
      <div v-else-if="viewMode === 'matrix'">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40">Type</th>
                <th v-for="plan in matrixPlans" :key="plan.id"
                  @click="goToPlan(plan.id)"
                  class="py-2 px-3 text-center text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[100px]">
                  <div class="font-bold text-gray-800 dark:text-gray-200">{{ formatDay(plan.date) }}</div>
                  <div class="text-gray-400">{{ formatMonth(plan.date) }}</div>
                  <div v-if="plan.theme" class="text-xs italic text-indigo-500 truncate max-w-[90px]" :title="plan.theme">{{ plan.theme }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrixRows" :key="row.type_id ?? 'none'"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                <td class="py-3 pr-4">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ row.name }}</span>
                  </div>
                </td>
                <td v-for="plan in matrixPlans" :key="plan.id"
                  class="py-2 px-3 text-center">
                  <div v-if="planTypeId(plan) === row.type_id" @click="goToPlan(plan.id)"
                    class="cursor-pointer inline-flex flex-col items-center gap-1">
                    <span :class="statusDot(plan.status)"></span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ plan.items_count }}♪</span>
                    <span class="text-xs text-gray-400">{{ plan.people_count }}👤</span>
                  </div>
                  <span v-else class="text-gray-200 dark:text-gray-700 text-xs">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 mt-3 text-center">Cliquer sur un service pour voir le détail · ⊞ = 8 prochains services</p>
      </div>

      <!-- Pagination -->
      <div v-if="viewMode === 'list' && total > pageSize" class="flex items-center gap-2 justify-center py-6">
        <button @click="goPrev" :disabled="page === 1"
          class="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 text-sm cursor-pointer">← Préc.</button>
        <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
        <button @click="goNext" :disabled="page === totalPages"
          class="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 text-sm cursor-pointer">Suiv. →</button>
      </div>
    </div>

    <!-- Modal Nouveau Service -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4 dark:text-gray-100">{{ $t('plansList.modal_new_title') }}</h3>
        <form @submit.prevent="createPlan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.type') }}</label>
            <select v-model="form.service_type_id" required
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
              <option value="">{{ $t('plansList.select') }}</option>
              <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.date') }}</label>
              <input v-model="form.date" type="date" required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.time') }}</label>
              <input v-model="form.time" type="time"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.theme') }}</label>
            <input v-model="form.theme" type="text" :placeholder="$t('plansList.theme')"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.notes') }}</label>
            <textarea v-model="form.notes" rows="2" :placeholder="$t('plansList.notes')"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{{ $t('plansList.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('plansList.create') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Appliquer un template -->
    <div v-if="showApplyTemplate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showApplyTemplate = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4 dark:text-gray-100">{{ $t('plansList.modal_template_title') }}</h3>
        <form @submit.prevent="applyTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
            <select v-model="applyTemplateId" required
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
              <option :value="null">{{ $t('plansList.select') }}</option>
              <option v-for="tpl in planTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }} ({{ tpl.item_count }} {{ $t('plansList.items') }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.date') }}</label>
            <input v-model="applyForm.date" type="date" required
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.time') }}</label>
            <input v-model="applyForm.time" type="time"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('plansList.theme') }}</label>
            <input v-model="applyForm.theme"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showApplyTemplate = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{{ $t('plansList.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">{{ $t('plansList.create') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const router = useRouter()
const { t, tm } = useI18n()

// State
const page = ref(1)
const pageSize = ref(50) // load more at once for grouping UX
const total = ref(0)
const plans = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const planTemplates = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showForm = ref(false)
const showApplyTemplate = ref(false)
const showPast = ref(false)
const viewMode = ref<'list' | 'matrix'>('list')
const selectedServiceType = ref<string>('all')
const form = ref({ service_type_id: '', date: '', time: '10:00', theme: '', notes: '' })
const applyTemplateId = ref<number | null>(null)
const applyForm = ref({ date: '', time: '10:00', theme: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const today = new Date().toISOString().slice(0, 10)

const filteredPlans = computed(() =>
  plans.value.filter((p) =>
    selectedServiceType.value === 'all' || String(p.service_type_id ?? '') === selectedServiceType.value,
  ),
)
const upcomingPlans = computed(() => filteredPlans.value.filter(p => p.date >= today).sort((a, b) => a.date.localeCompare(b.date)))
const pastPlans = computed(() => filteredPlans.value.filter(p => p.date < today).sort((a, b) => b.date.localeCompare(a.date)))
const visibleUpcomingPlans = computed(() => upcomingPlans.value.slice(0, 30))
const visiblePastPlans = computed(() => pastPlans.value.slice(0, 30))

// Matrix: next 8 upcoming plans (columns) × service types (rows)
const matrixPlans = computed(() => upcomingPlans.value.slice(0, 8))
const matrixRows = computed(() => {
  const types = new Map<string, { type_id: number | null; name: string }>()
  for (const plan of matrixPlans.value) {
    const key = String(plan.service_type_id ?? 'none')
    if (!types.has(key)) types.set(key, { type_id: plan.service_type_id ?? null, name: plan.service_type_name || 'Sans type' })
  }
  return Array.from(types.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const planTypeId = (plan: any) => plan.service_type_id ?? null

async function fetchPlans() {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.getPlans({ page: page.value, size: pageSize.value } as any)
    // API returns array or { plans, total }
    if (Array.isArray(res)) {
      plans.value = res
      total.value = res.length
    } else {
      plans.value = res.plans ?? []
      total.value = res.total ?? plans.value.length
    }
  } catch (e: any) {
    error.value = 'Impossible de charger les plans.'
    plans.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// Only one source of loading (watch + immediate) — no more double fetch
watch([page, pageSize], fetchPlans, { immediate: true })

async function loadAux() {
  try {
    const [st, tpl] = await Promise.all([api.getServiceTypes(), api.getPlanTemplates()])
    serviceTypes.value = st
    planTemplates.value = tpl
  } catch {}
}
onMounted(loadAux)

function goPrev() { if (page.value > 1) page.value-- }
function goNext() { if (page.value < totalPages.value) page.value++ }

const formatDay = (d: string) => d ? new Date(d + 'T12:00:00').getDate().toString().padStart(2, '0') : ''
const formatMonth = (d: string) => {
  if (!d) return ''
  try {
    const monthList = tm('month') as unknown as string[]
    return monthList[new Date(d + 'T12:00:00').getMonth()]
  } catch { return '' }
}

const statusLabel = (s: string) => { try { return t(`status.${s}`) } catch { return s } }
const statusClass = (s: string) => s === 'completed' ? 'bg-green-100 text-green-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
const statusDot = (s: string) => `inline-block w-3 h-3 rounded-full ${s === 'completed' ? 'bg-green-400' : s === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'}`

const goToPlan = (id: number) => router.push({ name: 'plan-detail', params: { id: id.toString() } })

const createPlan = async () => {
  try {
    await api.createPlan({
      service_type_id: Number(form.value.service_type_id),
      date: form.value.date,
      time: form.value.time,
      theme: form.value.theme,
      notes: form.value.notes,
    })
    showForm.value = false
    form.value = { service_type_id: '', date: '', time: '10:00', theme: '', notes: '' }
    fetchPlans()
  } catch (e: any) {
    showToast(e.message || 'Error', 'error')
  }
}

const applyTemplate = async () => {
  if (!applyTemplateId.value) return
  try {
    await api.applyPlanTemplate(applyTemplateId.value, {
      date: applyForm.value.date,
      time: applyForm.value.time || undefined,
      theme: applyForm.value.theme || undefined,
    })
    showApplyTemplate.value = false
    applyTemplateId.value = null
    applyForm.value = { date: '', time: '10:00', theme: '' }
    fetchPlans()
  } catch (e: any) {
    showToast(e.message || 'Error', 'error')
  }
}
</script>

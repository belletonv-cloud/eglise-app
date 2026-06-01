<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('plansList.title') }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ total }} service{{ total > 1 ? 's' : '' }}</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <button @click="viewMode = 'list'" :class="['px-3 py-1.5 text-sm', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700']">☰</button>
          <button @click="viewMode = 'matrix'" :class="['px-3 py-1.5 text-sm', viewMode === 'matrix' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700']">⊞</button>
        </div>
        <button @click="showApplyTemplate = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-sm">
          {{ $t('plansList.add_template') }}
        </button>
        <button @click="showForm = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
          + {{ $t('plansList.add_new') }}
        </button>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="isLoading" class="space-y-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else>
      <!-- === VUE LISTE (groupée par type de service) === -->
      <div v-if="viewMode === 'list'">
        <!-- À venir -->
        <div v-if="upcomingByType.length > 0" class="mb-8">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            À venir
          </h3>
          <div v-for="group in upcomingByType" :key="group.type_id ?? 'none'" class="mb-6">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ group.name }}</span>
              <span class="text-xs text-gray-400">({{ group.plans.length }})</span>
            </div>
            <div class="space-y-2 pl-4">
              <div v-for="plan in group.plans" :key="plan.id"
                @click="goToPlan(plan.id)"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all">
                <PlanRow :plan="plan" :t="t" :formatDay="formatDay" :formatMonth="formatMonth" :statusClass="statusClass" :statusLabel="statusLabel" />
              </div>
            </div>
          </div>
        </div>

        <!-- Passés -->
        <div v-if="pastPlans.length > 0">
          <div class="flex items-center gap-3 mb-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Passés
            </h3>
            <button @click="showPast = !showPast" class="text-xs text-blue-500 hover:underline cursor-pointer">
              {{ showPast ? 'Masquer' : `Afficher (${pastPlans.length})` }}
            </button>
          </div>
          <div v-if="showPast" class="space-y-2 opacity-70">
            <div v-for="plan in pastPlans" :key="plan.id"
              @click="goToPlan(plan.id)"
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:shadow-sm cursor-pointer transition-all">
              <PlanRow :plan="plan" :t="t" :formatDay="formatDay" :formatMonth="formatMonth" :statusClass="statusClass" :statusLabel="statusLabel" />
            </div>
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

      <!-- Pagination (vue liste uniquement) -->
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
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue'
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
const form = ref({ service_type_id: '', date: '', time: '10:00', theme: '', notes: '' })
const applyTemplateId = ref<number | null>(null)
const applyForm = ref({ date: '', time: '10:00', theme: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const today = new Date().toISOString().slice(0, 10)

const upcomingPlans = computed(() => plans.value.filter(p => p.date >= today).sort((a, b) => a.date.localeCompare(b.date)))
const pastPlans = computed(() => plans.value.filter(p => p.date < today).sort((a, b) => b.date.localeCompare(a.date)))

// Group upcoming plans by service type
const upcomingByType = computed(() => {
  const groups = new Map<string, { type_id: number | null; name: string; plans: any[] }>()
  for (const plan of upcomingPlans.value) {
    const key = String(plan.service_type_id ?? 'none')
    if (!groups.has(key)) {
      groups.set(key, { type_id: plan.service_type_id ?? null, name: plan.service_type_name || 'Sans type', plans: [] })
    }
    groups.get(key)!.plans.push(plan)
  }
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name))
})

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

// Inline sub-component for a plan row (avoids repetition)
const PlanRow = defineComponent({
  props: ['plan', 't', 'formatDay', 'formatMonth', 'statusClass', 'statusLabel'],
  setup(props) {
    return () => h('div', { class: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2' }, [
      h('div', { class: 'flex items-center gap-4' }, [
        h('div', { class: 'text-center min-w-[50px]' }, [
          h('div', { class: 'text-base font-bold text-gray-800 dark:text-gray-100' }, props.formatDay(props.plan.date)),
          h('div', { class: 'text-xs text-gray-400' }, props.formatMonth(props.plan.date)),
        ]),
        h('div', {}, [
          h('h3', { class: 'font-semibold text-gray-800 dark:text-gray-100 text-sm' }, props.plan.service_type_name || 'Service'),
          h('p', { class: 'text-xs text-gray-500 dark:text-gray-400' }, `${props.plan.date}${props.plan.time ? ' · ' + props.plan.time.slice(0,5) : ''}`),
          props.plan.theme ? h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 italic' }, `« ${props.plan.theme} »`) : null,
        ]),
      ]),
      h('div', { class: 'flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap' }, [
        h('span', {}, `${props.plan.items_count || 0} éléments`),
        h('span', {}, '·'),
        h('span', {}, `${props.plan.people_count || 0} personnes`),
        h('span', {
          class: `px-2 py-0.5 rounded-full font-medium ${props.statusClass(props.plan.status)}`
        }, props.statusLabel(props.plan.status)),
      ]),
    ])
  }
})
</script>

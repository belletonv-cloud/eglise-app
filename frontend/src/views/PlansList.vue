<template>
  <div>
    <!-- Aide contextuelle -->
    <div style="position:relative; min-height:100vh;">
      <PageHelp page="plans" :helpText="t('help.plans')" :steps="helpSteps" />
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800">{{ $t('plansList.title') }}</h2>
        <div class="flex gap-2">
        <button @click="showApplyTemplate = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
          {{ $t('plansList.add_template') }}
        </button>
        <button @click="showForm = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          {{ $t('plansList.add_new') }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
  <div class="w-80 h-8 bg-gray-200 rounded"></div>
  <div class="w-72 h-5 bg-gray-100 rounded"></div>
  <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
  <div class="w-80 h-12 bg-gray-200 rounded"></div>
  <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
</div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="plan in plans" :key="plan.id"
        @click="goToPlan(plan.id)"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-4">
            <div class="text-center min-w-[60px]">
              <div class="text-lg font-bold text-gray-800">{{ formatDay(plan.date) }}</div>
              <div class="text-xs text-gray-500">{{ formatMonth(plan.date) }}</div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">{{ plan.service_type_name || $t('plansList.type') }}</h3>
              <p class="text-sm text-gray-500">
                {{ plan.date }} <span v-if="plan.time">{{ $t('at') }} {{ plan.time }}</span>
              </p>
              <p v-if="plan.theme" class="text-sm text-gray-600 italic">« {{ plan.theme }} »</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 text-sm text-gray-500 flex-wrap">
            <span>{{ plan.items_count || 0 }} {{ $t('plansList.items') }}</span>
            <span>·</span>
            <span>{{ plan.people_count || 0 }} {{ $t('plansList.people') }}</span>
            <span :class="statusClass(plan.status)" class="px-2 py-1 rounded-full text-xs font-medium">
              {{ statusLabel(plan.status) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="plans.length === 0 && !isLoading" class="text-center py-12 text-gray-400">
        {{ $t('plansList.none') }}
      </div>

      <!-- Pagination -->
      <div class="pagination flex items-center gap-2 justify-center py-4" v-if="total > pageSize">
        <button type="button" @click="goPrev" :disabled="page === 1"
          class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Précédent</button>
        <button v-for="p in totalPages" :key="p" type="button"
          @click="goToPage(p)" :class="['px-3 py-1 rounded', { 'bg-blue-600 text-white': p === page, 'bg-gray-100': p !== page } ]">
          {{ p }}
        </button>
        <button type="button" @click="goNext" :disabled="page === totalPages"
          class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Suivant</button>
      </div>
    </div>

    <!-- Modal Nouveau Service -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">{{ $t('plansList.modal_new_title') }}</h3>
        <form @submit.prevent="createPlan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.type') }}</label>
            <select v-model="form.service_type_id" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">{{ $t('plansList.select') }}</option>
              <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.date') }}</label>
              <input v-model="form.date" type="date" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.time') }}</label>
              <input v-model="form.time" type="time"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.theme') }}</label>
            <input v-model="form.theme" type="text" :placeholder="$t('plansList.theme')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.notes') }}</label>
            <textarea v-model="form.notes" rows="2" :placeholder="$t('plansList.notes')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('plansList.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('plansList.create') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Appliquer un template -->
    <div v-if="showApplyTemplate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showApplyTemplate = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">{{ $t('plansList.modal_template_title') }}</h3>
        <form @submit.prevent="applyTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select v-model="applyTemplateId" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option :value="null">{{ $t('plansList.select') }}</option>
              <option v-for="tpl in planTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }} ({{ tpl.item_count }} {{ $t('plansList.items') }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.date') }}</label>
            <input v-model="applyForm.date" type="date" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.time') }}</label>
            <input v-model="applyForm.time" type="time"
              class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('plansList.theme') }}</label>
            <input v-model="applyForm.theme"
              class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showApplyTemplate = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('plansList.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">{{ $t('plansList.create') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

// TODO Notifications
// - Envoyer un email aux membres assignés lors de la création d’un plan
// - Ajouter un bouton “Renvoyer email”
// - Ajouter un log clair en cas d’échec

<script setup lang="ts">
import ContextHelp from '../components/ContextHelp.vue';
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPlans } from '../api/plans'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const router = useRouter()
const { t, tm } = useI18n()

// pagination state
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const plans = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const planTemplates = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showForm = ref(false)
const form = ref({ service_type_id: '', date: '', time: '10:00', theme: '', notes: '' })
const showApplyTemplate = ref(false)
const applyTemplateId = ref<number | null>(null)
const applyForm = ref({ date: '', time: '10:00', theme: '' })

const totalPages = computed(() => (total.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1))

async function fetchPlans() {
  isLoading.value = true
  error.value = null
  try {
    const res = await getPlans({ page: page.value, limit: pageSize.value })
    plans.value = res.plans ?? []
    total.value = res.total ?? plans.value.length
    // Correction UX : rollback page si out-of-bounds
    if (page.value > totalPages.value) {
      page.value = totalPages.value
      await fetchPlans()
    }
  } catch (e: any) {
    error.value = 'Impossible de charger les plans.'
    plans.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

watch([page, pageSize], () => {
  fetchPlans()
}, { immediate: true })

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
}
function goPrev() {
  if (page.value > 1) page.value--
}
function goNext() {
  if (page.value < totalPages.value) page.value++
}

const formatDay = (d: string) => d ? new Date(d + 'T12:00:00').getDate().toString().padStart(2, '0') : ''
const formatMonth = (d: string) => {
  if (!d) return ''
  const monthList = tm('month') as unknown as string[]
  return monthList[new Date(d + 'T12:00:00').getMonth()]
}

const statusLabel = (s: string) => t(`status.${s}`)
const statusClass = (s: string) => s === 'completed' ? 'bg-green-100 text-green-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'

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
    loadData()
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
    loadData()
  } catch (e: any) {
    showToast(e.message || 'Error', 'error')
  }
}

const loadData = async () => {
  try {
    const [p, st, tpl] = await Promise.all([api.getPlans(), api.getServiceTypes(), api.getPlanTemplates()])
    plans.value = p
    serviceTypes.value = st
    planTemplates.value = tpl
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>

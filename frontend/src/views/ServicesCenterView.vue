<template>
  <div class="max-w-7xl mx-auto p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('apps.services_center_title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('apps.services_center_desc') }}
        </p>
      </div>
      <router-link to="/apps" class="text-sm text-blue-700 dark:text-blue-300 hover:underline shrink-0">
        ← {{ $t('apps.back') }}
      </router-link>
    </div>

    <div class="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-sm font-semibold border"
            :class="activeTab === 'order'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent'"
            @click="activeTab = 'order'"
          >
            Order
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-sm border"
            :class="activeTab === 'teams'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent'"
            @click="goTeams"
          >
            Teams
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-sm border"
            :class="activeTab === 'rehearse'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent'"
            @click="goRehearse"
          >
            Rehearse
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="selectedPlanId"
            class="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700"
            @click="openFullPlan"
          >
            {{ $t('apps.open') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3">
        <!-- Plans list -->
        <aside class="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-3">
          <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
            {{ $t('apps.services_center_subtitle') }}
          </div>

          <div v-if="loadingPlans" class="py-6 text-sm text-gray-500">{{ $t('loading') }}</div>
          <div v-else-if="plans.length === 0" class="py-6 text-sm text-gray-500">—</div>
          <div v-else class="mt-2 space-y-2">
            <button
              v-for="p in plans"
              :key="p.id"
              class="w-full text-left px-3 py-2 rounded-lg border transition-colors"
              :class="p.id === selectedPlanId
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100'"
              @click="selectPlan(p.id)"
            >
              <div class="text-sm font-semibold truncate">{{ p.title || ('Plan #' + p.id) }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ p.date }} • {{ p.time || '' }}
              </div>
            </button>
          </div>
        </aside>

        <!-- Order items -->
        <main class="lg:col-span-2 p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Order
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ items.length }} item(s)
            </div>
          </div>

          <div v-if="loadingItems" class="py-10 text-sm text-gray-500">{{ $t('loading') }}</div>
          <div v-else-if="items.length === 0" class="py-10 text-sm text-gray-500">
            —
          </div>
          <div v-else class="mt-3 space-y-2">
            <div
              v-for="it in items"
              :key="it.id"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm px-3 py-2 flex items-center gap-3"
            >
              <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">
                {{ formatLen(it.length_minutes) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ it.song_title || it.title || it.type }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ it.arrangement_name || it.type }}
                  <span v-if="it.transposed_key" class="ml-2">• {{ it.transposed_key }}</span>
                </div>
              </div>
              <div
                class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold"
                :title="it.transposed_key || ''"
              >
                {{ it.transposed_key || '—' }}
              </div>
            </div>

            <div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {{ $t('apps.drag_hint') }}
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'

const router = useRouter()

type Tab = 'order' | 'teams' | 'rehearse'
const activeTab = ref<Tab>('order')

const plans = ref<any[]>([])
const items = ref<any[]>([])
const selectedPlanId = ref<number | null>(null)

const loadingPlans = ref(true)
const loadingItems = ref(false)

function formatLen(mins: any): string {
  const n = Number(mins)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `${n}:00`
}

async function loadPlans() {
  loadingPlans.value = true
  try {
    const res = await api.getPlans({ page: 1, size: 10 } as any)
    plans.value = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
  } catch {
    plans.value = []
  } finally {
    loadingPlans.value = false
  }
}

async function selectPlan(id: number) {
  selectedPlanId.value = id
  loadingItems.value = true
  try {
    items.value = await api.getPlanItems(id)
  } catch {
    items.value = []
  } finally {
    loadingItems.value = false
  }
}

function openFullPlan() {
  if (!selectedPlanId.value) return
  router.push(`/plans/${selectedPlanId.value}`)
}

function goTeams() {
  activeTab.value = 'teams'
  router.push('/teams-dashboard')
}

function goRehearse() {
  activeTab.value = 'rehearse'
  router.push('/music-stand-app')
}

onMounted(async () => {
  await loadPlans()
  if (plans.value[0]?.id) {
    await selectPlan(plans.value[0].id)
  }
})
</script>

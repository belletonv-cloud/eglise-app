<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Historique des services</h1>

    <div class="flex gap-2 mb-4 flex-wrap">
      <select v-model="yearFilter" @change="loadHistory"
        class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <option value="">Toutes les années</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
      <select v-model="typeFilter" @change="loadHistory"
        class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <option value="">Tous les types</option>
        <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
      </select>
      <input v-model="searchQuery" @input="loadHistory" placeholder="Rechercher..."
        class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex-1" />
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>

    <div v-else-if="plans.length === 0" class="text-center py-12 text-gray-400">Aucun service passé trouvé.</div>

    <div v-else class="space-y-3">
      <div v-for="plan in plans" :key="plan.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDate(plan.date) }}</span>
              <span v-if="plan.time" class="text-sm text-gray-500">{{ plan.time?.slice(0, 5) }}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="plan.service_type_name ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600'">
                {{ plan.service_type_name || 'Service' }}
              </span>
              <span v-if="plan.theme" class="text-sm text-gray-500 italic truncate">— {{ plan.theme }}</span>
            </div>
            <div class="flex gap-4 mt-1 text-xs text-gray-500">
              <span>{{ plan.items_count || 0 }} éléments</span>
              <span>{{ plan.people_count || 0 }} participants</span>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <router-link :to="`/plans/${plan.id}`"
              class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Voir</router-link>
            <a :href="`${apiBase}/plans/${plan.id}/ical`" target="_blank"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              📅 iCal
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, getApiBase } from '../utils/api'

const apiBase = getApiBase()
const plans = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const loading = ref(true)
const yearFilter = ref(String(new Date().getFullYear()))
const typeFilter = ref('')
const searchQuery = ref('')
const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const loadHistory = async () => {
  loading.value = true
  try {
    const all = await api.getPlans(undefined, yearFilter.value ? Number(yearFilter.value) : undefined)
    const past = all.filter((p: any) => p.date < new Date().toISOString().slice(0, 10))

    let filtered = past
    if (typeFilter.value) {
      filtered = filtered.filter((p: any) => p.service_type_id === Number(typeFilter.value))
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      filtered = filtered.filter((p: any) =>
        p.theme?.toLowerCase().includes(q) ||
        p.service_type_name?.toLowerCase().includes(q) ||
        p.date?.includes(q)
      )
    }
    filtered.sort((a: any, b: any) => b.date.localeCompare(a.date))
    plans.value = filtered
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(async () => {
  try { serviceTypes.value = await api.getServiceTypes() } catch { /* ignore */ }
  await loadHistory()
})
</script>
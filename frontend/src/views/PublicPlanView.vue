<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-2xl font-bold text-indigo-700">Cieux Ouverts</div>
        <div class="text-sm text-gray-400 mt-1">Ordre du culte</div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400 dark:text-gray-500">Chargement…</div>
      <div v-else-if="error" class="text-center py-12 text-red-500">{{ error }}</div>
      <template v-else-if="plan">
        <!-- Plan header -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="text-sm text-gray-400 uppercase tracking-wide mb-1">
            {{ plan.service_type_name || 'Culte' }}
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatDate(plan.date) }}
            <span v-if="plan.time" class="text-lg font-normal text-gray-500 ml-2">{{ plan.time }}</span>
          </h1>
          <div v-if="plan.theme" class="mt-2 text-gray-600 italic">{{ plan.theme }}</div>
          <div v-if="plan.notes" class="mt-2 text-sm text-gray-500">{{ plan.notes }}</div>
          <div v-if="totalMinutes > 0" class="mt-3 text-sm text-gray-400">
            Durée estimée : {{ formatDuration(totalMinutes) }}
          </div>
        </div>

        <!-- Items list -->
        <div class="space-y-2">
          <div v-for="(item, idx) in items" :key="item.id"
            :style="item.color ? { borderLeftColor: item.color, borderLeftWidth: '4px' } : {}"
            class="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start gap-3">
            <span class="text-xs text-gray-400 dark:text-gray-500 mt-1 w-5 text-right shrink-0">{{ idx + 1 }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{{ typeLabel(item.type) }}</div>
              <div class="font-medium text-gray-800 dark:text-gray-100">{{ item.title }}</div>
              <div v-if="item.song_title && item.song_title !== item.title"
                class="text-sm text-indigo-600">{{ item.song_title }}</div>
              <div v-if="item.arrangement_name" class="text-xs text-gray-400 dark:text-gray-500">{{ item.arrangement_name }}</div>
              <div v-if="item.transposed_key" class="text-xs text-gray-400 dark:text-gray-500">Tonalité : {{ item.transposed_key }}</div>
              <div v-if="item.description" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ item.description }}</div>
            </div>
            <div v-if="item.length_minutes" class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-1">
              {{ item.length_minutes }}min
            </div>
          </div>
        </div>

        <div v-if="items.length === 0" class="text-center py-8 text-gray-400">
          Aucun élément dans cet ordre du culte.
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-xs text-gray-300">
          Lien en lecture seule · Cieux Ouverts
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getApiBase } from '../utils/api'

const props = defineProps<{ token: string }>()

const loading = ref(true)
const error = ref('')
const plan = ref<any>(null)
const items = ref<any[]>([])

const totalMinutes = computed(() => items.value.reduce((s, i) => s + (i.length_minutes || 0), 0))

function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`
}

function typeLabel(type: string) {
  return { song: 'Chant', header: 'Section', media: 'Média', announcement: 'Annonce' }[type] ?? type
}

async function load() {
  try {
    const res = await fetch(`${getApiBase()}/api/public/plans/${props.token}`)
    if (res.status === 404) { error.value = 'Ce lien de partage est invalide ou a été révoqué.'; return }
    if (!res.ok) { error.value = 'Erreur lors du chargement.'; return }
    const data = await res.json()
    plan.value = data.plan
    items.value = data.items
  } catch {
    error.value = 'Impossible de charger le plan.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

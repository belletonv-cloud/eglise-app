<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="plan">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.push('/calendar')"
          class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">&larr; Calendrier</button>
        <div class="flex-1" />
        <button @click="showEditForm = true"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">Modifier</button>
        <button @click="deletePlan"
          class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">Supprimer</button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">
              {{ formatDate(plan.date) }}
            </h1>
            <p class="text-gray-500 mt-1">
              {{ plan.service_type_name || 'Service' }}
              <span v-if="plan.time"> &middot; {{ plan.time?.slice(0, 5) }}</span>
            </p>
            <p v-if="plan.theme" class="text-gray-700 mt-2 italic">{{ plan.theme }}</p>
            <p v-if="plan.notes" class="text-gray-600 mt-2 text-sm">{{ plan.notes }}</p>
          </div>
          <span :class="statusClass(plan.status)"
            class="px-3 py-1 rounded-full text-sm font-medium">
            {{ statusLabel(plan.status) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Ordre du culte ({{ items.length }})</h2>
            <div class="flex gap-2">
              <button @click="showSongSelector = true"
                class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">+ Chant</button>
              <button @click="addItem('header')"
                class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">+ Titre</button>
              <button @click="addItem('announcement')"
                class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">+ Annonce</button>
            </div>
          </div>

          <div v-if="items.length === 0" class="text-center py-8 text-gray-400">
            Aucun élément. Ajoutez des chants, titres ou annonces.
          </div>

          <div class="space-y-2">
            <div v-for="(item, idx) in items" :key="item.id"
              class="flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 group">
              <div class="flex flex-col items-center gap-0.5 pt-1">
                <button @click="moveItem(idx, -1)" :disabled="idx === 0"
                  class="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer">&uarr;</button>
                <span class="text-xs text-gray-400">{{ idx + 1 }}</span>
                <button @click="moveItem(idx, 1)" :disabled="idx === items.length - 1"
                  class="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer">&darr;</button>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-xs font-medium text-gray-400 uppercase">{{ typeLabel(item.type) }}</span>
                    <div class="font-medium text-gray-800">{{ item.title }}</div>
                    <div v-if="item.song_title" class="text-sm text-indigo-600">{{ item.song_title }}</div>
                    <div v-if="item.description" class="text-sm text-gray-500">{{ item.description }}</div>
                  </div>
                  <button @click="deleteItem(item)"
                    class="text-red-400 hover:text-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                </div>
                <div v-if="item.type === 'song'" class="mt-1">
                  <button @click="changeSong(item)"
                    class="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    {{ item.arrangement_name ? 'Changer de chant' : 'Lier un chant' }}
                  </button>
                  <span v-if="item.transposed_key" class="text-xs text-gray-400 ml-2">
                    Transposé en {{ item.transposed_key }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SchedulePeople :planId="plan.id" @changed="loadData" />
        <AttendanceSection :planId="plan.id" @changed="loadData" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import PlanForm from '../components/PlanForm.vue'
import PlanSongSelector from '../components/PlanSongSelector.vue'
import SchedulePeople from '../components/SchedulePeople.vue'
import AttendanceSection from '../components/AttendanceSection.vue'

const route = useRoute()
const router = useRouter()
const plan = ref<any>(null)
const items = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showEditForm = ref(false)
const showSongSelector = ref(false)
const showChangeSong = ref(false)
const changingItemId = ref<number | null>(null)

const statusClass = (s: string) =>
  s === 'completed' ? 'bg-green-100 text-green-700' :
  s === 'cancelled' ? 'bg-red-100 text-red-700' :
  'bg-blue-100 text-blue-700'

const statusLabel = (s: string) =>
  s === 'completed' ? 'Terminé' : s === 'cancelled' ? 'Annulé' : 'Planifié'

const typeLabel = (t: string) =>
  t === 'song' ? 'Chant' : t === 'header' ? 'Titre' : t === 'media' ? 'Média' : t === 'announcement' ? 'Annonce' : t

const formatDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const loadData = async () => {
  const id = parseInt(route.params.id as string)
  try {
    const [planData, itemData] = await Promise.all([
      api.getPlan(id),
      api.getPlanItems(id),
    ])
    plan.value = planData
    items.value = itemData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const deletePlan = async () => {
  if (!await confirmDialog('Supprimer ce service ?')) return
  await api.deletePlan(plan.value.id)
  router.push('/calendar')
}

const onEditSaved = () => {
  showEditForm.value = false
  loadData()
}

const addItem = async (type: string) => {
  const titles: Record<string, string> = { header: 'Nouvelle section', announcement: 'Annonce', media: 'Média' }
  const item = await api.createPlanItem(plan.value.id, {
    type,
    title: titles[type] || 'Nouvel élément',
  })
  items.value.push({ ...item, song_title: null, arrangement_name: null, transposed_key: null })
}

const deleteItem = async (item: any) => {
  if (!await confirmDialog('Supprimer cet élément ?')) return
  await api.deletePlanItem(item.id)
  items.value = items.value.filter((i: any) => i.id !== item.id)
}

const moveItem = async (idx: number, dir: number) => {
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= items.value.length) return
  const a = items.value[idx]
  const b = items.value[newIdx]
  items.value[idx] = b
  items.value[newIdx] = a
  await Promise.all([
    api.updatePlanItem(a.id, { position: newIdx + 1 }),
    api.updatePlanItem(b.id, { position: idx + 1 }),
  ])
}

const onSongSelect = async (songId: number, arrangementId: number, transposedKey: string | null) => {
  showSongSelector.value = false
  const item = await api.createPlanItem(plan.value.id, {
    type: 'song',
    title: 'Chant',
    arrangement_id: arrangementId,
    transposed_key: transposedKey,
  })
  const song = await api.getSong(songId)
  items.value.push({
    ...item,
    song_title: song.title,
    arrangement_name: song.arrangements?.find((a: any) => a.id === arrangementId)?.name || null,
    transposed_key: transposedKey,
  })
}

const changeSong = (item: any) => {
  changingItemId.value = item.id
  showChangeSong.value = true
}

const onSongChange = async (songId: number, arrangementId: number, transposedKey: string | null) => {
  showChangeSong.value = false
  const song = await api.getSong(songId)
  await api.updatePlanItem(changingItemId.value!, {
    arrangement_id: arrangementId,
    transposed_key: transposedKey,
    title: song.title,
  })
  changingItemId.value = null
  loadData()
}

onMounted(loadData)
</script>

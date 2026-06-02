<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-gray-500">{{t('plan.loading')}}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="plan">
      <div class="flex items-center gap-2 mb-6 flex-wrap">
        <button @click="$router.push('/calendar')"
          class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer shrink-0">{{t('plan.back')}}</button>
        <div class="flex-1 min-w-0" />
        <button @click="$router.push(`/plans/${plan.id}/setlist`)"
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shrink-0">{{t('plan.musician_view')}}</button>
        <button v-if="songItems.length > 0" @click="openMusicStand"
          class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer shrink-0">🎵 Music Stand</button>
        <a :href="`${apiBase}/plans/${plan.id}/ical`" target="_blank"
          class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer shrink-0">📅 {{t('plan.ical')}}</a>
        <button @click="toggleShare"
          class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer shrink-0"
          title="Partager ce plan (lecture seule)">🔗 Partager</button>
        <button @click="showEditForm = true"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shrink-0">{{t('plan.edit')}}</button>
        <button @click="deletePlan"
          class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer shrink-0">{{t('plan.delete')}}</button>
      </div>

      <!-- Share panel -->
      <div v-if="showSharePanel" class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div v-if="shareToken" class="flex-1 min-w-0">
          <div class="text-sm text-gray-600 mb-1">Lien de partage (lecture seule) :</div>
          <div class="flex items-center gap-2">
            <input readonly :value="shareUrl" class="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-0" />
            <button @click="copyShare" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer shrink-0">
              {{ copied ? '✓ Copié' : 'Copier' }}
            </button>
            <button @click="revokeShare" class="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 cursor-pointer shrink-0">
              Révoquer
            </button>
          </div>
        </div>
        <div v-else class="flex-1">
          <div class="text-sm text-gray-600 mb-2">Aucun lien actif. Générer un lien public ?</div>
          <button @click="generateShare" :disabled="shareLoading"
            class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {{ shareLoading ? 'Génération…' : 'Générer le lien' }}
          </button>
        </div>
        <button @click="showSharePanel = false" class="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
      </div>


      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">{{t('plan.order')}} ({{ items.length }})
              <span v-if="totalMinutes > 0" class="text-sm font-normal text-gray-500 ml-2">· {{ formatDuration(totalMinutes) }}</span>
            </h2>
            <div class="flex gap-2 items-center flex-wrap">
              <div class="relative">
                <button
                  @click="showMusicMenu = !showMusicMenu"
                  class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                  title="Music tools"
                >
                  🎵
                </button>
                <div
                  v-if="showMusicMenu"
                  class="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20"
                >
                  <button
                    @click="openMediaPlayer"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Media Player
                  </button>
                  <button
                    @click="openSongbook"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Songbook
                  </button>
                  <button
                    @click="openMusicStandFromMenu"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Music Stand
                  </button>
                </div>
              </div>
              <button @click="showSongSelector = true"
                class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">{{t('plan.add_song')}}</button>
              <button @click="addItem('header')"
                class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">{{t('plan.add_header')}}</button>
              <button @click="addItem('announcement')"
                class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">{{t('plan.add_announcement')}}</button>
            </div>
          </div>

          <div v-if="items.length === 0" class="text-center py-8 text-gray-400">
            {{t('plan.no_items')}}
          </div>

          <div class="space-y-2">
            <div v-for="(item, idx) in items" :key="item.id"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragover.prevent="onDragOver(idx)"
              @dragenter.prevent
              @drop="onDrop(idx)"
            :style="item.color ? { borderLeftColor: item.color, borderLeftWidth: '4px' } : {}"
              :class="{ 'border-blue-400': dragIndex === idx }"
              class="flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 group transition-colors">
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
                      {{ item.arrangement_name ? t('plan.type.change_song') : t('plan.type.link_song') }}
                    </button>
                    <span v-if="item.transposed_key" class="text-xs text-gray-400 ml-2">
                      {{t('plan.type.transposed')}} {{ item.transposed_key }}
                    </span>
                  </div>
                  <!-- Durée éditable inline -->
                  <div class="flex items-center gap-2 mt-1">
                    <input type="number" min="0" max="999"
                      :value="item.length_minutes || ''"
                      @change="(e: Event) => updateDuration(item, Number((e.target as HTMLInputElement).value))"
                      class="w-14 text-xs border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none bg-transparent text-gray-500 text-right"
                      placeholder="min" title="Durée en minutes" />
                    <span class="text-xs text-gray-400">min</span>
                    <!-- Couleur de l'item -->
                    <input type="color"
                      :value="item.color || '#6366f1'"
                      @change="(e: Event) => updateColor(item, (e.target as HTMLInputElement).value)"
                      class="w-5 h-5 rounded-full border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Couleur de l'item" />
                    <button v-if="item.color"
                      @click="updateColor(item, null)"
                      class="text-xs text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Supprimer la couleur">✕</button>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <SchedulePeople :planId="plan.id" @changed="loadData" />
        <AttendanceSection :planId="plan.id" @changed="loadData" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PlanChecklist :planId="plan.id" :serviceTypeId="plan.service_type_id" />
        <SermonAudio :planId="plan.id" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api, getApiBase, authenticatedFetch } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import { showToast } from '../stores/toast'
import PlanForm from '../components/PlanForm.vue'
import PlanSongSelector from '../components/PlanSongSelector.vue'
import SchedulePeople from '../components/SchedulePeople.vue'
import AttendanceSection from '../components/AttendanceSection.vue'
import PlanChecklist from '../components/PlanChecklist.vue'
import SermonAudio from '../components/SermonAudio.vue'

const apiBase = getApiBase()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const plan = ref<any>(null)
const items = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showEditForm = ref(false)

// Share plan
const showSharePanel = ref(false)
const shareToken = ref<string | null>(null)
const shareLoading = ref(false)
const copied = ref(false)
const shareUrl = computed(() =>
  shareToken.value ? `${window.location.origin}/plan/public/${shareToken.value}` : ''
)

async function toggleShare() {
  showSharePanel.value = !showSharePanel.value
  if (showSharePanel.value && plan.value?.share_token) {
    shareToken.value = plan.value.share_token
  }
}

async function generateShare() {
  shareLoading.value = true
  try {
    const res = await authenticatedFetch(`${getApiBase()}/api/plans/${plan.value.id}/share`, { method: 'POST' })
    const data = await res.json()
    shareToken.value = data.token
    plan.value.share_token = data.token
  } catch (e: any) {
    showToast(e.message || 'Erreur', 'error')
  } finally {
    shareLoading.value = false
  }
}

async function revokeShare() {
  try {
    await authenticatedFetch(`${getApiBase()}/api/plans/${plan.value.id}/share`, { method: 'DELETE' })
    shareToken.value = null
    plan.value.share_token = null
  } catch (e: any) {
    showToast(e.message || 'Erreur', 'error')
  }
}

async function copyShare() {
  if (!shareUrl.value) return
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
const showSongSelector = ref(false)
const showChangeSong = ref(false)
const changingItemId = ref<number | null>(null)
const showMusicMenu = ref(false)

const songItems = computed(() => items.value.filter(i => i.type === 'song' && i.arrangement_id))
const totalMinutes = computed(() => items.value.reduce((sum, i) => sum + (i.length_minutes || 0), 0))
const formatDuration = (mins: number) => `${Math.floor(mins / 60) > 0 ? Math.floor(mins / 60) + 'h ' : ''}${mins % 60}min`

const updateDuration = async (item: any, val: number) => {
  item.length_minutes = val || null
  try {
    await api.updatePlanItem(item.id, { length_minutes: val || null })
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const updateColor = async (item: any, color: string | null) => {
  item.color = color
  try {
    await api.updatePlanItem(item.id, { color })
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

function openMusicStand() {
  const first = songItems.value[0]
  if (first) {
    router.push(`/music-stand/${first.song_id}/${first.arrangement_id}?plan=${plan.value?.id}`)
  }
}

function openMediaPlayer() {
  showMusicMenu.value = false
  router.push(`/plans/${plan.value?.id}/setlist`)
}

function openSongbook() {
  showMusicMenu.value = false
  router.push('/songs')
}

function openMusicStandFromMenu() {
  showMusicMenu.value = false
  openMusicStand()
}

const statusClass = (s: string) =>
  s === 'completed' ? 'bg-green-100 text-green-700' :
  s === 'cancelled' ? 'bg-red-100 text-red-700' :
  'bg-blue-100 text-blue-700'

const statusLabel = (s: string) => t('plan.status.' + (s || 'planned'))

const typeLabel = (type: string) => t('plan.type.' + (type || 'unknown'))

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
  if (!await confirmDialog(t('plan.confirm_delete'))) return
  try {
    await api.deletePlan(plan.value.id)
    router.push('/calendar')
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const onEditSaved = () => {
  showEditForm.value = false
  loadData()
}

const addItem = async (type: string) => {
  const titles: Record<string, string> = { header: t('plan.type.new_header'), announcement: t('plan.type.announcement'), media: t('plan.type.media') }
  try {
    const item = await api.createPlanItem(plan.value.id, {
      type,
      title: titles[type] || t('plan.type.new_item'),
    })
    items.value.push({ ...item, song_title: null, arrangement_name: null, transposed_key: null })
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const deleteItem = async (item: any) => {
  if (!await confirmDialog(t('plan.confirm_item_delete'))) return
  try {
    await api.deletePlanItem(item.id)
    items.value = items.value.filter((i: any) => i.id !== item.id)
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const moveItem = async (idx: number, dir: number) => {
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= items.value.length) return
  const a = items.value[idx]
  const b = items.value[newIdx]
  items.value[idx] = b
  items.value[newIdx] = a
  try {
    await Promise.all([
      api.updatePlanItem(a.id, { position: newIdx + 1 }),
      api.updatePlanItem(b.id, { position: idx + 1 }),
    ])
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const onSongSelect = async (songId: number, arrangementId: number, transposedKey: string | null) => {
  showSongSelector.value = false
  try {
    const item = await api.createPlanItem(plan.value.id, {
      type: 'song',
      title: t('plan.type.song'),
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
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const changeSong = (item: any) => {
  changingItemId.value = item.id
  showChangeSong.value = true
}

const onSongChange = async (songId: number, arrangementId: number, transposedKey: string | null) => {
  showChangeSong.value = false
  const song = await api.getSong(songId)
  try {
    await api.updatePlanItem(changingItemId.value!, {
      arrangement_id: arrangementId,
      transposed_key: transposedKey,
      title: song.title,
    })
    changingItemId.value = null
    loadData()
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

const dragIndex = ref<number | null>(null)

const onDragStart = (idx: number) => { dragIndex.value = idx }
const onDragOver = (idx: number) => { /* visual feedback handled by class */ }
const onDrop = async (idx: number) => {
  if (dragIndex.value === null || dragIndex.value === idx) { dragIndex.value = null; return }
  const from = dragIndex.value
  const to = idx
  dragIndex.value = null
  
  const [moved] = items.value.splice(from, 1)
  items.value.splice(to, 0, moved)
  
  try {
    const updates = items.value.map((item: any, i: number) =>
      api.updatePlanItem(item.id, { position: i + 1 })
    )
    await Promise.all(updates)
  } catch (e: any) {
    showToast(e.message || t('plan.error'), 'error')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{ $t('plan.loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="plan">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.push(`/plans/${plan.id}`)"
          class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">&larr; {{ $t('setlist.back_to_plan') }}</button>
<button @click="$router.push(`/kiosk/${plan.id}`)"
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer ml-auto">
           🖥️ {{ $t('setlist.kiosk_mode') }}
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 text-center">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ formatDate(plan.date) }}</h1>
        <p class="text-gray-500 mt-1">
          {{ plan.service_type_name || $t('plan.service') }}
          <span v-if="plan.time"> &middot; {{ plan.time?.slice(0, 5) }}</span>
        </p>
        <p v-if="plan.theme" class="text-gray-700 mt-2 text-lg italic">{{ plan.theme }}</p>
      </div>

      <div v-if="songs.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
        {{ $t('kiosk.no_songs') }}
      </div>

      <div class="space-y-6">
        <div v-for="song in songs" :key="song.plan_item_id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
            <div class="text-sm text-indigo-600 font-medium">{{ song.position }}. {{ song.type_label }}</div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ song.song_title }}</h2>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ song.arrangement_name }}
              <span v-if="song.key"> · {{ $t('arrangement.original_key') }} {{ song.key }}</span>
              <span v-if="song.transposed_key" class="text-indigo-600 font-medium">
                · {{ $t('arrangement.play_in') }} {{ song.transposed_key }}
              </span>
            </div>
          </div>

          <div class="p-6">
            <div v-if="song.chord_chart" class="font-mono text-sm leading-relaxed whitespace-pre-wrap"
              v-html="renderChordChart(song.chord_chart)"></div>
            <div v-else class="text-gray-400 italic">{{ $t('kiosk.no_chart') }}</div>
          </div>

          <div v-if="song.media && song.media.length" class="px-6 pb-4 flex gap-2">
            <a v-for="m in song.media" :key="m.id" :href="m.file_url" target="_blank"
              class="text-sm text-indigo-600 hover:text-indigo-800 underline">
              {{ m.filename }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="nonSongs.length" class="mt-8 bg-gray-50 rounded-xl p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-2">{{ $t('setlist.other_items') }}</h3>
        <div v-for="item in nonSongs" :key="item.id" class="text-sm text-gray-600 py-1">
          <span class="text-gray-400 uppercase text-xs">{{ item.type_label }}</span>
          {{ item.title }}
          <span v-if="item.description" class="text-gray-400">{{ $t('generic.separator') }}{{ item.description }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { parseChordPro } from '../utils/chordpro'

const route = useRoute()
const { t, locale } = useI18n()
const plan = ref<any>(null)
const songs = ref<any[]>([])
const nonSongs = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const typeLabel = (tl: string) => {
  const map: Record<string, string> = {
    song: t('plan.type.song'),
    header: t('plan.type.header'),
    media: t('plan.type.media'),
    announcement: t('plan.type.announcement'),
  }
  return map[tl] || tl
}

function renderChordChart(chart: string) {
  const lines = parseChordPro(chart)
  return lines.map((line: any) => {
    if (line.chords) {
      return `<div class="text-blue-600 font-bold tracking-wider">${line.chords}</div>`
    }
    return `<div>${line.text || ''}</div>`
  }).join('')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  try {
    const [planData, items] = await Promise.all([
      api.getPlan(id),
      api.getPlanItems(id),
    ])
    plan.value = planData

    const songItems = items.filter((i: any) => i.type === 'song')
    const loadedSongs = await Promise.all(
      songItems.map(async (item: any) => {
        let song = null
        let arrangement = null
        if (item.arrangement_id) {
          const songsList = await api.getSongs()
          for (const s of songsList) {
            const a = (s.arrangements || []).find((arr: any) => arr.id === item.arrangement_id)
            if (a) {
              song = s
              arrangement = a
              break
            }
          }
        }
        return {
          plan_item_id: item.id,
          position: item.position,
          type_label: typeLabel(item.type),
          song_title: item.song_title || item.title,
          arrangement_name: arrangement?.name || null,
          key: arrangement?.key || null,
          transposed_key: item.transposed_key || null,
          chord_chart: arrangement?.chord_chart || null,
          media: arrangement?.media || [],
        }
      })
    )
    songs.value = loadedSongs

    nonSongs.value = items
      .filter((i: any) => i.type !== 'song')
      .map((i: any) => ({ ...i, type_label: typeLabel(i.type) }))
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

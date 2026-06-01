<template>
  <div class="p-4 lg:p-6 max-w-3xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('musicStand.title') }}</h1>
      <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{{ songs.length }}</span>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="$t('musicStand.search')"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>

    <div v-else-if="filtered.length === 0 && search" class="text-center py-12 text-gray-400">
      {{ $t('musicStand.no_songs') }} "{{ search }}"
    </div>

    <div v-else class="space-y-2">
      <div v-for="song in filtered" :key="song.id" @click="openMusicStand(song)"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-colors">
        <div class="text-2xl">🎵</div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-800 dark:text-gray-100 truncate">{{ song.title }}</div>
          <div v-if="song.author" class="text-xs text-gray-500 dark:text-gray-400">{{ song.author }}</div>
        </div>
        <div class="text-xs text-gray-400 shrink-0">
          {{ song.arrangement_count }} arr.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'

const router = useRouter()
const songs = ref<any[]>([])
const loading = ref(true)
const search = ref('')

const filtered = computed(() => {
  if (!search.value) return songs.value
  const q = search.value.toLowerCase()
  return songs.value.filter((s: any) =>
    s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q)
  )
})

function openMusicStand(song: any) {
  // GET /api/songs doesn't return arrangements[] — just navigate by songId.
  // MusicStandView resolves the best arrangement via getSong(id).
  router.push(`/music-stand/${song.id}`)
}

onMounted(async () => {

  try {
    const all = await api.getSongs()
    songs.value = all.filter((s: any) => s.has_chord_chart === 1 || s.has_chord_chart === true)
  } catch {
    songs.value = []
  } finally {
    loading.value = false
  }
})
</script>

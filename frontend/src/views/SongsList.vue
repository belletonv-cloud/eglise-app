<template>
  <div class="songs-list max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('songs.title') }}</h2>
    </div>

    <div v-if="loading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
      <div class="w-80 h-8 bg-gray-200 rounded"></div>
      <div class="w-72 h-5 bg-gray-100 rounded"></div>
      <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
      <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="song in songs" :key="song.id"
        @click="goToSong(song.id)"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all song-card">
        <h3 class="text-lg font-semibold text-gray-800">{{ song.title }}</h3>
        <p v-if="song.author" class="text-sm text-gray-500 mt-1">{{ song.author }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ song.arrangement_count || 0 }} {{ $t('songs.arrangements') }}</p>
      </div>

      <div v-if="songs.length === 0" class="col-span-full text-center py-12 text-gray-400">
        {{ $t('songs.no_songs') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'

const { t } = useI18n()
const router = useRouter()

const songs = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadSongs() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.getSongs()
    songs.value = data || []
  } catch (e: any) {
    error.value = e.message || 'Erreur lors du chargement des chants'
    songs.value = []
  } finally {
    loading.value = false
  }
}

function goToSong(id: number) {
  router.push({ name: 'song-detail', params: { id: String(id) } })
}

onMounted(() => {
  loadSongs()
})
</script>

<template>
  <div class="songs-list max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('songs.title') }}</h2>
      <button v-if="canEdit" @click="showCreate = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm cursor-pointer">
        + {{ $t('songs.new_song') }}
      </button>
    </div>

    <!-- Search -->
    <div class="mb-5">
      <input v-model="search" type="search"
        :placeholder="$t('songs.search_placeholder')"
        class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>

    <div v-if="loading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
      <div class="w-80 h-8 bg-gray-200 rounded"></div>
      <div class="w-72 h-5 bg-gray-100 rounded"></div>
      <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
      <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="song in filteredSongs" :key="song.id"
        @click="goToSong(song.id)"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all song-card">
        <h3 class="text-lg font-semibold text-gray-800">{{ song.title }}</h3>
        <p v-if="song.author" class="text-sm text-gray-500 mt-1">{{ song.author }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ song.arrangement_count || 0 }} {{ $t('songs.arrangements') }}</p>
      </div>

      <div v-if="filteredSongs.length === 0" class="col-span-full text-center py-12 text-gray-400">
        {{ search ? $t('songs.no_results') : $t('songs.no_songs') }}
      </div>
    </div>

    <!-- Create song modal -->
    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showCreate = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('songs.new_song') }}</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('songs.song_title') }} *</label>
              <input v-model="form.title" type="text" autofocus
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                :placeholder="$t('songs.song_title')" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('songs.author') }}</label>
              <input v-model="form.author" type="text"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('songs.ccli') }}</label>
              <input v-model="form.ccli_number" type="text"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="123456" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('songs.themes') }}</label>
              <input v-model="form.themes" type="text"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                :placeholder="$t('songs.themes_placeholder')" />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-5">
            <button @click="showCreate = false"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
              {{ $t('cancel') }}
            </button>
            <button @click="createSong" :disabled="creating || !form.title.trim()"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
              {{ creating ? $t('saving') : $t('songs.create_song') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api, authenticatedFetch, getApiBase } from '../utils/api'
import { showToast } from '../stores/toast'
import { member } from '../stores/member'

const { t } = useI18n()
const router = useRouter()

const songs = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const showCreate = ref(false)
const creating = ref(false)
const form = ref({ title: '', author: '', ccli_number: '', themes: '' })

const canEdit = computed(() =>
  member.value?.role === 'admin' ||
  member.value?.role === 'music_director' ||
  member.value?.role === 'editor'
)

const filteredSongs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return songs.value
  return songs.value.filter(s =>
    s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q)
  )
})

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

async function createSong() {
  if (!form.value.title.trim()) return
  creating.value = true
  try {
    const res = await authenticatedFetch(`${getApiBase()}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.value.title.trim(),
        author: form.value.author.trim() || null,
        ccli_number: form.value.ccli_number.trim() || null,
        themes: form.value.themes.trim() || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const song = await res.json()
    showCreate.value = false
    form.value = { title: '', author: '', ccli_number: '', themes: '' }
    router.push({ name: 'song-detail', params: { id: String(song.id) } })
  } catch (e: any) {
    showToast(e.message || t('songs.create_error'), 'error')
  } finally {
    creating.value = false
  }
}

onMounted(loadSongs)
</script>

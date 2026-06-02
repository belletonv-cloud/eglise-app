<template>
  <div class="max-w-5xl mx-auto p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-white">
          {{ $t('apps.music_stand_title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-400">
          {{ $t('apps.music_stand_desc') }}
        </p>
      </div>
      <router-link to="/apps" class="text-sm text-blue-300 hover:underline shrink-0">
        ← {{ $t('apps.back') }}
      </router-link>
    </div>

    <div class="mt-4 overflow-hidden rounded-2xl border border-gray-900 bg-black shadow-sm">
      <div class="px-4 py-3 border-b border-gray-900 flex items-center justify-between gap-3">
        <div>
          <div class="text-[11px] uppercase tracking-[0.24em] text-blue-300/70">
            Stage mode
          </div>
          <div class="mt-1 text-xs text-gray-400">
            {{ songs.length }} song(s) · Sunday service rehearsal
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-1 text-blue-300">⚙️</span>
          <router-link
            to="/music-stand"
            class="rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-blue-300 hover:bg-blue-600/30"
          >
            {{ $t('apps.open') }}
          </router-link>
        </div>
      </div>

      <div class="p-3">
        <input
          v-model="search"
          type="text"
          :placeholder="$t('musicStand.search')"
          class="w-full px-4 py-2 rounded-lg bg-gray-950 border border-gray-900 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
        />

        <div v-if="loading" class="text-center py-10 text-gray-500">{{ $t('loading') }}</div>

        <div v-else-if="filtered.length === 0 && search" class="text-center py-10 text-gray-500">
          {{ $t('musicStand.no_songs') }} "{{ search }}"
        </div>

        <div v-else class="mt-3 space-y-2">
          <button
            v-for="song in filtered"
            :key="song.id"
            @click="openSong(song)"
            class="w-full text-left px-3 py-2 rounded-lg bg-gray-950 border border-gray-900 hover:border-blue-500/50 hover:bg-gray-900 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="text-xs text-gray-500 w-12 shrink-0">🎵</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-white truncate">
                  {{ song.title }}
                </div>
                <div v-if="song.author" class="text-xs text-gray-400 truncate">
                  {{ song.author }}
                </div>
              </div>
              <div class="text-xs text-gray-500 shrink-0">
                {{ song.arrangement_count }} arr.
              </div>
              <div class="text-xs text-blue-300 shrink-0">→</div>
            </div>
          </button>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-gray-900 bg-gray-950">
        <div class="flex items-center justify-between text-xs text-gray-400">
          <div>0:42</div>
          <div class="flex-1 mx-3 h-2 rounded bg-gray-800 overflow-hidden">
            <div class="h-full w-1/3 bg-blue-500"></div>
          </div>
          <div>3:12</div>
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
    s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q),
  )
})

function openSong(song: any) {
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

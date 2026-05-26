<template>
  <div v-if="visible" class="song-browser-overlay" @click="emit('close')">
    <div class="song-browser" @click.stop>
      <div class="browser-header">
        <input v-model="searchQuery" type="text" :placeholder="$t('musicStand.search')" class="browser-search" autofocus />
        <button @click="emit('close')" class="browser-close">✕</button>
      </div>
      <div class="browser-list">
        <div v-for="s in filteredSongs" :key="s.id"
             class="browser-song"
             :class="{ active: s.id === currentSongId }"
             @click="selectSong(s)">
          <span class="browser-song-title">{{ s.title }}</span>
          <span class="browser-song-arr">{{ s.arrangements[0]?.key || '' }} · {{ s.arrangements[0]?.tempo || '' }} BPM</span>
        </div>
        <div v-if="filteredSongs.length === 0" class="browser-empty">
          {{ $t('musicStand.no_songs') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
const props = defineProps<{
  visible: boolean
  songs: any[]
  currentSongId: number | null
}>()
const emit = defineEmits(['select-song', 'close'])

const searchQuery = ref('')
const filteredSongs = computed(() => {
  if (!searchQuery.value) return props.songs
  const q = searchQuery.value.toLowerCase()
  return props.songs.filter(s => s.title.toLowerCase().includes(q))
})

function selectSong(s: any) {
  emit('select-song', s)
  searchQuery.value = ''
}

watch(() => props.visible, v => { if (!v) searchQuery.value = '' })
</script>

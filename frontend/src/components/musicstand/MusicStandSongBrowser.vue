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
import { ref, computed, watch } from 'vue'
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
<style scoped>
.song-browser-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}
.song-browser {
    width: 100%;
    max-width: 500px;
    max-height: 70vh;
    background: #1a1a2e;
    border-radius: 16px 16px 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.browser-header {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.browser-search {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 14px;
}
.browser-search::placeholder { color: rgba(255, 255, 255, 0.4); }
.browser-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}
.browser-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}
.browser-song {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}
.browser-song:hover { background: rgba(99, 102, 241, 0.2); }
.browser-song.active { background: rgba(99, 102, 241, 0.3); }
.browser-song-title {
    color: #e0e0e0;
    font-weight: 600;
    font-size: 14px;
}
.browser-song-arr {
    color: #818cf8;
    font-size: 12px;
    margin-top: 2px;
}
.browser-empty {
    text-align: center;
    color: #6b7280;
    padding: 24px;
    font-size: 14px;
}
@media (max-width: 768px) {
    .song-browser { max-width: 100%; }
}
</style>

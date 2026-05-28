<template>
  <div class="toolbar" @click.stop>
    <button @click="emit('back')" class="toolbar-btn" :title="$t('musicStand.back')">←</button>
    <div class="toolbar-center">
      <span class="song-title" @click="emit('open-song-browser')">{{ songTitle }}</span>
      <span v-if="arrangement" class="key-badge" @click.stop="emit('toggle-key-picker')">{{ currentKey }}</span>
    </div>
    <div class="toolbar-right">
      <button v-if="prevSongId" @click.stop="emit('go-prev')" class="toolbar-btn" title="Chant précédent">⏮</button>
      <button v-if="nextSongId" @click.stop="emit('go-next')" class="toolbar-btn" title="Chant suivant">⏭</button>
      <button @click.stop="emit('transpose', -1)" class="toolbar-btn sm:px-1 sm:text-sm" title="-1 demi-ton">−</button>
      <button @click.stop="emit('transpose', 1)"  class="toolbar-btn sm:px-1 sm:text-sm" title="+1 demi-ton">+</button>
      <button v-if="setlistSongs && setlistSongs.length > 0" @click.stop="emit('toggle-setlist')" class="toolbar-btn" :class="{ active: showSetlist }" :title="$t('setlist.back_to_plan')">☰</button>
      <button @click.stop="emit('toggle-metronome')" class="toolbar-btn" :class="{ active: metronomePlaying }" title="Métronome">♩</button>
      <button @click.stop="emit('toggle-auto-scroll')" class="toolbar-btn" :class="{ active: autoScrollActive }" :title="autoScrollActive ? 'Auto-scroll ON' : 'Auto-scroll OFF'">⟳</button>
      <button @click.stop="emit('toggle-stage-mode')" class="toolbar-btn" :class="{ active: stageMode }" title="Mode scène">🌙</button>
      <button @click.stop="emit('toggle-settings')" class="toolbar-btn" :title="$t('pdfExport.title')">⚙</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  songTitle: string
  arrangement?: any
  currentKey: string
  prevSongId: number | null
  nextSongId: number | null
  setlistSongs: any[]
  showSetlist: boolean
  metronomePlaying: boolean
  autoScrollActive: boolean
  stageMode: boolean
}>()
const emit = defineEmits([
  'back',
  'open-song-browser',
  'toggle-key-picker',
  'go-prev',
  'go-next',
  'transpose',
  'toggle-setlist',
  'toggle-metronome',
  'toggle-auto-scroll',
  'toggle-stage-mode',
  'toggle-settings',
])
</script>

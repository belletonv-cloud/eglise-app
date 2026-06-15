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
      <button v-if="arrangement" @click.stop="emit('toggle-notes')" class="toolbar-btn" :class="{ active: showNotes }" title="Notes musiciens">📝</button>
      <button v-if="arrangement" @click.stop="emit('toggle-canvas')" class="toolbar-btn" :class="{ active: canvasActive }" title="Annotations dessin">✏️</button>
      <button @click.stop="emit('toggle-settings')" class="toolbar-btn" :title="$t('pdfExport.title')">⚙</button>
    </div>
  </div>
</template>
<script setup lang="ts">
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
  showNotes: boolean
  canvasActive: boolean
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
  'toggle-notes',
  'toggle-canvas',
  'toggle-settings',
])
</script>
<style scoped>
.toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(30, 30, 50, 0.95);
    backdrop-filter: blur(10px);
    z-index: 100;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.toolbar-center {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    justify-content: center;
}
.song-title {
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.key-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #6366f1;
    color: white;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
}
.key-badge:hover { background: #4f46e5; }
.toolbar-btn {
    background: none;
    border: none;
    color: #a0a0b0;
    font-size: 20px;
    padding: 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}
.toolbar-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }
.toolbar-btn.active { color: #6366f1; }
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
}
</style>

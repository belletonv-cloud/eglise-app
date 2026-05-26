<template>
  <div v-if="visible" class="metronome" @click.stop>
    <div class="metronome-controls">
      <button @click="$emit('toggle-play')" class="metro-btn">
        {{ playing ? '⏸' : '▶' }}
      </button>
      <span class="bpm-display" @click="$emit('toggle-edit-bpm')">
        <input v-if="editBpm" v-model.number="innerBpm" type="number" class="bpm-input" @blur="$emit('toggle-edit-bpm')" @keyup.enter="$emit('toggle-edit-bpm')" min="30" max="300" />
        <span v-else>{{ bpm }} BPM</span>
      </span>
      <button @click="$emit('change-meter', meter === 4 ? 3 : 4)" class="metro-btn">{{ meter }}/4</button>
      <label class="metro-btn auto-scroll-toggle">
        <input type="checkbox" :checked="autoScrollActive" @change="$emit('toggle-auto-scroll')" @click.stop /> Auto-scroll
      </label>
      <button @click="$emit('close')" class="metro-btn">✕</button>
    </div>
    <div class="beat-indicators">
      <div v-for="i in meter" :key="i" class="beat-dot" :class="{ active: currentBeat === i - 1 && playing }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  visible: boolean
  playing: boolean
  bpm: number
  meter: number
  editBpm: boolean
  autoScrollActive: boolean
  currentBeat: number
}>()
const emits = defineEmits<{
  (e: 'close'): void
  (e: 'toggle-play'): void
  (e: 'toggle-edit-bpm'): void
  (e: 'change-meter', value: number): void
  (e: 'toggle-auto-scroll'): void
  (e: 'bpm-change', value: number): void
  (e: 'beat-change', value: number): void
}>()
// Local copy of BPM to allow direct edit
const innerBpm = ref(props.bpm)
watch(() => props.bpm, (val) => { innerBpm.value = val })
watch(innerBpm, (val) => { emits('bpm-change', val) })
</script>

<style scoped>
.metronome {
  /* styles identiques à l’existant, on pourra raffiner ici */
}
</style>

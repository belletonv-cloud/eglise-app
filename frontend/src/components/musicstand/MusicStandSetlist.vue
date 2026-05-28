<template>
  <div v-if="visible" class="setlist-overlay" @click="emitClose">
    <div class="setlist-panel" @click.stop>
      <div class="setlist-header">
        <h3 class="setlist-title-heading">{{ title }}</h3>
        <button @click="emitClose" class="setlist-close">✕</button>
      </div>
      <div class="setlist-list">
        <div 
          v-for="(item, idx) in planItems"
          :key="item.id"
          class="setlist-item"
          :class="itemClass(item, idx)"
          @click="handleSelect(item)"
        >
          <span class="setlist-num">{{ idx + 1 }}</span>
          <div class="setlist-info">
            <span v-if="item.type !== 'song'" class="setlist-type">{{ item.title }}</span>
            <template v-else>
              <span class="setlist-title">{{ item.song_title || item.title }}</span>
              <span class="setlist-detail">
                {{ item.arrangement_key || item.transposed_key || '' }}
                <span v-if="item.tempo"> · {{ item.tempo }} BPM</span>
              </span>
            </template>
          </div>
          <span v-if="item.type === 'song' && item.arrangement_id" class="setlist-play">▶</span>
        </div>
        <div v-if="planItems.length === 0" class="setlist-empty">{{ emptyLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * MusicStandSetlist
 * UI et logique de sélection d’un chant dans la setlist (ordre du plan).
 * Props typés strict, events explicites.
 */
const props = defineProps<{
  visible: boolean
  planItems: any[]
  currentSongId: number | null
  title?: string
  emptyLabel?: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select-item', item: any): void
}>()

function emitClose() {
  emit('close')
}

function handleSelect(item: any) {
  if (item.type === 'song' && item.arrangement_id) {
    emit('select-item', item)
  }
}

const itemClass = (item: any, idx: number) => ({
  current: item.type === 'song' && item.arrangement_id && item.song_id === props.currentSongId,
  'song-item': item.type === 'song',
  'non-song': item.type !== 'song',
})
</script>

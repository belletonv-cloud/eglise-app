<template>
  <div class="chart-container">
    <template v-if="lines && lines.length > 0">
      <div v-for="(line, idx) in lines" :key="idx" class="chart-line">
        <template v-if="line.type === 'section'">
          <span class="section-label">{{ line.label }}</span>
        </template>
        <template v-else-if="line.type === 'plain'">
          <span class="plain-text">{{ line.text }}</span>
        </template>
        <template v-else-if="line.type === 'chord-lyric'">
          <span v-for="(part, j) in line.parts" :key="j" class="chord-lyric-block">
            <span class="chord" v-if="part.chord">{{ part.chord }}</span>
            <span class="lyric" v-if="part.lyric">{{ part.lyric }}</span>
          </span>
        </template>
      </div>
    </template>
    <div v-else class="no-chart">
      <slot name="none">No chart available</slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
// Type copié localement : doit correspondre à la structure calculée dans MusicStandView.vue
import type { ParsedLine } from '../../types/ParsedLine'

const props = defineProps({
  lines: {
    type: Array as PropType<ParsedLine[]>,
    required: true
  }
})
</script>

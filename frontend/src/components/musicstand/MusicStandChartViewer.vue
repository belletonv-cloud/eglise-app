<template>
  <div class="chart-container" :style="{ fontSize: fontSize + 'px' }">
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
import type { ParsedLine } from '../../types/ParsedLine'

defineProps({
  lines: {
    type: Array as PropType<ParsedLine[]>,
    required: true
  },
  fontSize: {
    type: Number,
    default: 22
  }
})
</script>

<style scoped>
.chart-container {
    flex: 1;
    overflow-y: auto;
    padding: 70px 20px 80px;
    line-height: 1.6;
}

.chart-line {
    margin-bottom: 4px;
    white-space: pre-wrap;
}

.chart-line.section {
    margin-top: 16px;
    margin-bottom: 8px;
}

.chord-lyric-block {
    display: inline-block;
    vertical-align: bottom;
    text-align: center;
}

.chord {
    display: block;
    color: #f59e0b;
    font-weight: bold;
    font-size: 0.85em;
    line-height: 1.2;
}

.lyric {
    display: block;
    color: #e0e0e0;
}

.plain-text {
    color: #a0a0b0;
    font-style: italic;
}

.section-label {
    display: inline-block;
    padding: 2px 10px;
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.chart-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.no-chart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    font-size: 14px;
}
</style>

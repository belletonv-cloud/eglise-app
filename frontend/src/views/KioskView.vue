<template>
  <div class="kiosk" @click="nextSong" @keydown="onKeydown" tabindex="0" ref="kioskEl">
    <div v-if="loading" class="loading-full">{{$t('kiosk.loading')}}</div>
    <div v-else-if="error" class="loading-full text-red-500">{{ error }}</div>

    <template v-else-if="currentSong">
      <div class="kiosk-header">
        <div class="kiosk-info">
          <span class="kiosk-service">{{ plan?.service_type_name || $t('kiosk.default_service') }}</span>
          <span class="kiosk-date">{{ formatDate(plan?.date) }}</span>
        </div>
        <div class="kiosk-song-count">{{ songIndex + 1 }} / {{ songs.length }}</div>
      </div>

      <div class="kiosk-body">
        <div class="kiosk-song-title">{{ currentSong.song_title }}</div>
        <div class="kiosk-song-key" v-if="currentSong.transposed_key">
          {{ $t('arrangement.original_key') }} <strong>{{ currentSong.transposed_key }}</strong>
          <span v-if="currentSong.arrangement_name"> · {{ currentSong.arrangement_name }}</span>
        </div>

        <div class="kiosk-chart" v-if="currentSong.chord_chart">
          <div v-for="(line, idx) in parsedLines" :key="idx"
            :class="line.type === 'empty' ? 'chart-empty' : 'chart-block'">
            <div v-if="line.type !== 'empty'" class="chart-chord">{{ line.chordRow }}</div>
            <div v-if="line.type === 'normal'" class="chart-lyric">{{ line.lyrics }}</div>
          </div>
        </div>
        <div v-else class="kiosk-no-chart">{{$t('kiosk.no_chart')}}</div>
      </div>

      <div class="kiosk-footer">
        <button @click.stop="prevSong" class="kiosk-nav-btn">◀ {{$t('kiosk.prev')}}</button>
        <button @click.stop="exitKiosk" class="kiosk-exit-btn">✕ {{$t('kiosk.exit')}}</button>
        <button @click.stop="nextSong" class="kiosk-nav-btn">{{$t('kiosk.next')}} ▶</button>
      </div>
    </template>

    <div v-else class="loading-full">{{ $t('kiosk.no_songs') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { parseChordPro } from '../utils/chordpro'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const kioskEl = ref<HTMLElement | null>(null)

const plan = ref<any>(null)
const songs = ref<any[]>([])
const songIndex = ref(0)
const loading = ref(true)
const error = ref('')

const currentSong = computed(() => songs.value[songIndex.value])

const parsedLines = computed(() => {
  if (!currentSong.value?.chord_chart) return []
  return parseChordPro(currentSong.value.chord_chart)
})

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

function nextSong() {
  if (songIndex.value < songs.value.length - 1) {
    songIndex.value++
  }
}

function prevSong() {
  if (songIndex.value > 0) {
    songIndex.value--
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    nextSong()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevSong()
  } else if (e.key === 'Escape') {
    exitKiosk()
  }
}

function exitKiosk() {
  const planId = route.params.id
  router.push(`/plans/${planId}`)
}

function enterFullscreen() {
  if (kioskEl.value?.requestFullscreen) {
    kioskEl.value.requestFullscreen().catch(() => {})
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (isNaN(id)) { error.value = t('app.invalid_id'); loading.value = false; return }

  try {
    const [planData, items] = await Promise.all([
      api.getPlan(id),
      api.getPlanItems(id),
    ])
    plan.value = planData

    const songItems = items.filter((i: any) => i.type === 'song')
    const loadedSongs = await Promise.all(
      songItems.map(async (item: any) => {
        let song: any = null
        let arrangement: any = null
        if (item.arrangement_id) {
          const songsList = (await api.getSongs()).data ?? []
          for (const s of songsList) {
            const a = (s.arrangements || []).find((arr: any) => arr.id === item.arrangement_id)
            if (a) { song = s; arrangement = a; break }
          }
        }
        return {
          plan_item_id: item.id,
          position: item.position,
          song_title: item.song_title || item.title,
          arrangement_name: arrangement?.name || null,
          key: arrangement?.key || null,
          transposed_key: item.transposed_key || null,
          chord_chart: arrangement?.chord_chart || null,
        }
      })
    )
    songs.value = loadedSongs
    if (loadedSongs.length === 0) error.value = t('kiosk.no_songs')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }

  await nextTick()
  enterFullscreen()

  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>

<style>
.kiosk {
  position: fixed;
  inset: 0;
  background: #0f172a;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  font-family: system-ui, -apple-system, sans-serif;
  cursor: pointer;
  user-select: none;
}

.loading-full {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.5rem;
  color: #94a3b8;
}

.kiosk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.kiosk-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.kiosk-service {
  font-size: 1.1rem;
  font-weight: 600;
  color: #60a5fa;
}

.kiosk-date {
  color: #94a3b8;
  font-size: 0.95rem;
}

.kiosk-song-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #60a5fa;
  background: #1e3a5f;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.kiosk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.kiosk-song-title {
  font-size: clamp(1.5rem, 4vw, 3rem);
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
  text-align: center;
}

.kiosk-song-key {
  font-size: clamp(1rem, 2vw, 1.5rem);
  color: #60a5fa;
  margin-bottom: 2rem;
}

.kiosk-chart {
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(1.2rem, 3vw, 2.2rem);
  line-height: 1.5;
  text-align: center;
  max-width: 100%;
  overflow-y: auto;
}

.chart-empty {
  height: 0.75em;
}

.chart-standalone {
  margin-bottom: 0.3em;
}

.chart-block {
  margin-bottom: 0.3em;
}

.chart-chord {
  color: #fbbf24;
  font-weight: 700;
  white-space: pre;
  letter-spacing: 0.02em;
}

.chart-lyric {
  color: #e2e8f0;
  white-space: pre-wrap;
}

.kiosk-no-chart {
  color: #64748b;
  font-size: 1.5rem;
  font-style: italic;
}

.kiosk-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.kiosk-nav-btn {
  padding: 0.75rem 1.5rem;
  background: #334155;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.kiosk-nav-btn:hover {
  background: #475569;
}

.kiosk-exit-btn {
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.kiosk-exit-btn:hover {
  background: #b91c1c;
}
</style>

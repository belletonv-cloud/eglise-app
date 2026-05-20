<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('sermonAudio.title') }}</h3>
    </div>

    <div v-if="audio" class="space-y-2">
      <p v-if="audio.audio_title" class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ audio.audio_title }}</p>
      <audio v-if="audio.audio_url" :src="`${apiBase}/plans/${props.planId}/audio/stream`" controls class="w-full" />
      <div v-for="att in audio.attachments" :key="att.id" class="flex items-center justify-between py-1">
        <div class="flex-1 min-w-0">
          <span class="text-sm text-gray-600 dark:text-gray-400 truncate block">{{ att.filename }}</span>
          <audio :src="getAttachmentUrl(att)" controls class="w-full mt-1" v-if="att.file_type === 'audio'" />
        </div>
        <button @click="deleteAudio(att.id)" class="text-red-400 hover:text-red-600 text-xs cursor-pointer ml-2">{{ $t('sermonAudio.delete') }}</button>
      </div>
    </div>

    <div v-if="!audio" class="text-center py-4 text-sm text-gray-400">{{ $t('sermonAudio.no_recording') }}</div>

    <div class="mt-3">
      <input v-model="audioTitle" :placeholder="$t('sermonAudio.placeholder')"
        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" />
      <input ref="fileInput" type="file" accept="audio/*" @change="upload" class="block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
    </div>

    <div v-if="segmentsData" class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">{{ $t('sermonAudio.segments') }}</h4>
        <span v-if="segmentsData.songs?.length" class="text-xs text-gray-400">{{ segmentsData.songs.length }} {{ $t('sermonAudio.songs').toLowerCase() }}</span>
      </div>

      <div v-if="segmentsData.songs?.length" class="mb-3">
        <div v-for="(s, i) in segmentsData.songs" :key="i" class="flex items-center gap-2 py-1 px-2 even:bg-gray-50 dark:even:bg-gray-700/30 rounded text-sm">
          <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-medium shrink-0">{{ i + 1 }}</span>
          <span class="flex-1 truncate text-gray-700 dark:text-gray-300">{{ s.title || '—' }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ fmtTime(s.start) }} – {{ fmtTime(s.end) }}</span>
        </div>
      </div>

      <div class="max-h-64 overflow-y-auto space-y-1">
        <div v-for="(seg, i) in segmentsData.segments" :key="i" class="flex items-start gap-2 py-1 px-2 even:bg-gray-50 dark:even:bg-gray-700/30 rounded text-xs">
          <span class="shrink-0 w-16 text-gray-400 font-mono mt-0.5">{{ fmtTime(seg.start_seconds) }}</span>
          <span :class="typeClass(seg.segment_type)" class="shrink-0 w-20 text-center rounded px-1 py-0.5 font-medium">{{ typeLabel(seg.segment_type) }}</span>
          <span class="flex-1 text-gray-600 dark:text-gray-400 truncate">{{ seg.title || seg.text || '' }}</span>
          <span v-if="seg.confidence" class="shrink-0 text-gray-300 w-8 text-right">{{ (seg.confidence * 100).toFixed(0) }}%</span>
        </div>
        <p v-if="!segmentsData.segments?.length" class="text-center py-2 text-gray-400 text-xs">{{ $t('sermonAudio.no_segments') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api, getApiBase } from '../utils/api'

const props = defineProps<{ planId: number }>()
const { t } = useI18n()

const apiBase = getApiBase()
const audio = ref<any>(null)
const audioTitle = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const segmentsData = ref<{ segments: any[]; songs: any[] } | null>(null)

const typeLabels: Record<string, string> = {
  introduction: t('sermonAudio.type_introduction'),
  louange: t('sermonAudio.type_louange'),
  prédication: t('sermonAudio.type_predication'),
  'sainte-cène': t('sermonAudio.type_sainte_cene'),
  transition: t('sermonAudio.type_transition'),
}

const typeColors: Record<string, string> = {
  introduction: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  louange: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  prédication: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'sainte-cène': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  transition: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

function typeLabel(type: string) {
  return typeLabels[type] || type
}

function typeClass(type: string) {
  return typeColors[type] || typeColors.transition
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const getAttachmentUrl = (att: any) => {
  if (att.file_url?.startsWith('kdrive:')) {
    return `${apiBase}/attachments/${att.id}/file`
  }
  return att.file_url || ''
}

const loadSegments = async () => {
  try {
    segmentsData.value = await api.getAudioSegments(props.planId)
  } catch { /* not processed yet */ }
}

const load = async () => {
  try {
    audio.value = await api.getPlanAudio(props.planId)
  } catch { /* ignore */ }
  await loadSegments()
}

const upload = async () => {
  const file = fileInput.value?.files?.[0]
  if (!file) return
  try {
    await api.uploadPlanAudio(props.planId, file, audioTitle.value || t('sermonAudio.upload_title'))
    audioTitle.value = ''
    if (fileInput.value) fileInput.value.value = ''
    await load()
  } catch (e: any) {
    alert(t('sermonAudio.upload_error') + e.message)
  }
}

const deleteAudio = async (id: number) => {
  try {
    await api.deleteAttachment(id)
    await load()
  } catch { /* ignore */ }
}

onMounted(load)
</script>

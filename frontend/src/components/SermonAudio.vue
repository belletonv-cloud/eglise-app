<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-800 dark:text-gray-100">Enregistrement audio</h3>
    </div>

    <div v-if="audio" class="space-y-2">
      <p v-if="audio.audio_title" class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ audio.audio_title }}</p>
      <audio v-if="audio.audio_url" :src="`${apiBase}/plans/${props.planId}/audio/stream`" controls class="w-full" />
      <div v-for="att in audio.attachments" :key="att.id" class="flex items-center justify-between py-1">
        <div class="flex-1 min-w-0">
          <span class="text-sm text-gray-600 dark:text-gray-400 truncate block">{{ att.filename }}</span>
          <audio :src="getAttachmentUrl(att)" controls class="w-full mt-1" v-if="att.file_type === 'audio'" />
        </div>
        <button @click="deleteAudio(att.id)" class="text-red-400 hover:text-red-600 text-xs cursor-pointer ml-2">Suppr.</button>
      </div>
    </div>

    <div v-if="!audio" class="text-center py-4 text-sm text-gray-400">Aucun enregistrement.</div>

    <div class="mt-3">
      <input v-model="audioTitle" placeholder="Titre de la prédication"
        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" />
      <input ref="fileInput" type="file" accept="audio/*" @change="upload" class="block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, getApiBase } from '../utils/api'

const props = defineProps<{ planId: number }>()

const apiBase = getApiBase()
const audio = ref<any>(null)
const audioTitle = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const getFileUrl = (url: string) => {
  if (url?.startsWith('kdrive:')) {
    const id = url.slice(7)
    return `${apiBase}/attachments/${id}/file`
  }
  return url || ''
}

const getAttachmentUrl = (att: any) => {
  if (att.file_url?.startsWith('kdrive:')) {
    return `${apiBase}/attachments/${att.id}/file`
  }
  return att.file_url || ''
}

const load = async () => {
  try {
    audio.value = await api.getPlanAudio(props.planId)
  } catch { /* ignore */ }
}

const upload = async () => {
  const file = fileInput.value?.files?.[0]
  if (!file) return
  try {
    const result = await api.uploadPlanAudio(props.planId, file, audioTitle.value || 'Enregistrement')
    audioTitle.value = ''
    if (fileInput.value) fileInput.value.value = ''
    await load()
  } catch (e: any) {
    alert('Erreur upload: ' + e.message)
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
<template>
  <div class="annotations-panel">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
      📝 {{ $t('arrangementAnnotation.title') }}
      <span class="text-sm font-normal text-gray-500 dark:text-gray-400 dark:text-gray-500">{{$t('arrangementAnnotation.count', { count: annotations.length })}}</span>
    </h3>

    <div class="space-y-3 mb-4">
      <div v-for="ann in annotations" :key="ann.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ ann.first_name }} {{ ann.last_name }}
              <span v-if="ann.is_shared" class="text-xs text-blue-500 ml-2">{{ $t('arrangementAnnotation.shared') }}</span>
              <span v-else class="text-xs text-gray-400 ml-2">{{ $t('arrangementAnnotation.private') }}</span>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ ann.content }}</p>
            <div class="text-xs text-gray-400 mt-1">{{ formatDate(ann.created_at) }}</div>
          </div>
          <div v-if="ann.member_id === currentMemberId" class="flex gap-1 shrink-0">
            <button @click="editAnnotation(ann)" class="p-1 text-gray-400 hover:text-blue-500 cursor-pointer" :title="$t('arrangementAnnotation.edit')">✏️</button>
            <button @click="removeAnnotation(ann.id)" class="p-1 text-gray-400 hover:text-red-500 cursor-pointer" :title="$t('arrangementAnnotation.delete')">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editing" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <textarea v-model="form.content" rows="3" :placeholder="$t('arrangementAnnotation.add_placeholder')"
        class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"></textarea>
      <div class="flex items-center justify-between mt-2">
        <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input type="checkbox" v-model="form.is_shared" class="rounded" />
          {{ $t('arrangementAnnotation.shared_label') }}
        </label>
        <div class="flex gap-2">
          <button @click="cancelEdit" class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer">{{$t('arrangementAnnotation.cancel')}}</button>
          <button @click="saveAnnotation" :disabled="!form.content.trim()"
            class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {{ editing === 'new' ? $t('arrangementAnnotation.add') : $t('arrangementAnnotation.save') }}
          </button>
        </div>
      </div>
    </div>
    <button v-else @click="startNew" class="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
      {{ $t('arrangementAnnotation.add_button') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { user } from '../stores/auth'
import { showToast } from '../stores/toast'

const { t } = useI18n()

const props = defineProps<{ arrangementId: number }>()

const annotations = ref<any[]>([])
const editing = ref<'new' | number | null>(null)
const form = ref({ content: '', is_shared: false })

const currentMemberId = computed(() => (user.value as any)?.member_id)

function formatDate(d: string) {
  if (!d) return ''
  // On pourrait rendre ça localisable si nécessaire (clé i18n)
  return new Date(d).toLocaleDateString(t('langCode') || 'fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

async function loadAnnotations() {
  if (!props.arrangementId) return
  try {
    annotations.value = await api.getArrangementAnnotations(props.arrangementId)
  } catch { annotations.value = [] }
}

function startNew() {
  editing.value = 'new'
  form.value = { content: '', is_shared: false }
}

function editAnnotation(ann: any) {
  editing.value = ann.id
  form.value = { content: ann.content, is_shared: !!ann.is_shared }
}

function cancelEdit() {
  editing.value = null
  form.value = { content: '', is_shared: false }
}

async function saveAnnotation() {
  if (!form.value.content.trim()) return
  try {
    if (editing.value === 'new') {
      await api.createAnnotation(props.arrangementId, {
        content: form.value.content,
        is_shared: form.value.is_shared,
      })
    } else if (typeof editing.value === 'number') {
      await api.updateAnnotation(editing.value, {
        content: form.value.content,
        is_shared: form.value.is_shared,
      })
    }
    editing.value = null
    form.value = { content: '', is_shared: false }
    await loadAnnotations()
  } catch (e: any) {
    showToast(t('arrangementAnnotation.error', { msg: e.message }), 'error')
  }
}

async function removeAnnotation(id: number) {
  if (!confirm(t('arrangementAnnotation.confirm_delete'))) return
  try {
    await api.deleteAnnotation(id)
    annotations.value = annotations.value.filter(a => a.id !== id)
  } catch (e: any) {
    showToast(t('arrangementAnnotation.error', { msg: e.message }), 'error')
  }
}

onMounted(loadAnnotations)
</script>

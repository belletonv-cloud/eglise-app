<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{ $t('loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else-if="template">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.push('/plan-templates')"
          class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('planTemplateDetail.back') }}</button>
        <div class="flex-1" />
        <button @click="showApply = true"
          class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">{{ $t('planTemplateDetail.apply') }}</button>
        <button @click="deleteTemplate"
          class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">{{ $t('planTemplateDetail.delete') }}</button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <input v-model="editName" @change="saveTemplate"
              class="text-2xl font-bold text-gray-800 dark:text-gray-100 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent" />
            <textarea v-model="editDescription" @change="saveTemplate" rows="2"
              class="text-gray-500 mt-1 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent resize-none"></textarea>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ $t('planTemplateDetail.items_title', { count: items.length }) }}</h2>
          <div class="flex gap-2">
            <button @click="addItem('song')"
              class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">{{ $t('planTemplateDetail.add_song') }}</button>
            <button @click="addItem('header')"
              class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">{{ $t('planTemplateDetail.add_header') }}</button>
            <button @click="addItem('announcement')"
              class="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">{{ $t('planTemplateDetail.add_announcement') }}</button>
          </div>
        </div>

        <div v-if="items.length === 0" class="text-center py-8 text-gray-400">
          {{ $t('planTemplateDetail.no_items') }}
        </div>

        <div class="space-y-2">
          <div v-for="(item, idx) in items" :key="item.id"
            class="flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 group">
            <div class="flex flex-col items-center gap-0.5 pt-1">
              <button @click="moveItem(idx, -1)" :disabled="idx === 0"
                class="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer">&uarr;</button>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ idx + 1 }}</span>
              <button @click="moveItem(idx, 1)" :disabled="idx === items.length - 1"
                class="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer">&darr;</button>
            </div>
            <div class="flex-1 min-w-0">
              <span class="text-xs font-medium text-gray-400 uppercase">{{ typeLabel(item.type) }}</span>
              <div class="flex gap-2 items-start mt-1">
                <input v-model="item.title" @change="updateItem(item)"
                  class="flex-1 font-medium text-gray-800 dark:text-gray-100 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent" />
                <button @click="deleteItem(item)"
                  class="text-red-400 hover:text-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
              </div>
              <div v-if="item.type === 'song'" class="mt-1">
                <select v-model="item.arrangement_id" @change="updateItem(item)"
                  class="text-sm border border-gray-300 rounded px-2 py-1">
                  <option :value="null">Sans arrangement</option>
                  <option v-for="a in arrangements" :key="a.id" :value="a.id">
                    {{ a.song_title + ' - ' + a.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showApply" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showApply = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
          <h3 class="text-xl font-bold mb-4">{{ $t('planTemplateDetail.apply_title', { name: template.name }) }}</h3>
          <form @submit.prevent="applyTemplate" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplateDetail.date') }}</label>
              <input v-model="applyForm.date" type="date" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplateDetail.time') }}</label>
              <input v-model="applyForm.time" type="time"
                class="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplateDetail.theme') }}</label>
              <input v-model="applyForm.theme"
                class="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div class="flex gap-3 justify-end">
              <button type="button" @click="showApply = false"
                class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('planTemplateDetail.cancel') }}</button>
              <button type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">{{ $t('planTemplateDetail.create_plan') }}</button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import { useToast } from '../stores/toast'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const template = ref<any>(null)
const items = ref<any[]>([])
const arrangements = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const editName = ref('')
const editDescription = ref('')
const showApply = ref(false)
const applyForm = ref({ date: '', time: '', theme: '' })

const typeLabel = (tl: string) => {
  const map: Record<string, string> = {
    song: t('planTemplateDetail.types.song'),
    header: t('planTemplateDetail.types.header'),
    media: t('planTemplateDetail.types.media'),
    announcement: t('planTemplateDetail.types.announcement'),
  }
  return map[tl] || tl
}

async function loadData() {
  const id = parseInt(route.params.id as string)
  try {
    const [tpl, itms, songs] = await Promise.all([
      api.getPlanTemplate(id),
      api.getPlanTemplateItems(id),
      api.getSongs(),
    ])
    template.value = tpl
    editName.value = tpl.name
    editDescription.value = tpl.description || ''
    items.value = itms
    arrangements.value = songs.flatMap((s: any) =>
      (s.arrangements || []).map((a: any) => ({
        ...a,
        song_title: s.title,
      }))
    )
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveTemplate() {
  const id = parseInt(route.params.id as string)
  try {
    await api.updatePlanTemplate(id, {
      name: editName.value,
      description: editDescription.value || undefined,
    })
    useToast().show(t('planTemplateDetail.updated'), 'success')
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function deleteTemplate() {
  if (!await confirmDialog(t('planTemplateDetail.confirm_delete'))) return
  try {
    await api.deletePlanTemplate(parseInt(route.params.id as string))
    router.push('/plan-templates')
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function addItem(type: string) {
  const id = parseInt(route.params.id as string)
  const titles: Record<string, string> = {
    song: t('planTemplateDetail.types.song'),
    header: t('planTemplateDetail.types.new_header'),
    announcement: t('planTemplateDetail.types.announcement'),
    media: t('planTemplateDetail.types.media'),
  }
  try {
    const item = await api.createPlanTemplateItem(id, {
      type,
      title: titles[type] || t('planTemplateDetail.types.new_item'),
      position: items.value.length + 1,
    })
    items.value.push(item)
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function updateItem(item: any) {
  try {
    await api.updatePlanTemplateItem(item.id, {
      type: item.type,
      title: item.title,
      arrangement_id: item.arrangement_id || null,
    })
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function deleteItem(item: any) {
  if (!await confirmDialog(t('planTemplateDetail.confirm_item_delete'))) return
  try {
    await api.deletePlanTemplateItem(item.id)
    items.value = items.value.filter((i: any) => i.id !== item.id)
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function moveItem(idx: number, dir: number) {
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= items.value.length) return
  const a = items.value[idx]
  const b = items.value[newIdx]
  items.value[idx] = b
  items.value[newIdx] = a
  try {
    await Promise.all([
      api.updatePlanTemplateItem(a.id, { position: newIdx + 1 }),
      api.updatePlanTemplateItem(b.id, { position: idx + 1 }),
    ])
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

async function applyTemplate() {
  const id = parseInt(route.params.id as string)
  try {
    const plan = await api.applyPlanTemplate({ template_id: id,
      date: applyForm.value.date,
      time: applyForm.value.time || undefined,
      theme: applyForm.value.theme || undefined,
    })
    showApply.value = false
    useToast().show(t('planTemplateDetail.plan_created'), 'success')
    router.push(`/plans/${plan.id}`)
  } catch (e: any) {
    useToast().show(e.message || 'Error', 'error')
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('planTemplates.title') }}</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('planTemplates.new') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('planTemplates.loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="tpl in templates" :key="tpl.id"
        @click="$router.push(`/plan-templates/${tpl.id}`)"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">{{ tpl.name }}</h3>
            <p v-if="tpl.description" class="text-sm text-gray-500">{{ tpl.description }}</p>
          </div>
          <div class="text-sm text-gray-500">
            {{ tpl.item_count || 0 }} {{ $t('planTemplates.items') }}
          </div>
        </div>
      </div>

      <div v-if="templates.length === 0" class="text-center py-12 text-gray-400">
        {{ $t('planTemplates.not_found') }}
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">{{ $t('planTemplates.create_title') }}</h3>
        <form @submit.prevent="createTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplates.name') }}</label>
            <input v-model="form.name" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplates.description') }}</label>
            <textarea v-model="form.description" rows="2"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('planTemplates.service_type') }}</label>
            <select v-model="form.service_type_id"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option :value="null">{{ $t('planTemplates.all') }}</option>
              <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('planTemplates.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('planTemplates.create') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const templates = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({ name: '', description: '', service_type_id: null as number | null })

async function load() {
  try {
    const [tpls, sts] = await Promise.all([
      api.getPlanTemplates(),
      api.getServiceTypes(),
    ])
    templates.value = tpls
    serviceTypes.value = sts
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function createTemplate() {
  await api.createPlanTemplate({
    name: form.value.name,
    description: form.value.description || undefined,
    service_type_id: form.value.service_type_id || undefined,
  })
  showForm.value = false
  form.value = { name: '', description: '', service_type_id: null }
  load()
}

onMounted(load)
</script>

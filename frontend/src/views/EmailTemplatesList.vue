<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('emailTemplates.title') }}</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('emailTemplates.new') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{ $t('emailTemplates.loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="tpl in templates" :key="tpl.id"
        @click="goToTemplate(tpl.id)"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ tpl.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tpl.subject }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {{ tpl.usage_count || 0 }} {{ $t('emailTemplates.usages') }}
            </p>
          </div>
          <div class="flex gap-2">
            <button @click.stop="sendTest(tpl.id)" 
              class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              {{ $t('emailTemplates.test') }}
            </button>
            <button @click.stop="deleteTemplate(tpl.id)"
              class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
              {{ $t('emailTemplates.delete') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="templates.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
        {{ $t('emailTemplates.not_found') }}
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
        <h3 class="text-lg font-bold mb-4">{{ $t('emailTemplates.create_title') }}</h3>
        <form @submit.prevent="createTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('emailTemplates.name') }}</label>
            <input v-model="form.name" required :placeholder="$t('emailTemplates.name_placeholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('emailTemplates.subject') }}</label>
            <input v-model="form.subject" required :placeholder="$t('emailTemplates.subject_placeholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('emailTemplates.body') }}</label>
            <textarea v-model="form.body" required rows="8" :placeholder="$t('emailTemplates.body_placeholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('emailTemplates.variables') }}</label>
            <input v-model="form.variables" :placeholder="$t('emailTemplates.variables_placeholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ $t('emailTemplates.variables_hint') }}</p>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('emailTemplates.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ $t('emailTemplates.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'
import { confirmDialog } from '../stores/confirm'

const { t } = useI18n()

const router = useRouter()
const templates = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({ name: '', subject: '', body: '', variables: '' })

const loadData = async () => {
  try {
    templates.value = await api.getEmailTemplates()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const createTemplate = async () => {
  if (!form.value.name || !form.value.subject || !form.value.body) return
  try {
    await api.createEmailTemplate({
      name: form.value.name,
      subject: form.value.subject,
      body: form.value.body,
      variables: form.value.variables ? form.value.variables.split(',').map((v: string) => v.trim()).join(',') : undefined
    })
    showForm.value = false
    form.value = { name: '', subject: '', body: '', variables: '' }
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const goToTemplate = (id: number) => {
  router.push({ name: 'email-compose' })
}

const deleteTemplate = async (id: number) => {
  if (!await confirmDialog(t('emailTemplates.confirm_delete'))) return
  try {
    await api.deleteEmailTemplate(id)
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const sendTest = async (id: number) => {
  const template = templates.value.find((tpl) => tpl.id === id)
  if (!template) return showToast(t('emailTemplates.not_found_toast'), 'error')
  const email = prompt(t('emailTemplates.test_prompt'), '')
  if (!email) return
  try {
    await api.sendEmail({
      recipient_email: email,
      subject: template.subject,
      body: template.body,
      template_id: id,
    })
    showToast(t('emailTemplates.test_sent'), 'success')
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

onMounted(loadData)
</script>

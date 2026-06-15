<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{$t('webhook.title')}}</h1>
      <button @click="showForm = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{$t('webhook.add')}}
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button @click="tab = 'configs'" class="px-3 py-1.5 rounded-lg text-sm" :class="tab === 'configs' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700'">{{$t('webhook.tabs.configs')}}</button>
      <button @click="tab = 'logs'" class="px-3 py-1.5 rounded-lg text-sm" :class="tab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700'">{{$t('webhook.tabs.logs')}}</button>
    </div>

    <!-- Configs tab -->
    <div v-if="tab === 'configs'">
      <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{$t('webhook.loading')}}</div>
      <div v-else-if="webhooks.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500 dark:text-gray-400">{{$t('webhook.empty')}}</div>
      <div v-else class="space-y-3">
        <div v-for="wh in webhooks" :key="wh.id"
          class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
<div class="font-medium text-gray-800 dark:text-gray-100">{{ wh.label || wh.url }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ wh.url }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{$t('webhook.events')}}: {{ wh.events }}</div>
            </div>
            <button @click="deleteWebhook(wh.id)" class="text-red-400 hover:text-red-600 text-sm cursor-pointer">{{$t('webhook.delete')}}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Logs tab -->
    <div v-if="tab === 'logs'">
      <div v-if="logsLoading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{$t('webhook.loading')}}</div>
      <div v-else class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{{$t('webhooklog.date')}}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{{$t('webhooklog.event')}}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{{$t('webhooklog.status')}}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400">{{$t('webhooklog.response')}}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-4 py-2 text-gray-600 text-xs">{{ formatDate(log.created_at) }}</td>
              <td class="px-4 py-2 font-mono text-xs">{{ log.event }}</td>
              <td class="px-4 py-2"><span class="font-mono" :class="log.status >= 200 && log.status < 300 ? 'text-green-600' : 'text-red-600'">{{ log.status }}</span></td>
              <td class="px-4 py-2 text-xs text-gray-500 truncate max-w-xs">{{ log.response || '-' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <!-- Create form modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{{$t('webhook.new_label')}}</h3>
        <form @submit.prevent="create" class="space-y-4">
          <div>
<label class="block text-sm font-medium mb-1">{{$t('webhook.url')}}</label>
              <input v-model="form.url" type="url" required class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
<label class="block text-sm font-medium mb-1">{{$t('webhook.events')}}</label>
              <input v-model="form.events" :placeholder="$t('webhook.events_placeholder')" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{$t('webhook.any_event')}}</p>
          </div>
          <div>
<label class="block text-sm font-medium mb-1">{{$t('webhook.label')}}</label>
              <input v-model="form.label" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
<label class="block text-sm font-medium mb-1">{{$t('webhook.secret')}}</label>
              <input v-model="form.secret" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div class="flex gap-3 justify-end pt-2">
<button type="button" @click="showForm = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{{$t('webhook.cancel')}}</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{$t('webhook.create')}}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, getApiBase } from '../utils/api'
import { showToast } from '../stores/toast'

const tab = ref('configs')
const webhooks = ref<any[]>([])
const logs = ref<any[]>([])
const loading = ref(true)
const logsLoading = ref(false)
const showForm = ref(false)
const form = ref({ url: '', events: '*', label: '', secret: '' })

import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
const formatDate = (d: string) => d ? new Date(d).toLocaleString(locale.value || 'fr-FR') : ''

const loadWebhooks = async () => {
  try { const r = await api.getWebhooks(); webhooks.value = r.data ?? r; }
  catch (e) { console.warn('WebhooksView: failed to load webhooks', e) }
  finally { loading.value = false }
}

const loadLogs = async () => {
  if (tab.value !== 'logs') return
  logsLoading.value = true
  try {
    const base = getApiBase()
    const res = await fetch(`${base}/webhook-logs`)
    const data = await res.json()
    logs.value = data.rows || []
  } catch (e) { console.warn('WebhooksView: failed to load webhook logs', e) }
  finally { logsLoading.value = false }
}

const { t } = useI18n()
const create = async () => {
  try {
    await api.createWebhook({
      url: form.value.url,
      events: form.value.events.split(',').map((e: string) => e.trim()).filter(Boolean),
      label: form.value.label || undefined,
      secret: form.value.secret || undefined,
    })
    showForm.value = false
    form.value = { url: '', events: '*', label: '', secret: '' }
    showToast(t('webhook.created'))
    await loadWebhooks()
  } catch (e: any) { showToast(e.message, 'error') }
}

const deleteWebhook = async (id: number) => {
  try {
    await api.deleteWebhook(id)
    webhooks.value = webhooks.value.filter((w: any) => w.id !== id)
    showToast(t('webhook.deleted'))
  } catch (e: any) { showToast(e.message, 'error') }
}

onMounted(loadWebhooks)
</script>

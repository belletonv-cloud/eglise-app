<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('logs.title') }}</h1>
      <button @click="clearLogs" class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
        {{ $t('logs.clean') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>

    <div v-else>
      <div class="flex gap-2 mb-4">
        <select v-model="statusFilter" @change="loadLogs" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <option value="">{{ $t('logs.all_statuses') }}</option>
          <option value="4">{{ $t('logs.client_errors') }}</option>
          <option value="5">{{ $t('logs.server_errors') }}</option>
          <option value="2">{{ $t('logs.success') }}</option>
        </select>
        <select v-model="slowFilter" @change="loadLogs" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <option value="0">{{ $t('logs.all_durations') }}</option>
          <option value="2000">{{ $t('logs.slow') }}</option>
          <option value="5000">{{ $t('logs.very_slow') }}</option>
        </select>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.date') }}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.method') }}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.path') }}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.status') }}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.duration') }}</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('logs.error') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs">{{ formatDate(log.created_at) }}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs font-mono font-medium"
                  :class="log.method === 'GET' ? 'bg-green-100 text-green-700' : log.method === 'POST' ? 'bg-blue-100 text-blue-700' : log.method === 'PUT' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'">
                  {{ log.method }}
                </span>
              </td>
              <td class="px-4 py-2 text-gray-800 dark:text-gray-200 font-mono text-xs">{{ log.path }}</td>
              <td class="px-4 py-2">
                <span class="font-mono" :class="log.status >= 500 ? 'text-red-600' : log.status >= 400 ? 'text-amber-600' : 'text-green-600'">{{ log.status }}</span>
              </td>
              <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ log.duration }}ms</td>
              <td class="px-4 py-2 text-red-600 text-xs max-w-xs truncate">{{ log.error || '-' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div v-if="logs.length === 0" class="text-center py-8 text-gray-400">{{ $t('logs.no_logs') }}</div>
      </div>

      <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>{{ total }} {{ $t('logs.entries') }}</span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="page <= 1" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 cursor-pointer">←</button>
          <span class="px-3 py-1">{{ page }}</span>
          <button @click="nextPage" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 cursor-pointer">→</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { showToast } from '../stores/toast'
import { user } from '../stores/auth'
import { getApiBase } from '../utils/api'

const { t, locale } = useI18n()

const logs = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const statusFilter = ref('')
const slowFilter = ref('0')

const formatDate = (d: string) => d ? new Date(d).toLocaleString(locale.value === 'fr' ? 'fr-FR' : 'en-US') : ''

const loadLogs = async () => {
  loading.value = true
  try {
    const data = await getLogs()
    logs.value = data.rows
    total.value = data.total
  } catch { /* ignore */ }
  finally { loading.value = false }
}

const authHeaders = () => {
  const headers: Record<string, string> = {}
  if (user.value && user.value.email) headers['x-user-email'] = user.value.email
  return headers
}

const getLogs = async () => {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  const url = `${getApiBase()}/logs?${params}`
  const res = await fetch(url, { headers: authHeaders() })
  return res.json()
}

const clearLogs = async () => {
  try {
    await fetch(`${getApiBase()}/logs`, { method: 'DELETE', headers: authHeaders() })
    showToast(t('logs.cleaned'))
    await loadLogs()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const prevPage = () => { if (page.value > 1) { page.value--; loadLogs() } }
const nextPage = () => { page.value++; loadLogs() }

onMounted(loadLogs)
</script>

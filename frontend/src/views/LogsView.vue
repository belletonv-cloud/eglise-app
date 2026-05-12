<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Logs API</h1>
      <button @click="clearLogs" class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
        Nettoyer (garder 7j)
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>

    <div v-else>
      <div class="flex gap-2 mb-4">
        <select v-model="statusFilter" @change="loadLogs" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <option value="">Tous les statuts</option>
          <option value="4">4xx (Erreurs client)</option>
          <option value="5">5xx (Erreurs serveur)</option>
          <option value="2">2xx (Succès)</option>
        </select>
        <select v-model="slowFilter" @change="loadLogs" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <option value="0">Toutes durées</option>
          <option value="2000">Lents (>2s)</option>
          <option value="5000">Très lents (>5s)</option>
        </select>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Date</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Méthode</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Path</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Statut</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Durée</th>
              <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Erreur</th>
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
        <div v-if="logs.length === 0" class="text-center py-8 text-gray-400">Aucun log.</div>
      </div>

      <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>{{ total }} entrées</span>
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
import { showToast } from '../stores/toast'

const logs = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const statusFilter = ref('')
const slowFilter = ref('0')

const formatDate = (d: string) => d ? new Date(d).toLocaleString('fr-FR') : ''

const loadLogs = async () => {
  loading.value = true
  try {
    const data = await getLogs()
    logs.value = data.rows
    total.value = data.total
  } catch { /* ignore */ }
  finally { loading.value = false }
}

const getLogs = async () => {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  const base = (import.meta as any).env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
  const headers: Record<string, string> = {}
  const { user } = await import('../stores/auth')
  if (user.value && user.value.email) headers['x-user-email'] = user.value.email
  const res = await fetch(`${base}/logs?${params}`, { headers })
  return res.json()
}

const clearLogs = async () => {
  try {
    const base = (import.meta as any).env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    const headers: Record<string, string> = {}
    const { user } = await import('../stores/auth')
    if (user.value && user.value.email) headers['x-user-email'] = user.value.email
    await fetch(`${base}/logs`, { method: 'DELETE', headers })
    showToast('Logs nettoyés')
    await loadLogs()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const prevPage = () => { if (page.value > 1) { page.value--; loadLogs() } }
const nextPage = () => { page.value++; loadLogs() }

onMounted(loadLogs)
</script>

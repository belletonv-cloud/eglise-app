<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('pcoSync.title') }}</h1>
      <button @click="sync" :disabled="syncing"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
        {{ syncing ? $t('pcoSync.syncing') : $t('pcoSync.sync') }}
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">🔄</span>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('pcoSync.last_sync') }}</p>
          <p class="font-medium text-gray-800 dark:text-gray-100">{{ lastSync || $t('pcoSync.never') }}</p>
        </div>
      </div>

      <div v-if="syncResult" class="mt-4 p-4 rounded-lg"
        :class="syncResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">{{ syncResult.success ? '✅' : '⚠️' }}</span>
          <span class="font-medium">{{ syncResult.success ? $t('pcoSync.synced') : $t('pcoSync.error') }}</span>
        </div>

        <div v-if="syncResult.results" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.service_types ?? 0 }}</div>
            <div class="text-xs opacity-75">Types</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.plans ?? 0 }}</div>
            <div class="text-xs opacity-75">Plans</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.plan_items ?? 0 }}</div>
            <div class="text-xs opacity-75">Items</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.people ?? 0 }}</div>
            <div class="text-xs opacity-75">Bénévoles</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.songs ?? 0 }}</div>
            <div class="text-xs opacity-75">Chants</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.arrangements ?? 0 }}</div>
            <div class="text-xs opacity-75">Arrangements</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.deleted ?? 0 }}</div>
            <div class="text-xs opacity-75">Supprimés</div>
          </div>
          <div class="bg-black/10 dark:bg-white/10 rounded-lg p-2 text-center">
            <div class="text-lg font-bold">{{ syncResult.results.errors?.length ?? 0 }}</div>
            <div class="text-xs opacity-75">Erreurs</div>
          </div>
        </div>

        <div v-if="syncResult.results?.errors?.length" class="mt-3">
          <details class="text-xs">
            <summary class="cursor-pointer font-medium">Détail des erreurs ({{ syncResult.results.errors.length }})</summary>
            <ul class="mt-1 space-y-0.5 list-disc list-inside">
              <li v-for="(err, i) in syncResult.results.errors" :key="i">{{ err }}</li>
            </ul>
          </details>
        </div>
      </div>

      <div class="mt-6 space-y-3">
        <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('pcoSync.what_sync') }}</h3>
        <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• {{ $t('pcoSync.plans') }}</li>
          <li>• {{ $t('pcoSync.assignments') }}</li>
          <li>• {{ $t('pcoSync.songs') }}</li>
          <li>• Ordre du culte (items / chants)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t } = useI18n()

const syncing = ref(false)
const syncResult = ref<any>(null)
const lastSync = ref<string | null>(null)

const sync = async () => {
  syncing.value = true
  syncResult.value = null
  try {
    const result = await api.syncPCO()
    syncResult.value = { success: true, results: result.results }
    showToast(t('pcoSync.synced'))
    lastSync.value = new Date().toLocaleString()
    localStorage.setItem('pco_last_sync', lastSync.value)
  } catch (e: any) {
    let data = { results: null }
    try { data = JSON.parse(e.message) } catch {}
    syncResult.value = { success: false, results: data.results, message: e.message }
    showToast(t('pcoSync.error'), 'error')
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  const stored = localStorage.getItem('pco_last_sync')
  if (stored) lastSync.value = stored
})
</script>

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

      <div v-if="syncResult" class="mt-4 p-4 rounded-lg" :class="syncResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'">
        <p class="font-medium">{{ syncResult.success ? $t('pcoSync.synced') : $t('pcoSync.error') }}</p>
        <pre class="text-xs mt-2 whitespace-pre-wrap overflow-auto max-h-60">{{ syncResult.message }}</pre>
      </div>

      <div class="mt-6 space-y-3">
        <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('pcoSync.what_sync') }}</h3>
        <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• {{ $t('pcoSync.plans') }}</li>
          <li>• {{ $t('pcoSync.assignments') }}</li>
          <li>• {{ $t('pcoSync.songs') }}</li>
          <li>• {{ $t('menu.services') }}</li>
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
    syncResult.value = { success: true, message: JSON.stringify(result, null, 2) }
    showToast(t('pcoSync.synced'))
    lastSync.value = new Date().toLocaleString()
  } catch (e: any) {
    syncResult.value = { success: false, message: e.message }
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

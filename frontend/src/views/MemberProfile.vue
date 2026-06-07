<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ $t('memberProfile.loading') }}</div>
    <div v-else-if="!member" class="text-center py-12 text-gray-400 dark:text-gray-500">{{ $t('memberProfile.not_found') }}</div>
    <div v-else class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
      <div class="text-center mb-6">
        <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl text-blue-600 dark:text-blue-400 font-bold">{{ member.first_name?.[0] }}{{ member.last_name?.[0] }}</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ member.first_name }} {{ member.last_name }}</h1>
        <p v-if="member.email" class="text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ member.email }}</p>
        <p v-if="member.phone" class="text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ member.phone }}</p>
      </div>

      <div v-if="member.teams?.length" class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ $t('memberProfile.teams') }}</h3>
        <div class="space-y-1">
          <div v-for="t in member.teams" :key="t.id" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
            <span>🎪</span> {{ t.name }} <span v-if="t.position" class="text-gray-400 dark:text-gray-500">({{ t.position }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'

const route = useRoute()
const member = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (!id) { loading.value = false; return }
  try {
    member.value = await api.getMember(id)
  } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

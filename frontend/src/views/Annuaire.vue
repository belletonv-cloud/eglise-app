<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{{ $t('directory.title') }}</h1>

    <div class="mb-4">
      <input v-model="search" :placeholder="$t('directory.search')"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" />
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ $t('directory.loading') }}</div>

    <div v-else-if="members.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">{{ $t('directory.not_found') }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="m in filtered" :key="m.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="font-semibold text-gray-800 dark:text-gray-100">{{ m.first_name }} {{ m.last_name }}</div>
        <div v-if="m.email" class="text-sm text-gray-500 mt-1">
          <a :href="`mailto:${m.email}`" class="hover:text-blue-600">{{ m.email }}</a>
        </div>
        <div v-if="m.phone" class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          <a :href="`tel:${m.phone}`" class="hover:text-blue-600">{{ m.phone }}</a>
        </div>
        <div v-if="m.team_names" class="text-xs text-gray-400 mt-1">{{ m.team_names }}</div>
      </div>
    </div>

    <p v-if="members.length > 0" class="text-center text-sm text-gray-400 mt-4">{{ $t('directory.count', { count: members.length }) }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'

const members = ref<any[]>([])
const loading = ref(true)
const search = ref('')

const filtered = computed(() => {
  if (!search.value) return members.value
  const q = search.value.toLowerCase()
  return members.value.filter(m =>
    (m.first_name + ' ' + m.last_name).toLowerCase().includes(q) ||
    m.email?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    members.value = await api.getDirectory()
  } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

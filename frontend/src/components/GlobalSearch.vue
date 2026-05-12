<template>
  <div class="relative">
    <div class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <span class="text-gray-400">🔍</span>
      <input v-model="query" @input="search" @keydown.escape="close" @keydown.enter="goFirst"
        placeholder="Rechercher..."
        class="bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 w-full placeholder-gray-400" />
    </div>
    <div v-if="query.length >= 2 && results.length" class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">
      <div v-for="r in results" :key="r.type + r.id"
        @click="navigate(r)"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span class="text-lg">{{ iconFor(r) }}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ labelFor(r) }}</div>
          <div class="text-xs text-gray-400">{{ detailFor(r) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, getApiBase } from '../utils/api'

const router = useRouter()
const query = ref('')
const results = ref<any[]>([])
let timeout: any = null

const search = () => {
  clearTimeout(timeout)
  if (query.value.length < 2) { results.value = []; return }
  timeout = setTimeout(async () => {
    try {
      const base = getApiBase()
      const res = await fetch(`${base}/search?q=${encodeURIComponent(query.value)}`)
      const data = await res.json()
      results.value = data.results || []
    } catch { results.value = [] }
  }, 300)
}

const iconFor = (type: string) => {
  const icons: Record<string, string> = { member: '👤', song: '🎵', plan: '📅', team: '🎪', announcement: '📢' }
  return icons[type] || '📌'
}

const labelFor = (r: any) => {
  if (r.type === 'member') return `${r.first_name} ${r.last_name}`
  if (r.type === 'song') return r.title
  if (r.type === 'plan') return `${r.service_type || 'Service'} — ${r.date}`
  if (r.type === 'team') return r.name
  if (r.type === 'announcement') return r.content?.slice(0, 80)
  return ''
}

const detailFor = (r: any) => {
  if (r.type === 'member') return r.email || r.phone || ''
  if (r.type === 'song') return r.author || ''
  if (r.type === 'plan') return r.theme || r.notes || ''
  if (r.type === 'team') return r.description || ''
  if (r.type === 'announcement') return r.type === 'prayer' ? '🙏 Prière' : '📢 Annonce'
  return ''
}

const navigate = (r: any) => {
  results.value = []
  query.value = ''
  if (r.type === 'member') router.push(`/members/${r.id}`)
  else if (r.type === 'song') router.push(`/song/${r.id}`)
  else if (r.type === 'plan') router.push(`/plans/${r.id}`)
  else if (r.type === 'team') router.push(`/teams/${r.id}`)
  else if (r.type === 'announcement') router.push('/annonces')
}

const goFirst = () => { if (results.value.length) navigate(results.value[0]) }
const close = () => { results.value = []; query.value = '' }
</script>

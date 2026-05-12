<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Annonces & Prières</h1>
      <button @click="showForm = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        + Nouvelle
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button @click="filter = 'all'" class="px-3 py-1.5 rounded-lg text-sm" :class="filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">Tout</button>
      <button @click="filter = 'announcement'" class="px-3 py-1.5 rounded-lg text-sm" :class="filter === 'announcement' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">Annonces</button>
      <button @click="filter = 'prayer'" class="px-3 py-1.5 rounded-lg text-sm" :class="filter === 'prayer' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">Prières</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>

    <div v-else class="space-y-3">
      <div v-for="a in filtered" :key="a.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-sm text-gray-500 mb-1">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="a.type === 'prayer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                {{ a.type === 'prayer' ? '🙏 Prière' : '📢 Annonce' }}
              </span>
            </div>
            <p class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{{ a.content }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ a.author_first }} {{ a.author_last }} · {{ formatDate(a.created_at) }}</p>
          </div>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="text-center py-12 text-gray-400">Rien pour le moment.</div>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Nouvelle publication</h3>
        <form @submit.prevent="create" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select v-model="newItem.type" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <option value="announcement">📢 Annonce</option>
              <option value="prayer">🙏 Point de prière</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu</label>
            <textarea v-model="newItem.content" rows="5" required class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">Publier</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const items = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const filter = ref('all')
const newItem = ref({ type: 'announcement', content: '' })

const filtered = computed(() => {
  if (filter.value === 'all') return items.value
  return items.value.filter(i => i.type === filter.value)
})

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : ''

const create = async () => {
  try {
    await api.createAnnouncement(newItem.value)
    showForm.value = false
    newItem.value = { type: 'announcement', content: '' }
    showToast('Publié')
    await load()
  } catch (e: any) { showToast(e.message, 'error') }
}

const load = async () => {
  try { items.value = await api.getAnnouncements() }
  catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(load)
</script>

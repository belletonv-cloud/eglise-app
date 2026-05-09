<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Tableau de bord</h1>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-blue-600">{{ stats.members }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Membres</div>
        <div class="text-xs text-gray-400">{{ stats.activeMembers }} actifs</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-green-600">{{ stats.upcomingPlans }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Services à venir</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-indigo-600">{{ stats.songsWithArrangements }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Chants avec grilles</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-amber-600">{{ stats.pendingConfirmations }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Confirmations en attente</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-purple-600">{{ stats.teams }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Équipes</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link to="/" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">📅 Services</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Planifier et gérer les services</p>
      </router-link>
      <router-link to="/members" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">👥 Membres</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérer les membres et leurs équipes</p>
      </router-link>
      <router-link to="/songs" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">🎵 Chants</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Consulter et transposer les chants</p>
      </router-link>
      <router-link to="/checkin" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">✅ Check-in</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pointer les présences</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const stats = ref({
  members: 0, activeMembers: 0, upcomingPlans: 0,
  songsWithArrangements: 0, pendingConfirmations: 0, teams: 0,
})
const loading = ref(true)

onMounted(async () => {
  try {
    stats.value = await api.getStats()
  } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

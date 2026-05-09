<template>
  <div id="app" :class="{ dark: isDark }">
    <Login v-if="!isAuthenticated" />
    <div v-else class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Église App</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
        </div>
        <nav class="flex-1 p-2 space-y-1">
          <router-link to="/mon-compte" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>👤</span> Mon compte
          </router-link>
          <router-link to="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> Dashboard
          </router-link>
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📅</span> Services
          </router-link>
          <router-link to="/plan-templates" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> Templates
          </router-link>
          <router-link to="/members" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>👥</span> Membres
          </router-link>
          <router-link to="/teams" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎪</span> Équipes
          </router-link>
          <router-link to="/songs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎵</span> Chants
          </router-link>
          <router-link to="/checkin" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>✅</span> Check-in
          </router-link>
          <router-link to="/house-groups" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🏠</span> Groupes
          </router-link>
          <router-link to="/email" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📧</span> Emails
          </router-link>
          <router-link to="/conflicts" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>⚠️</span> Conflits
          </router-link>
        </nav>
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button @click="toggleDarkMode" class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            {{ isDark ? '☀️ Mode clair' : '🌙 Mode sombre' }}
          </button>
          <button @click="logout" class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer">
            Déconnexion
          </button>
        </div>
      </aside>
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
    <Toasts />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Login from './components/Login.vue';
import { user, isAuthenticated, logout } from './stores/auth';
import Toasts from './components/Toasts.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';

const isDark = ref(localStorage.getItem('dark-mode') === 'true')
if (isDark.value) document.documentElement.classList.add('dark')
function toggleDarkMode() {
  isDark.value = !isDark.value
  localStorage.setItem('dark-mode', String(isDark.value))
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

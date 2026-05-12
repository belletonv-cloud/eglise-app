<template>
  <div id="app" :class="{ dark: isDark }">
    <Login v-if="!isAuthenticated" />
    <div v-else class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out"
        :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Église App</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
          </div>
          <button @click="mobileSidebarOpen = false" class="lg:hidden p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
          <div class="px-1 pb-2">
            <GlobalSearch />
          </div>
          <router-link to="/mon-compte" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>👤</span> Mon compte
          </router-link>
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> Dashboard
          </router-link>
          <router-link to="/calendar" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📅</span> Calendrier
          </router-link>
          <router-link to="/plans" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> Services
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
          <router-link to="/historique" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📜</span> Historique
          </router-link>
           <router-link to="/email" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>📧</span> Emails
           </router-link>
          <router-link to="/sondages" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> Sondages
          </router-link>
          <router-link to="/annonces" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📢</span> Annonces
          </router-link>
          <router-link to="/webhooks" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🔗</span> Webhooks
          </router-link>
          <router-link to="/conflicts" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>⚠️</span> Conflits
          </router-link>
           <router-link to="/logs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>📋</span> Logs
           </router-link>
           <router-link to="/annuaire" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>📖</span> Annuaire
           </router-link>
        </nav>
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button @click="toggleDarkMode" class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            {{ isDark ? '☀️ Mode clair' : '🌙 Mode sombre' }}
          </button>
          <button @click="toggleLang" class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            {{ lang === 'fr' ? '🇬🇧 English' : '🇫🇷 Français' }}
          </button>
          <button @click="logout" class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer">
            Déconnexion
          </button>
        </div>
      </aside>

      <div v-if="mobileSidebarOpen" @click="mobileSidebarOpen = false" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>

      <main class="flex-1 overflow-auto flex flex-col">
        <div class="lg:hidden flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button @click="mobileSidebarOpen = true" class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Église App</h1>
          <div class="w-6"></div>
        </div>
        <div v-if="!online" class="bg-amber-500 text-white text-center py-1 text-sm font-medium">
          📡 Mode hors-ligne — les données seront synchronisées automatiquement
        </div>
        <div class="flex-1 overflow-auto p-4 lg:p-6">
          <router-view />
        </div>
      </main>
    </div>
    <Toasts />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Login from './components/Login.vue';
import { user, isAuthenticated, logout } from './stores/auth';
import { api } from './utils/api';
import Toasts from './components/Toasts.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import GlobalSearch from './components/GlobalSearch.vue'

const { locale } = useI18n()
const lang = ref(locale.value)
const toggleLang = () => {
  const newLang = lang.value === 'fr' ? 'en' : 'fr'
  lang.value = newLang
  locale.value = newLang
  localStorage.setItem('locale', newLang)
}

const mobileSidebarOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { mobileSidebarOpen.value = false })

const isDark = ref(localStorage.getItem('dark-mode') === 'true')
if (isDark.value) document.documentElement.classList.add('dark')
function toggleDarkMode() {
  isDark.value = !isDark.value
  localStorage.setItem('dark-mode', String(isDark.value))
  document.documentElement.classList.toggle('dark', isDark.value)
}

const online = ref(navigator.onLine)
window.addEventListener('online', () => { online.value = true })
window.addEventListener('offline', () => { online.value = false })

onMounted(async () => {
  if (!isAuthenticated.value) return
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return

  const permission = await Notification.requestPermission().catch(() => 'denied')
  if (permission !== 'granted') return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('SW registered for push')
  } catch (e) {
    console.warn('SW registration failed', e)
  }
})
</script>

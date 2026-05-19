<template>
  <div id="app" :class="{ dark: isDark }">
    <Login v-if="!isAuthenticated && !isDemoMode" />
    <div v-else class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out"
        :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ $t('app.title') }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ isDemoMode ? '🎸 Mode Démo' : (user?.email || '') }}</p>
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
            <span>👤</span> {{$t('menu.account')}}
          </router-link>
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> {{$t('menu.dashboard')}}
          </router-link>
          <router-link to="/calendar" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📅</span> {{$t('menu.calendar')}}
          </router-link>
          <router-link to="/plans" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> {{$t('menu.services')}}
          </router-link>
          <router-link to="/plan-templates" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> {{$t('menu.templates')}}
          </router-link>
          <router-link to="/members" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>👥</span> {{$t('menu.members')}}
          </router-link>
          <router-link to="/teams" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎪</span> {{$t('menu.teams')}}
          </router-link>
          <router-link to="/songs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎵</span> {{$t('menu.songs')}}
          </router-link>
          <router-link to="/interactive" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🌟</span> {{$t('menu.interactive_home')}}
          </router-link>
          <router-link to="/checkin" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>✅</span> {{$t('menu.checkin')}}
          </router-link>
          <router-link to="/house-groups" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🏠</span> {{$t('menu.groups')}}
          </router-link>
          <router-link to="/historique" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📜</span> {{$t('menu.history')}}
          </router-link>
           <router-link to="/email" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>📧</span> {{$t('menu.emails')}}
           </router-link>
          <router-link to="/sondages" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> {{$t('menu.polls')}}
          </router-link>
          <router-link to="/annonces" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📢</span> {{$t('menu.announcements')}}
          </router-link>
          <router-link to="/webhooks" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🔗</span> {{$t('menu.webhooks')}}
          </router-link>
          <router-link to="/conflicts" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>⚠️</span> {{$t('menu.conflicts')}}
          </router-link>
           <router-link to="/logs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
             <span>📋</span> {{$t('menu.logs')}}
           </router-link>
           <router-link to="/annuaire" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              <span>📖</span> {{$t('menu.directory')}}
            </router-link>
           <router-link to="/events" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              <span>📅</span> {{$t('menu.events')}}
            </router-link>
           <router-link to="/youtube" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              <span>▶️</span> {{$t('menu.youtube')}}
            </router-link>
           <router-link to="/pco-sync" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              <span>🔄</span> {{$t('menu.pco_sync')}}
            </router-link>
<router-link to="/music-stand" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
               <span>🎵</span> {{$t('menu.music_stand')}}
             </router-link>
        </nav>
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button @click="toggleDarkMode" class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            {{ isDark ? $t('app.light_mode') : $t('app.dark_mode') }}
          </button>
          <button @click="toggleLang" class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            {{ lang === 'fr' ? $t('app.lang_en') : $t('app.lang_fr') }}
          </button>
          <button v-if="isDemoMode" @click="disableDemoMode" class="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer">
            Quitter l'accueil interactif
          </button>
          <button v-else @click="logout" class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer">
            {{$t('app.logout')}}
          </button>
        </div>
      </aside>

      <div v-if="mobileSidebarOpen" @click="mobileSidebarOpen = false" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>

      <main class="flex-1 overflow-auto flex flex-col">
        <div class="lg:hidden flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button @click="mobileSidebarOpen = true" class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{$t('app.headline')}}</h1>
          <div class="w-6"></div>
        </div>
        <div v-if="!online" class="bg-amber-500 text-white text-center py-1 text-sm font-medium">
          {{$t('app.offline_mode')}}
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
import { isDemoMode, demoUser, initDemoMode, disableDemoMode } from './stores/demo';
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
  initDemoMode()
  if (!isAuthenticated.value && !isDemoMode.value) return
  if (!('Notification' in window)) return

  const permission = await Notification.requestPermission().catch(() => 'denied')
  if (permission !== 'granted') return

  // Service worker is registered by api.ts registerForPush() — avoid duplicate registration
})
</script>

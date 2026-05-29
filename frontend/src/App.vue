<template>
  <div id="app" :class="{ dark: isDark }">

    <div v-if="!isAuthenticated" class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <router-view />
    </div>

    <div v-else-if="memberLoading" class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    </div>

    <div v-else class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out"
        :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="min-w-0">
            <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ $t('app.title') }}</h1>
             <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ user?.email || '' }}</p>
          </div>
          <div class="flex items-center gap-1 ml-2 shrink-0">
            <button @click="toggleDarkMode" class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" :title="isDark ? $t('app.light_mode') : $t('app.dark_mode')">
              <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            </button>
            <button @click="toggleLang" class="p-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" :title="lang === 'fr' ? 'English' : 'Français'">
              {{ lang === 'fr' ? 'EN' : 'FR' }}
            </button>
            <div class="relative demo-persona-selector" v-if="isDemoMode">
              <button @click="demoPersonaMenuOpen = !demoPersonaMenuOpen" class="p-1.5 rounded-lg text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 cursor-pointer" title="Changer de persona">
                🎭
              </button>
              <div v-if="demoPersonaMenuOpen" class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                <button v-for="(persona, key) in demoPersonas" :key="key" @click="switchDemoPersona(key)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <span class="font-medium">{{ persona.label }}</span>
                  <span class="text-gray-400 text-xs">{{ persona.email }}</span>
                </button>
              </div>
            </div>
            <button @click="mobileSidebarOpen = false" class="lg:hidden p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <div class="px-1 pb-2">
            <GlobalSearch />
          </div>
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> {{$t('menu.dashboard')}}
          </router-link>
          <div class="pt-2 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{$t('menu.section_planning')}}</p>
          </div>
          <router-link to="/calendar" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📅</span> {{$t('menu.calendar')}}
          </router-link>
          <router-link to="/plans" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> {{$t('menu.services')}}
          </router-link>
          <router-link to="/plan-templates" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📄</span> {{$t('menu.templates')}}
          </router-link>
          <router-link to="/checkin" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>✅</span> {{$t('menu.checkin')}}
          </router-link>
          <router-link to="/historique" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📜</span> {{$t('menu.history')}}
          </router-link>
          <div class="pt-2 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{$t('menu.section_people')}}</p>
          </div>
          <router-link to="/members" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>👥</span> {{$t('menu.members')}}
          </router-link>
          <router-link to="/teams" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎪</span> {{$t('menu.teams')}}
          </router-link>
          <router-link to="/annuaire" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📖</span> {{$t('menu.directory')}}
          </router-link>
          <router-link to="/house-groups" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🏠</span> {{$t('menu.groups')}}
          </router-link>
          <div class="pt-2 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{$t('menu.section_music')}}</p>
          </div>
          <router-link to="/songs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎵</span> {{$t('menu.songs')}}
          </router-link>
          <router-link to="/music-stand" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🎼</span> {{$t('menu.music_stand')}}
          </router-link>
          <div class="pt-2 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{$t('menu.section_communication')}}</p>
          </div>
          <router-link to="/annonces" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📢</span> {{$t('menu.announcements')}}
          </router-link>
          <router-link to="/events" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📅</span> {{$t('menu.events')}}
          </router-link>
          <router-link to="/email" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📧</span> {{$t('menu.emails')}}
          </router-link>
          <router-link to="/sondages" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📊</span> {{$t('menu.polls')}}
          </router-link>
          <router-link to="/youtube" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>▶️</span> {{$t('menu.youtube')}}
          </router-link>
          <router-link to="/about" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>ℹ️</span> {{$t('menu.about')}}
          </router-link>
          <div v-if="isAdmin" class="pt-2 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{$t('menu.section_admin')}}</p>
          </div>
          <router-link v-if="isAdmin" to="/admin" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>⚙️</span> {{$t('menu.admin')}}
          </router-link>
          <router-link v-if="isAdmin" to="/webhooks" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🔗</span> {{$t('menu.webhooks')}}
          </router-link>
          <router-link v-if="isScheduler" to="/conflicts" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>⚠️</span> {{$t('menu.conflicts')}}
          </router-link>
          <router-link v-if="isAdmin" to="/logs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📋</span> {{$t('menu.logs')}}
          </router-link>
          <router-link v-if="isAdmin" to="/pco-sync" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🔄</span> {{$t('menu.pco_sync')}}
          </router-link>
          <router-link v-if="isAdmin" to="/admin/content" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>📝</span> {{$t('menu.content')}}
          </router-link>
          <router-link v-if="isAdmin" to="/admin/test-accounts" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" active-class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            <span>🧪</span> {{$t('menu.test_accounts')}}
          </router-link>
        </nav>
        <div v-if="isAuthenticated" class="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">

          <button @click="handleLogout" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
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
        <PageHelp
          v-if="isAuthenticated"
          :page="String(route.name || '')"
          :helpText="t(currentHelpKey)"
          :steps="currentHelpSteps"
          class="fixed bottom-4 right-4 z-40"
        />
      </main>
      <Toasts />
      <ConfirmDialog />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, provide } from 'vue'
import { publicRoutes } from './router/index'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Login from './components/Login.vue';
import { user, isAuthenticated, logout } from './stores/auth';
import { member, loadCurrentMember, isAdmin, isEditor, isScheduler, loading as memberLoading } from './stores/member';

import Toasts from './components/Toasts.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import GlobalSearch from './components/GlobalSearch.vue'
import PageHelp from './components/PageHelp.vue'
import { stepsByPage } from './page-help-steps'
import { onLogin } from './stores/auth';
import { useRouter } from 'vue-router'



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
  if (!('Notification' in window)) return

  const permission = await Notification.requestPermission().catch(() => 'denied')
  if (permission !== 'granted') return
})

const router = useRouter()
const { t } = useI18n()

const customHelpSteps = ref<any[] | null>(null)
const customHelpText = ref('')
provide('pageHelpOverride', { steps: customHelpSteps, text: customHelpText })

const steps = stepsByPage(t) as Record<string, any>
const currentHelpKey = computed(() => {
  if (customHelpText.value) return customHelpText.value
  const routeName = route.name as string
  return steps[routeName] ? `help.${routeName}` : ''
})
const currentHelpSteps = computed(() => {
  return customHelpSteps.value ?? steps[route.name as string] ?? []
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

onLogin(() => {
  if (route.name === 'login') router.push('/')
})

watch(user, (val) => {
  if (val) {
    loadCurrentMember()
    if (route.name === 'login') router.push('/')
  }
  else member.value = null
}, { immediate: true })

// Demo persona switcher
const demoPersonaMenuOpen = ref(false)
const isDemoMode = computed(() => typeof window !== 'undefined' && window.location.search.includes('demo=1'))
const demoPersonas: Record<string, { email: string; label: string }> = {
  admin: { email: 'admin@demo.church', label: 'Admin' },
  scheduler: { email: 'scheduler@demo.church', label: 'Planificateur' },
  editor: { email: 'editor@demo.church', label: 'Éditeur' },
  member: { email: 'member@demo.church', label: 'Membre' },
  guest: { email: 'guest@demo.church', label: 'Invité' },
}

function switchDemoPersona(key: string) {
  demoPersonaMenuOpen.value = false
  const persona = demoPersonas[key]
  if (!persona) return
  // Mettre à jour le user store et le member store (similaire à TestAccountsPanel)
  user.value = {
    email: persona.email,
    uid: `demo-${key}`,
    displayName: persona.label,
  }
  isAuthenticated.value = true
  member.value = {
    id: `demo-${key}`,
    email: persona.email,
    first_name: persona.label,
    last_name: '',
    role: key,
  }
}

// Close demo persona menu when clicking outside
onMounted(() => {
  const closeMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.demo-persona-selector')) demoPersonaMenuOpen.value = false
  }
  window.addEventListener('click', closeMenu)
})

</script>

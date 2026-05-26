<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{{ $t('dashboard.title') }}</h1>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-blue-600">{{ stats.members }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.members') }}</div>
        <div class="text-xs text-gray-400">{{ $t('dashboard.active_members', { count: stats.activeMembers }) }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-green-600">{{ stats.upcomingPlans }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.upcoming_plans') }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-indigo-600">{{ stats.songsWithArrangements }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.songs_with_charts') }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-amber-600">{{ stats.pendingConfirmations }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.pending_confirmations') }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="text-3xl font-bold text-purple-600">{{ stats.teams }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.teams') }}</div>
      </div>
    </div>

    <div class="mt-8 mb-8">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{{ $t('dashboard.attendance_title', { year: statsYear }) }}</h2>
      <div v-if="attendanceLoading" class="text-sm text-gray-500">{{ $t('loading') }}</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-green-600">{{ attendanceStats.total }}</div>
          <div class="text-sm text-gray-500">{{ $t('dashboard.attendance_total') }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('dashboard.attendance_by_month') }}</h4>
          <div class="flex items-end gap-1 h-20">
            <div v-for="m in attendanceStats.perMonth" :key="m.month"
              class="flex-1 bg-blue-500 rounded-t min-w-[8px]" 
              :style="{ height: Math.max(4, (m.count / maxMonth) * 80) + 'px' }"
              :title="`${monthNames[parseInt(m.month)-1]}: ${m.count}`">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link to="/" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">📅 {{ $t('dashboard.nav_services') }}</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.nav_services_desc') }}</p>
      </router-link>
      <router-link to="/members" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">👥 {{ $t('dashboard.nav_members') }}</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.nav_members_desc') }}</p>
      </router-link>
      <router-link to="/songs" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">🎵 {{ $t('dashboard.nav_songs') }}</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.nav_songs_desc') }}</p>
      </router-link>
      <router-link to="/checkin" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">✅ {{ $t('dashboard.nav_checkin') }}</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dashboard.nav_checkin_desc') }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'

const { t, tm } = useI18n()

const stats = ref({
  members: 0, activeMembers: 0, upcomingPlans: 0,
  songsWithArrangements: 0, pendingConfirmations: 0, teams: 0,
})
const loading = ref(true)
interface AttendanceStat { month: string; count: number }
const attendanceStats = ref<{ total: number; perMember: any[]; perMonth: AttendanceStat[]; recent: any[] }>({ total: 0, perMember: [], perMonth: [], recent: [] })
const attendanceLoading = ref(true)
const statsYear = ref(String(new Date().getFullYear()))

const maxMonth = computed(() => Math.max(1, ...attendanceStats.value.perMonth.map((m: any) => m.count)))

const monthNames = computed(() => tm('month') as unknown as string[])

onMounted(async () => {
  try {
    stats.value = await api.getStats()
    attendanceStats.value = await api.getAttendanceStats()
  } catch { /* ignore */ }
  finally { loading.value = false; attendanceLoading.value = false }
})
</script>

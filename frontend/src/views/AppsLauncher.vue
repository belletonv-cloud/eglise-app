<template>
  <div class="max-w-6xl mx-auto p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('apps.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
          {{ $t('apps.subtitle') }}
        </p>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="app in apps"
        :key="app.key"
        :to="app.to"
        class="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
            :class="app.iconBg"
          >
            {{ app.icon }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ app.title }}
              </h2>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
              {{ app.desc }}
            </p>
            <div class="mt-3 text-xs text-blue-700 dark:text-blue-300 font-medium group-hover:underline">
              {{ $t('apps.open') }} →
            </div>
          </div>
        </div>
      </router-link>

      <router-link
        to="/apps/compare"
        class="group bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-3"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 shrink-0">
            🌓
          </div>
          <div class="min-w-0">
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">
              {{ $t('apps.compare_title') }}
            </h2>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {{ $t('apps.compare_desc') }}
            </p>
            <div class="mt-3 text-xs text-emerald-800 dark:text-emerald-200 font-medium group-hover:underline">
              {{ $t('apps.open') }} →
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const apps = computed(() => [
  {
    key: 'services-center',
    icon: '🗂️',
    iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    title: t('apps.services_center_title'),
    desc: t('apps.services_center_desc'),
    to: '/services-center',
  },
  {
    key: 'music-stand',
    icon: '🎼',
    iconBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    title: t('apps.music_stand_title'),
    desc: t('apps.music_stand_desc'),
    to: '/music-stand-app',
  },
  {
    key: 'serving-schedule',
    icon: '📅',
    iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    title: t('apps.serving_schedule_title'),
    desc: t('apps.serving_schedule_desc'),
    to: '/serving-schedule',
  },
  {
    key: 'teams',
    icon: '🎛️',
    iconBg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    title: t('apps.teams_title'),
    desc: t('apps.teams_desc'),
    to: '/teams',
  },
  {
    key: 'members',
    icon: '👥',
    iconBg: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
    title: t('apps.members_title'),
    desc: t('apps.members_desc'),
    to: '/members',
  },
  {
    key: 'songs',
    icon: '🎵',
    iconBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    title: t('apps.songs_title'),
    desc: t('apps.songs_desc'),
    to: '/songs',
  },
  {
    key: 'announcements',
    icon: '📢',
    iconBg: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
    title: t('apps.announcements_title'),
    desc: t('apps.announcements_desc'),
    to: '/annonces',
  },
  {
    key: 'polls',
    icon: '📊',
    iconBg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    title: t('apps.polls_title'),
    desc: t('apps.polls_desc'),
    to: '/sondages',
  },
])
</script>

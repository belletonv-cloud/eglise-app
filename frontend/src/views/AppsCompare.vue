<template>
  <div class="max-w-7xl mx-auto p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('apps.compare_title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
          {{ $t('apps.compare_desc') }}
        </p>
      </div>
      <router-link
        to="/apps"
        class="text-sm text-blue-700 dark:text-blue-300 hover:underline shrink-0"
      >
        ← {{ $t('apps.back') }}
      </router-link>
    </div>

    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Left: Services Center style -->
      <section class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ $t('apps.services_center_title') }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {{ $t('apps.services_center_subtitle') }}
              </div>
            </div>
            <div class="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 font-semibold">
              UI A
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 text-sm">
            <button class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 font-semibold border border-emerald-200 dark:border-emerald-900">
              Order
            </button>
            <button class="px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-transparent">
              Teams
            </button>
            <button class="px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-transparent">
              Rehearse
            </button>
          </div>
        </header>

        <div class="p-3 space-y-2">
          <div v-for="(item, idx) in servicesCenterItems" :key="idx" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm px-3 py-2 flex items-center gap-3">
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">{{ item.duration }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.title }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ item.meta }}</div>
            </div>
            <div class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">{{ item.key }}</div>
          </div>

          <div class="mt-2 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ $t('apps.drag_hint') }}
          </div>
        </div>
      </section>

      <!-- Right: Music Stand style -->
      <section class="bg-black border border-gray-900 rounded-xl overflow-hidden shadow-sm">
        <header class="px-4 py-3 border-b border-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-white">{{ $t('apps.music_stand_title') }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">{{ $t('apps.music_stand_subtitle') }}</div>
            </div>
            <div class="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30">
              UI B
            </div>
          </div>
        </header>

        <div class="p-3 space-y-2">
          <div v-for="(item, idx) in musicStandItems" :key="idx" class="px-3 py-2 rounded-lg bg-gray-950 border border-gray-900">
            <div class="flex items-start justify-between gap-3">
              <div class="text-xs text-gray-400 w-12 shrink-0">{{ item.duration }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-white truncate">
                  {{ item.title }} <span class="text-blue-300 font-semibold">({{ item.key }})</span>
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500">{{ item.file }}</div>
                <div v-if="item.notes" class="text-xs text-gray-500 mt-1">
                  {{ item.notes }}
                </div>
              </div>
              <button class="text-gray-400 hover:text-blue-300 text-xs shrink-0">⋯</button>
            </div>
          </div>
        </div>

        <footer class="px-4 py-3 border-t border-gray-900 bg-gray-950">
          <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <div>0:42</div>
            <div class="flex-1 mx-3 h-2 rounded bg-gray-800 overflow-hidden">
              <div class="h-full w-1/3 bg-blue-500"></div>
            </div>
            <div>3:12</div>
          </div>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const servicesCenterItems = [
  { duration: '4:30', title: 'This is Amazing Grace', meta: 'Song • Intro', key: 'Bb' },
  { duration: '3:55', title: 'Our God', meta: 'Song • Verse/Chorus', key: 'A' },
  { duration: '2:10', title: 'Prayer', meta: 'Service item', key: '—' },
  { duration: '5:05', title: 'Set Free', meta: 'Song • Bridge', key: 'G' },
]

const musicStandItems = [
  { duration: '4:30', title: 'Our God', key: 'A', file: 'Set Free [A]', notes: 'Notes in light grey…' },
  { duration: '3:55', title: 'This is Amazing Grace', key: 'Bb', file: 'Amazing Grace [Bb]', notes: '' },
  { duration: '5:05', title: 'Set Free', key: 'G', file: 'Set Free [G]', notes: 'Click to open chart / playback' },
]
</script>

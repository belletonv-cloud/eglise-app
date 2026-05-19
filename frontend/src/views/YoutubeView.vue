<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('youtube.title') }}</h1>
    </div>

    <div class="mb-4">
      <input v-model="search" @input="onSearch" type="text" :placeholder="$t('youtube.search_placeholder')"
        class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('youtube.loading') }}</div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="video in videos" :key="video.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
        <img :src="video.thumbnail" :alt="video.title" class="w-full h-44 object-cover" loading="lazy" />
        <div class="p-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm line-clamp-2">{{ video.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ video.date }}</p>
          <a :href="video.url" target="_blank" rel="noopener"
            class="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 cursor-pointer">
            ▶ {{ $t('youtube.watch') }}
          </a>
        </div>
      </div>
    </div>

    <div v-if="!loading && videos.length === 0" class="text-center py-12 text-gray-400">{{ $t('youtube.nothing') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const videos = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const allVideos = ref<any[]>([])

const CHANNEL_ID = 'UCmGkH3bY5xJvKz7bQqMxRqA'

const loadVideos = async () => {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`)
    const text = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'application/xml')
    const entries = doc.querySelectorAll('entry')
    allVideos.value = Array.from(entries).map(entry => {
      const id = entry.querySelector('id')?.textContent?.split(':').pop() || ''
      const title = entry.querySelector('title')?.textContent || ''
      const published = entry.querySelector('published')?.textContent || ''
      const group = entry.querySelector('media\\:group, group')
      const thumbnail = group?.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      return {
        id,
        title,
        date: new Date(published).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        thumbnail,
        url: `https://www.youtube.com/watch?v=${id}`,
      }
    })
    videos.value = allVideos.value
  } catch (e) {
    console.warn('YouTube RSS fetch failed, using fallback')
    videos.value = []
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  const q = search.value.toLowerCase().trim()
  if (!q) {
    videos.value = allVideos.value
  } else {
    videos.value = allVideos.value.filter(v => v.title.toLowerCase().includes(q))
  }
}

onMounted(loadVideos)
</script>

<template>
  <div class="home">
    <div class="content">
      <h2>{{ $t('home.title') }} ({{ filteredSongs.length }})<span v-if="offlineMode" class="offline-badge">{{ $t('home.offline') }}</span></h2>
      <div v-if="loading">{{ $t('loading') }}</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else>
        <li v-for="song in filteredSongs" :key="song.id" @click="goToSong(song.id)" class="song-item">
          <span class="song-id">#{{ song.id }}</span>
          {{ song.title }}
          <span v-if="song.author">- {{ song.author }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../utils/api';
import { getOfflineSongs } from '../utils/offlineDb';

const songs = ref<Array<{id: number, title: string, author?: string, arrangement_count?: number}>>([]);
const loading = ref(true);
const error = ref('');
const offlineMode = ref(false);
const router = useRouter();

const filteredSongs = computed(() => {
  return songs.value.filter(s => (s.arrangement_count ?? 0) > 0);
});

async function loadFromAPI() {
  try {
    { const r = await api.getSongs(); songs.value = r.data ?? r; }
    offlineMode.value = false;
  } catch (e: any) {
    throw e;
  }
}

async function loadFromOffline() {
  const offline = await getOfflineSongs();
  songs.value = offline.map((s: any) => ({
    id: s.id,
    title: s.title,
    author: s.author,
    arrangement_count: s.arrangements?.length || 0,
  }));
  offlineMode.value = true;
}

onMounted(async () => {
  try {
    await loadFromAPI();
  } catch (e: any) {
    await loadFromOffline();
    if (!offlineMode.value) {
      error.value = 'API non accessible : ' + e.message;
    }
  } finally {
    loading.value = false;
  }
});

const goToSong = (id: number) => {
  router.push({ name: 'song-detail', params: { id: id.toString() } });
};
</script>

<style scoped>
.content {
  margin-top: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
.song-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.song-item:hover {
  background: #f5f5f5;
}
.song-id {
  color: #999;
  font-size: 0.8em;
  margin-right: 8px;
  font-family: monospace;
}
.error {
  color: red;
  padding: 10px;
  background: #fee;
  border-radius: 4px;
}
.offline-badge {
  font-size: 0.5em;
  background: #f59e0b;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
  vertical-align: middle;
}
</style>

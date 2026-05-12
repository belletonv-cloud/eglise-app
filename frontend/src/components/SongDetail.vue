<template>
  <div class="song-detail" v-if="song">
    <div class="header">
      <button @click="goBack" class="back-btn">← Retour</button>
      <h1>{{ song.title }}</h1>
      <p v-if="song.author" class="author">{{ song.author }}</p>
      <p v-if="song.ccli_number" class="ccli">CCLI: {{ song.ccli_number }}</p>
    </div>

    <div class="song-info">
      <p v-if="song.themes"><strong>Thèmes:</strong> {{ song.themes }}</p>
      <p v-if="song.notes"><strong>Notes:</strong> {{ song.notes }}</p>
    </div>

    <div class="arrangements" v-if="song.arrangements && song.arrangements.length > 0">
      <h3>Arrangements</h3>
      <div class="arrangement-controls">
        <select v-model="selectedArrangementId" @change="loadArrangement">
          <option v-for="arr in song.arrangements" :key="arr.id" :value="arr.id">
            {{ arr.name }} ({{ arr.key }})
          </option>
        </select>
        <button @click="showEditor = true" class="edit-chart-btn">
          ✏️ Éditer
        </button>
        <button v-if="!isOffline" @click="downloadForOffline" class="offline-btn">
          📥 {{ downloading ? '...' : 'Offline' }}
        </button>
        <span v-if="isOffline" class="offline-indicator">✓ Disponible offline</span>
      </div>
    </div>
    <div v-else-if="song.arrangements && song.arrangements.length === 0" class="no-arrangements">
      Aucun arrangement disponible pour ce chant.
    </div>

    <div class="transpose-controls" v-if="currentArrangement">
      <h3>Transposition</h3>
      <div class="controls">
        <label>
          Tonalité originale: 
          <select v-model="originalKey" @change="onOriginalKeyChange">
            <option v-for="key in keyOptions" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
        </label>
        <label>
          Transposer vers: 
          <select v-model="targetKey" @change="transpose">
            <option v-for="key in keyOptions" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
        </label>
        <span class="semitones">Demi-tons: {{ semitones }}</span>
      </div>
      <div class="actions">
        <button @click="transposeUp">+ Demi-ton</button>
        <button @click="transposeDown">- Demi-ton</button>
        <button @click="resetTransposition">Réinitialiser</button>
      </div>
    </div>

    <div v-if="!displayedChart && currentArrangement" class="no-chart-message p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center">
      ⚠️ Aucune grille d'accords disponible pour cet arrangement ({{ currentArrangement.name }}).
      <br><span class="text-sm">Le champ "chord_chart" est vide dans la base de données.</span>
    </div>

    <div class="chord-chart" v-else-if="displayedChart">
      <div class="chart-content">
        <template v-for="(line, idx) in chordLines" :key="idx">
          <div v-if="line.type === 'empty'" class="chordpro-empty"></div>
          <div v-else-if="line.type === 'standalone'" class="standalone-chord-row">{{ line.chordRow }}</div>
          <div v-else class="chordpro-block">
            <div class="chord-row">{{ line.chordRow }}</div>
            <div class="lyric-row">{{ line.lyrics }}</div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="currentArrangement" class="media-section">
      <h3>Médias <span v-if="mediaItems.length" class="count">({{ mediaItems.length }})</span></h3>
      <div class="media-list">
        <div v-if="!mediaItems.length" class="no-media">
          Aucun média attaché.
        </div>
        <div v-for="media in mediaItems" :key="media.id" class="media-item">
          <span class="media-icon">{{ getMediaIcon(media.file_type) }}</span>
          <a :href="media.file_url" target="_blank" class="media-link">{{ media.filename }}</a>
          <span class="media-type-badge">{{ media.file_type || 'fichier' }}</span>
          <button @click="deleteMedia(media.id)" class="media-delete-btn" title="Supprimer">✕</button>
        </div>
      </div>
      <button @click="showMediaUpload = true" class="add-media-btn">
        + Ajouter un média
      </button>
    </div>

    <div class="loading" v-if="loading">
      Chargement...
    </div>
    <div class="error" v-if="error">
      {{ error }}
    </div>

    <div v-if="showEditor && currentArrangement" class="modal-overlay" @click.self="showEditor = false">
      <ChordProEditor
        :arrangement-id="currentArrangement.id"
        :initial-chart="currentArrangement.chord_chart || ''"
        @close="showEditor = false"
        @save="onChartSaved"
      />
    </div>

    <div v-if="showMediaUpload && currentArrangement" class="modal-overlay" @click.self="showMediaUpload = false">
      <MediaUpload
        :arrangement-id="currentArrangement.id"
        @close="showMediaUpload = false"
        @uploaded="onMediaUploaded"
      />
    </div>

    <div v-if="currentArrangement" class="mt-8">
      <ArrangementAnnotations :arrangement-id="currentArrangement.id" :key="'ann-' + currentArrangement.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { transposeChordChart, getKeyOptions, getSemitonesFromC } from '../utils/transpose';
import { saveSongOffline, isSongOffline } from '../utils/offlineDb';
import { api } from '../utils/api';
import { parseChordPro, type ParsedLine } from '../utils/chordpro';
import { showToast } from '../stores/toast';
import { confirmDialog } from '../stores/confirm';
import ChordProEditor from './ChordProEditor.vue';
import MediaUpload from './MediaUpload.vue';
import ArrangementAnnotations from './ArrangementAnnotations.vue';

const route = useRoute();
const router = useRouter();

const song = ref<any>(null);
const loading = ref(true);
const error = ref('');
const selectedArrangementId = ref<number|null>(null);
const currentArrangement = ref<any>(null);
const originalKey = ref('C');
const targetKey = ref('C');
const semitones = ref(0);
const keyOptions = getKeyOptions();
const showEditor = ref(false);
const isOffline = ref(false);
const downloading = ref(false);
const showMediaUpload = ref(false);
const mediaItems = ref<any[]>([]);

function getMediaIcon(type: string): string {
  const icons: Record<string, string> = { audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄' };
  return icons[type] || '📎';
}

async function loadMedia() {
  if (!currentArrangement.value?.id) return;
  try {
    mediaItems.value = await api.getArrangementMedia(currentArrangement.value.id);
  } catch {
    mediaItems.value = [];
  }
}

function onMediaUploaded(media: { url: string; type: string; title: string }) {
  loadMedia();
  showMediaUpload.value = false;
}

async function deleteMedia(id: number) {
  if (!await confirmDialog('Supprimer ce média ?')) return;
  try {
    await api.deleteAttachment(id);
    mediaItems.value = mediaItems.value.filter((m) => m.id !== id);
  } catch (e: any) {
    showToast('Erreur: ' + e.message, 'error')
  }
}

async function checkOfflineStatus() {
  if (song.value?.id) {
    isOffline.value = await isSongOffline(song.value.id);
  }
}

async function downloadForOffline() {
  if (!song.value) return;
  downloading.value = true;
  try {
    await saveSongOffline(song.value);
    isOffline.value = true;
  } catch (e) {
    showToast('Erreur lors du téléchargement: ' + (e as Error).message, 'error')
  } finally {
    downloading.value = false;
  }
}

function onChartSaved(newChart: string) {
  if (currentArrangement.value) {
    currentArrangement.value.chord_chart = newChart;
  }
}

// Recharger quand l'ID change dans la route
const currentId = ref(route.params.id);
router.afterEach(() => {
  if (route.name === 'song-detail' && route.params.id !== currentId.value) {
    currentId.value = route.params.id as string;
    resetState();
    loadSong();
  }
});

const displayedChart = computed(() => {
  if (!currentArrangement.value?.chord_chart) return '';
  let chart = currentArrangement.value.chord_chart;
  if (chart === null || chart === undefined) return '';
  
  // Normaliser les retours à la ligne Windows (CRLF -> LF)
  chart = chart.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Transposer si nécessaire
  if (semitones.value !== 0) {
    chart = transposeChordChart(chart, originalKey.value, targetKey.value);
  }
  
  return chart;
});

const chordLines = computed<ParsedLine[]>(() => parseChordPro(displayedChart.value))

const resetState = () => {
  song.value = null;
  loading.value = true;
  error.value = '';
  selectedArrangementId.value = null;
  currentArrangement.value = null;
  originalKey.value = 'C';
  targetKey.value = 'C';
  semitones.value = 0;
};

const loadSong = async () => {
  try {
    loading.value = true;
    const id = Number(route.params.id);
    if (isNaN(id)) throw new Error('ID invalide');
    song.value = await api.getSong(id);

    // Sélectionner le premier arrangement par défaut
    if (song.value.arrangements && song.value.arrangements.length > 0) {
      selectedArrangementId.value = song.value.arrangements[0].id;
      loadArrangement();
    }

    // Vérifier si disponible offline
    await checkOfflineStatus();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const loadArrangement = () => {
  if (!selectedArrangementId.value || !song.value?.arrangements) return;
  
  const arr = song.value.arrangements.find((a: any) => a.id === selectedArrangementId.value);
  if (arr) {
    currentArrangement.value = arr;
    originalKey.value = arr.key || 'C';
    targetKey.value = arr.key || 'C';
    semitones.value = 0;
    loadMedia();
  }
};

const transpose = () => {
  semitones.value = getSemitonesFromC(targetKey.value) - getSemitonesFromC(originalKey.value);
  // Ajustement pour garder entre -6 et +6
  if (semitones.value > 6) semitones.value -= 12;
  if (semitones.value < -6) semitones.value += 12;
};

const transposeUp = () => {
  const currentIndex = keyOptions.indexOf(targetKey.value);
  if (currentIndex >= 0 && currentIndex < keyOptions.length - 1) {
    const nextKey = keyOptions[currentIndex + 1];
    if (nextKey !== undefined) {
      targetKey.value = nextKey;
      transpose();
    }
  }
};

const transposeDown = () => {
  const currentIndex = keyOptions.indexOf(targetKey.value);
  if (currentIndex > 0) {
    const prevKey = keyOptions[currentIndex - 1];
    if (prevKey !== undefined) {
      targetKey.value = prevKey;
      transpose();
    }
  }
};

const resetTransposition = () => {
  targetKey.value = originalKey.value;
  transpose();
};

const onOriginalKeyChange = () => {
  // Recalculer la transposition
  transpose();
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  loadSong();
});
</script>

<style scoped>
.song-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
}
.back-btn {
  background: #7f8c8d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;
}
.back-btn:hover {
  background: #6c7b7d;
}
h1 {
  margin: 10px 0;
  color: #2c3e50;
}
.author, .ccli {
  color: #666;
  margin: 5px 0;
}
.song-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.arrangements, .transpose-controls {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.arrangements select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
}
.controls {
  display: flex;
  gap: 20px;
  align-items: center;
  margin: 15px 0;
  flex-wrap: wrap;
}
.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.controls select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.semitones {
  font-weight: bold;
  color: #e74c3c;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.actions button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.actions button:hover {
  background: #2980b9;
}
.chord-chart {
  margin-top: 20px;
}
.chart-content {
  background: #f8f8f8;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  max-height: 600px;
  overflow-y: auto;
}
.chordpro-empty {
  height: 0.5em;
}
.chordpro-block {
  margin-bottom: 0.3em;
}
.chord-row {
  color: #e74c3c;
  font-weight: bold;
  white-space: pre;
  line-height: 1.2;
  font-size: 0.9em;
}
.standalone-chord-row {
  color: #e74c3c;
  font-weight: bold;
  white-space: pre;
  line-height: 1.6;
  font-size: 0.9em;
  margin-bottom: 0.3em;
}
.lyric-row {
  white-space: pre-wrap;
  line-height: 1.4;
}
.chord-text {
  color: #e74c3c;
  font-weight: bold;
}
.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}
.error {
  color: #e74c3c;
  background: #fde8e8;
  border-radius: 8px;
}
.arrangement-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}
.arrangement-controls select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.edit-chart-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.edit-chart-btn:hover {
  background: #2980b9;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.offline-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.offline-btn:hover {
  background: #059669;
}
.offline-indicator {
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
}
.media-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}
.media-section h3 {
  margin: 0 0 15px 0;
  color: #1f2937;
}
.media-list {
  margin-bottom: 15px;
}
.no-media {
  color: #6b7280;
  font-style: italic;
  padding: 10px;
}
.media-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
}
.media-icon {
  font-size: 1.2rem;
}
.media-link {
  flex: 1;
  color: #2563eb;
  text-decoration: none;
}
.media-link:hover {
  text-decoration: underline;
}
.media-type-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 10px;
  color: #6b7280;
}
.add-media-btn {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.add-media-btn:hover {
  background: #4f46e5;
}
.media-delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 4px;
}
.media-delete-btn:hover {
  background: #fee2e2;
}
.count {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 400;
}
</style>

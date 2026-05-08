<template>
  <div class="chordpro-editor">
    <div class="editor-header">
      <h3>Éditeur ChordPro</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="editor-content">
      <div class="input-section">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ChordPro (utilisez [C] pour les accords)
        </label>
        <textarea
          v-model="localChart"
          rows="15"
          class="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="{title: Nom du chant}
{artist: Auteur}
[C]Paroles avec [G]accords"
        ></textarea>
        <div class="help-text">
          <p class="text-xs text-gray-500">
            <strong>Syntaxe ChordPro :</strong> [C] = Do, [G] = Sol, [Am] = La mineur
          </p>
        </div>
      </div>

      <div class="preview-section">
        <label class="block text-sm font-medium text-gray-700 mb-2">Aperçu</label>
        <div class="preview-content" v-if="localChart">
          <template v-for="(line, idx) in parsedLines" :key="idx">
            <div v-if="line.type === 'empty'" class="chordpro-empty"></div>
            <div v-else-if="line.type === 'standalone'" class="standalone-chord-row">{{ line.chordRow }}</div>
            <div v-else class="chordpro-block">
              <div class="chord-row">{{ line.chordRow }}</div>
              <div class="lyric-row">{{ line.lyrics }}</div>
            </div>
          </template>
        </div>
        <div v-else class="preview-empty text-gray-400 text-center py-8">
          L'aperçu apparaîtra ici...
        </div>
      </div>
    </div>

    <div class="editor-footer">
      <button @click="save" :disabled="saving" class="save-btn">
        {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
      </button>
      <button @click="$emit('close')" class="cancel-btn">Annuler</button>
    </div>

    <div v-if="message" :class="['message', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '../utils/api'
import { parseChordPro } from '../utils/chordpro'

const props = defineProps<{
  arrangementId: number
  initialChart: string
}>()

const emit = defineEmits(['close', 'save'])

const localChart = ref(props.initialChart || '')
const saving = ref(false)
const message = ref<{ type: string; text: string } | null>(null)

const parsedLines = computed(() => parseChordPro(localChart.value))

async function save() {
  saving.value = true
  message.value = null
  try {
    await api.updateArrangement(props.arrangementId, { chord_chart: localChart.value })
    message.value = { type: 'success', text: 'Sauvegardé avec succès!' }
    emit('save', localChart.value)
    setTimeout(() => emit('close'), 1000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || 'Erreur lors de la sauvegarde' }
  } finally {
    saving.value = false
  }
}

watch(() => props.initialChart, (newVal) => {
  localChart.value = newVal || ''
})
</script>

<style scoped>
.chordpro-editor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  max-height: 60vh;
  overflow: auto;
}

.input-section textarea {
  font-family: 'Monaco', 'Menlo', monospace;
}

.preview-section {
  background: #f9fafb;
  border-radius: 6px;
  padding: 0.5rem;
}

.preview-content {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  white-space: pre-wrap;
}

.chordpro-block {
  margin-bottom: 0.25rem;
}

.chord-row {
  color: #2563eb;
  font-weight: 500;
}

.lyric-row {
  color: #1f2937;
}

.standalone-chord-row {
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.chordpro-empty {
  height: 0.5rem;
}

.preview-empty {
  font-style: italic;
}

.editor-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.save-btn {
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.message {
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.help-text {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
}
</style>
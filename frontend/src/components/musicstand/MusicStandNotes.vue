<template>
  <div v-if="visible" class="notes-panel" @click.stop>
    <div class="notes-header">
      <span class="notes-title">📝 Notes</span>
      <button @click="$emit('close')" class="notes-close">✕</button>
    </div>
    <div class="notes-list">
      <div v-if="loading" class="notes-loading">Chargement…</div>
      <div v-else-if="annotations.length === 0" class="notes-empty">
        Aucune note pour ce chant
      </div>
      <div
        v-for="ann in annotations"
        :key="ann.id"
        class="note-item"
        :class="{ 'note-shared': ann.is_shared }"
      >
        <div class="note-meta">
          <span class="note-author">{{ ann.first_name }} {{ ann.last_name }}</span>
          <span v-if="ann.is_shared" class="note-badge shared">Partagée</span>
          <span v-else class="note-badge private">Privée</span>
          <button
            v-if="ann.member_id === currentMemberId"
            @click="deleteNote(ann.id)"
            class="note-delete"
          >
            🗑
          </button>
        </div>
        <p class="note-content">{{ ann.content }}</p>
      </div>
    </div>
    <div class="notes-add">
      <textarea
        v-model="newNoteContent"
        rows="2"
        placeholder="Ajouter une note…"
        class="notes-textarea"
        @click.stop
        @keydown.stop
      ></textarea>
      <div class="notes-add-footer">
        <label class="notes-share-label">
          <input type="checkbox" v-model="newNoteShared" />
          Partager avec l'équipe
        </label>
        <button
          @click="addNote"
          :disabled="!newNoteContent.trim()"
          class="notes-save-btn"
        >
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '../../utils/api'
import { showToast } from '../../stores/toast'

const props = defineProps<{
  visible: boolean
  arrangementId: number | null
  currentMemberId: number | null
}>()

const emit = defineEmits(['close'])

const annotations = ref<any[]>([])
const loading = ref(false)
const newNoteContent = ref('')
const newNoteShared = ref(false)

async function loadAnnotations() {
  if (!props.arrangementId) return
  loading.value = true
  try {
    const r = await api.getArrangementAnnotations(props.arrangementId)
    annotations.value = r.data ?? r
  } catch {
    annotations.value = []
  } finally {
    loading.value = false
  }
}

async function addNote() {
  if (!props.arrangementId || !newNoteContent.value.trim()) return
  try {
    await api.createAnnotation(props.arrangementId, {
      content: newNoteContent.value.trim(),
      is_shared: newNoteShared.value,
    })
    newNoteContent.value = ''
    await loadAnnotations()
  } catch (e: any) {
    showToast(e.message || "Erreur", "error")
  }
}

async function deleteNote(id: number) {
  try {
    await api.deleteAnnotation(id)
    await loadAnnotations()
  } catch (e: any) {
    showToast(e.message || "Erreur", "error")
  }
}

watch(() => props.visible, (v) => { if (v) loadAnnotations() })
watch(() => props.arrangementId, () => { if (props.visible) loadAnnotations() })
</script>
<style scoped>
.notes-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 340px;
    max-width: 90vw;
    background: rgba(20, 20, 40, 0.97);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 200;
    backdrop-filter: blur(12px);
}
.notes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.notes-title {
    font-size: 15px;
    font-weight: 600;
    color: #e0e0e0;
}
.notes-close {
    background: none;
    border: none;
    color: #aaa;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
}
.notes-close:hover { background: rgba(255, 255, 255, 0.1); color: white; }
.notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.notes-loading,
.notes-empty {
    color: #888;
    font-size: 13px;
    text-align: center;
    padding: 20px 0;
}
.note-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 10px 12px;
    border-left: 3px solid transparent;
}
.note-item.note-shared { border-left-color: #6366f1; }
.note-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}
.note-author {
    font-size: 12px;
    font-weight: 600;
    color: #ccc;
}
.note-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
}
.note-badge.shared { background: rgba(99, 102, 241, 0.3); color: #a5b4fc; }
.note-badge.private { background: rgba(255, 255, 255, 0.08); color: #9ca3af; }
.note-delete {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    opacity: 0.5;
    padding: 2px 4px;
}
.note-delete:hover { opacity: 1; }
.note-content {
    font-size: 13px;
    color: #d1d5db;
    white-space: pre-wrap;
    line-height: 1.5;
}
.notes-add {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px;
}
.notes-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #e0e0e0;
    font-size: 13px;
    padding: 8px 10px;
    resize: none;
    outline: none;
    box-sizing: border-box;
}
.notes-textarea:focus { border-color: #6366f1; }
.notes-add-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    gap: 8px;
}
.notes-share-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
    cursor: pointer;
}
.notes-save-btn {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
    font-weight: 600;
}
.notes-save-btn:hover { background: #4f46e5; }
.notes-save-btn:disabled { opacity: 0.4; cursor: default; }
</style>

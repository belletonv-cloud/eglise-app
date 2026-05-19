<template>
  <div class="media-upload">
    <div class="modal-header">
      <h3>{{$t('media.add')}}</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="upload-content">
      <div class="dropzone" @dragover.prevent @drop.prevent="onDrop" @click="triggerFileInput">
        <input
          ref="fileInput"
          type="file"
          accept="audio/*,video/*,image/*,application/pdf"
          @change="onFileSelect"
          class="hidden"
        />
        <div v-if="!selectedFile" class="dropzone-text">
          <p>{{ $t('song.drop_or_select') || 'Glissez un fichier ici ou cliquez pour sélectionner' }}</p>
          <p class="hint">{{ $t('song.accepted_types') || 'Audio, vidéo, image ou PDF' }}</p>
        </div>
        <div v-else class="selected-file">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
      </div>

      <div v-if="uploading" class="progress-section">
        <div class="spinner"></div>
        <span class="progress-text">{{ $t('song.uploading') || 'Upload en cours...' }}</span>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="downloadUrl" class="success-message">
        {{ $t('song.upload_success') || '✓ Fichier uploadé avec succès!' }}
      </div>

      <div class="media-type">
        <label>{{$t('media.type_label')}}</label>
        <select v-model="mediaType">
          <option value="audio">{{$t('media.type_audio')}}</option>
          <option value="video">{{$t('media.type_video')}}</option>
          <option value="image">{{$t('media.type_image')}}</option>
          <option value="pdf">{{$t('media.type_pdf')}}</option>
        </select>
      </div>

      <div class="media-title">
        <label>{{$t('media.title_label')}}</label>
        <input v-model="title" type="text" :placeholder="$t('media.file_desc')" />
      </div>
    </div>

    <div class="modal-footer">
      <button @click="$emit('close')" class="cancel-btn">{{$t('generic.cancel')}}</button>
      <button
        @click="upload"
        :disabled="!selectedFile || uploading"
        class="upload-btn"
      >
        {{ uploading ? $t('media.uploading') : $t('media.upload') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue';
import { api, getApiBase } from '../utils/api';

const props = defineProps<{
  arrangementId: number
}>();

const emit = defineEmits(['close', 'uploaded']);

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const downloadUrl = ref('');
const error = ref('');
const mediaType = ref('audio');
const title = ref('');

// i18n
const { proxy } = getCurrentInstance() as any;
const $t = proxy?.$t || ((k:string)=>k);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    selectedFile.value = target.files[0];
    downloadUrl.value = '';
    error.value = '';
  }
}

function onDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files?.[0]) {
    selectedFile.value = files[0];
    downloadUrl.value = '';
    error.value = '';
  }
}

async function upload() {
  if (!selectedFile.value) return;

  uploading.value = true;
  error.value = '';
  downloadUrl.value = '';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('arrangement_id', String(props.arrangementId));
    formData.append('file_type', mediaType.value);

    const res = await fetch(`${getApiBase()}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let msg = '';
      if(res.status === 401 || res.status === 403) {
        msg = $t('song.upload_error_auth');
      } else {
        const err = await res.json().catch(() => ({ error: '' }));
        msg = err.error ? (typeof err.error === 'string' ? err.error : $t('song.upload_error_generic')) : $t('song.upload_error_generic');
      }
      throw new Error(msg || $t('song.upload_error_generic'));
    }

    const attachment = await res.json();
    const fileUrl = `${getApiBase()}/attachments/${attachment.id}/file`;

    downloadUrl.value = fileUrl;

    emit('uploaded', {
      id: attachment.id,
      url: fileUrl,
      filename: attachment.filename,
      type: mediaType.value,
      title: title.value || selectedFile.value.name,
    });

    setTimeout(() => emit('close'), 1500);
  } catch (e: any) {
    error.value = e.message || 'Erreur lors de l\'upload';
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.media-upload {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
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

.upload-content {
  padding: 1rem;
}

.dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropzone:hover {
  border-color: #3b82f6;
}

.dropzone-text p {
  margin: 0;
  color: #6b7280;
}

.dropzone-text .hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.selected-file {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
}

.file-size {
  font-size: 0.8rem;
  color: #6b7280;
}

.hidden {
  display: none;
}

.progress-section {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 0.85rem;
  color: #6b7280;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.9rem;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  font-size: 0.9rem;
}

.media-type, .media-title {
  margin-top: 1rem;
}

.media-type label, .media-title label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.media-type select, .media-title input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.upload-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

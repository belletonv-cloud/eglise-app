<template>
  <div v-if="visible" class="settings-panel" @click.stop>
    <h4 class="text-sm font-bold mb-2 text-gray-300">{{ $t("pdfExport.title") }}</h4>
    <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
      <input type="checkbox" :checked="showChords" @change="$emit('update:showChords', ($event.target as HTMLInputElement).checked)" class="rounded" />
      Accords
    </label>
    <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
      <input type="checkbox" :checked="showLyrics" @change="$emit('update:showLyrics', ($event.target as HTMLInputElement).checked)" class="rounded" />
      Paroles
    </label>
    <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
      <input type="checkbox" :checked="showSections" @change="$emit('update:showSections', ($event.target as HTMLInputElement).checked)" class="rounded" />
      Sections
    </label>
    <div class="text-sm text-gray-300 mb-2">
      <span>Taille du texte</span>
      <input type="range" :value="fontSize" @input="$emit('update:fontSize', Number(($event.target as HTMLInputElement).value))" min="14" max="48" class="w-full mt-1" />
      <span>{{ fontSize }}px</span>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  visible: boolean
  showChords: boolean
  showLyrics: boolean
  showSections: boolean
  fontSize: number
}>()
defineEmits<{
  (e: 'update:showChords', v: boolean): void
  (e: 'update:showLyrics', v: boolean): void
  (e: 'update:showSections', v: boolean): void
  (e: 'update:fontSize', v: number): void
  (e: 'close'): void
}>()
</script>
<style scoped>
.settings-panel {
    position: fixed;
    top: 56px;
    right: 12px;
    background: rgba(30, 30, 50, 0.98);
    border-radius: 12px;
    padding: 16px;
    z-index: 101;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    min-width: 200px;
}
</style>

<template>
  <div class="page-help-root">
    <button
      class="page-help-btn"
      @click="openModal"
      aria-label="Aide/explications de la page"
      title="Aide/explications de la page"
    >
      <span>?</span>
    </button>

    <Teleport to="body">
      <div v-if="visible" class="page-help-modal fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="page-help-content bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-lg w-full relative">
          <button class="absolute top-4 right-6 text-gray-500 hover:text-blue-600" @click="closeModal" aria-label="Fermer">✕</button>
          <div v-if="steps.length === 0">
            <slot name="default">
              <p>{{ helpText }}</p>
            </slot>
          </div>
          <div v-else>
            <div class="font-semibold text-xl mb-3">{{ steps[stepIndex].title }}</div>
            <div class="mb-6">{{ steps[stepIndex].desc }}</div>
            <div class="flex items-center gap-5 justify-between mt-8">
              <button v-if="stepIndex > 0" @click="prevStep" class="text-blue-500 hover:underline">← {{ $t('help.prev') || 'Précédent' }}</button>
              <span class="flex-1 text-center text-xs text-gray-400">{{ stepIndex + 1 }}/{{ steps.length }}</span>
              <button v-if="stepIndex < steps.length - 1" @click="nextStep" class="text-blue-500 hover:underline">{{ $t('help.next') || 'Suivant' }} →</button>
              <button v-if="stepIndex === steps.length - 1" @click="closeModal" class="text-green-600 font-semibold ml-auto">{{ $t('help.done') || 'Terminé' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, defineProps } from 'vue';
const props = defineProps({
  page: { type: String, required: true },
  steps: { type: Array, default: () => [] },
  helpText: { type: String, default: '' },
});

const visible = ref(false);
const stepIndex = ref(0);
const steps = computed(() => props.steps || []);

function openModal() {
  visible.value = true;
  stepIndex.value = 0;
}
function closeModal() {
  visible.value = false;
}
function nextStep() {
  if (stepIndex.value < steps.value.length - 1) stepIndex.value++;
}
function prevStep() {
  if (stepIndex.value > 0) stepIndex.value--;
}
</script>

<style scoped>
.page-help-root {
  position: absolute;
  top: 18px;
  right: 24px;
  z-index: 50;
}
.page-help-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  border: none;
  font-size: 1.5rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 8px 2px rgb(0 0 0 / 7%), 0 0px 1px 0px rgb(0 0 0 / 5%);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.2s;
}
.page-help-btn:hover {
  background: #dbeafe;
}
.page-help-modal {
  backdrop-filter: blur(2px);
}
.page-help-content {
  min-height: 180px;
  min-width: 320px;
}
</style>

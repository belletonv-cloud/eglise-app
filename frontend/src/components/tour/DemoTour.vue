<template>
  <div v-if="visible" class="demo-tour-overlay" @click.self="skip">
    <div class="demo-tour-card" :style="{ top: step.y + 'px', left: step.x + 'px' }">
      <div class="demo-tour-header">
        <span class="demo-tour-step-badge">{{ currentStep + 1 }} / {{ steps.length }}</span>
        <button @click="skip" class="demo-tour-skip">Skip</button>
      </div>
      <h4 class="demo-tour-title">{{ step.title }}</h4>
      <p class="demo-tour-desc">{{ step.desc }}</p>
      <div class="demo-tour-footer">
        <button @click="prevStep" :disabled="currentStep === 0" class="demo-tour-btn secondary">Back</button>
        <button @click="nextStep" class="demo-tour-btn primary">{{ step.done ? 'Finish' : 'Next' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Step {
  target: string
  title: string
  desc: string
  done?: boolean
}

const props = defineProps<{
  steps: Step[]
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const currentStep = ref(0)
const step = computed(() => props.steps[currentStep.value] || props.steps[0])

function nextStep() {
  if (currentStep.value >= props.steps.length - 1) {
    visible.value = false
  } else {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function skip() {
  visible.value = false
}
</script>

<style scoped>
.demo-tour-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999;
}
.demo-tour-card {
  position: absolute; background: white; border-radius: 12px; padding: 20px;
  width: 320px; max-width: 90vw; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}
.demo-tour-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.demo-tour-step-badge { background: #6366f1; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
.demo-tour-skip { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; }
.demo-tour-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.demo-tour-desc { color: #4b5563; font-size: 14px; margin-bottom: 16px; }
.demo-tour-footer { display: flex; gap: 8px; justify-content: flex-end; }
.demo-tour-btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.demo-tour-btn.secondary { background: #e5e7eb; color: #374151; }
.demo-tour-btn.primary { background: #6366f1; color: white; }
</style>

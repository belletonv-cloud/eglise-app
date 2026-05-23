<template>
  <div class="demo-guide" v-if="isDemoTourActive">
    <div class="demo-guide-backdrop" @click="minimize = !minimize" />
    <div class="demo-guide-card" :class="{ minimized }">
      <div class="guide-header">
        <span class="guide-badge">🎯 {{ currentStep + 1 }}/{{ totalSteps }}</span>
        <div class="guide-header-actions">
          <button @click="minimize = !minimize" class="guide-btn" :title="minimize ? 'Agrandir' : 'Réduire'">
            {{ minimized ? '▲' : '▼' }}
          </button>
          <button @click="stop" class="guide-btn guide-close" title="Fermer">✕</button>
        </div>
      </div>

      <template v-if="!minimized">
        <div class="guide-body">
          <div class="guide-icon">{{ step.icon }}</div>
          <h3 class="guide-title">{{ step.title }}</h3>
          <p class="guide-desc">{{ step.desc }}</p>
          <p class="guide-hint">{{ step.hint }}</p>
        </div>

        <div class="guide-footer">
          <div class="guide-dots">
            <span v-for="(_, i) in tourSteps" :key="i" class="guide-dot" :class="{ active: i === currentStep }" @click="goTo(i)" />
          </div>
          <div class="guide-nav">
            <button @click="prev" :disabled="currentStep === 0" class="guide-nav-btn">←</button>
            <button v-if="currentStep < totalSteps - 1" @click="next" class="guide-nav-btn guide-nav-next">
              Suivant →
            </button>
            <button v-else @click="finish" class="guide-nav-btn guide-nav-finish">
              🚀 Explorer
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  isDemoTourActive, demoTourStep, tourSteps,
  stopDemoTour, nextTourStep, prevTourStep,
} from '../stores/demo'

const router = useRouter()
const minimize = ref(false)

const currentStep = demoTourStep
const step = computed(() => tourSteps[currentStep.value] ?? tourSteps[0])
const totalSteps = tourSteps.length

watch(currentStep, (step) => {
  minimize.value = false
  const route = tourSteps[step]?.route
  if (route) router.push(route)
})

function next() {
  if (currentStep.value < totalSteps - 1) {
    nextTourStep()
  }
}

function prev() {
  prevTourStep()
}

function goTo(i: number) {
  currentStep.value = i
}

function stop() {
  stopDemoTour()
}

function finish() {
  if (currentStep.value < totalSteps - 1) {
    currentStep.value = totalSteps - 1
  }
  minimize.value = true
}
</script>

<style scoped>
.demo-guide {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.demo-guide-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

.demo-guide-card {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 340px;
  background: #1e293b;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  overflow: hidden;
  transition: all 0.3s ease;
}

.demo-guide-card.minimized {
  width: auto;
  height: auto;
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(99, 102, 241, 0.15);
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
}

.guide-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #818cf8;
}

.guide-header-actions {
  display: flex;
  gap: 4px;
}

.guide-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.guide-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #e2e8f0;
}

.guide-close:hover {
  color: #f87171;
}

.guide-body {
  padding: 20px 20px 12px;
}

.guide-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.guide-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 8px;
}

.guide-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 8px;
}

.guide-hint {
  font-size: 0.8rem;
  color: #6366f1;
  font-style: italic;
  margin: 0;
}

.guide-footer {
  padding: 12px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guide-dots {
  display: flex;
  gap: 5px;
}

.guide-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.25);
  cursor: pointer;
  transition: all 0.2s;
}

.guide-dot.active {
  background: #6366f1;
  transform: scale(1.3);
}

.guide-nav {
  display: flex;
  gap: 6px;
}

.guide-nav-btn {
  padding: 6px 14px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.guide-nav-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
}

.guide-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.guide-nav-next,
.guide-nav-finish {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
}

.guide-nav-next:hover,
.guide-nav-finish:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

@media (max-width: 640px) {
  .demo-guide-card {
    right: 12px;
    left: 12px;
    width: auto;
    bottom: 12px;
  }
}
</style>

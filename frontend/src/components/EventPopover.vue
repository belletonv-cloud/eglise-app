<template>
  <Teleport to="body">
    <div v-if="visible" class="event-popover-backdrop" @mousedown.self="onClose" />
    <div v-if="visible" class="event-popover" :style="popoverStyle" ref="popoverEl" tabindex="-1">
      <button class="popover-close" @click="onClose" aria-label="Fermer">✕</button>
      <div class="popover-header">
        <span class="popover-emoji">{{ event.emoji || '📌' }}</span>
        <strong class="popover-title">{{ event.title || event.titre }}</strong>
      </div>
      <div class="popover-meta">
        <span v-if="event.date || event.start_date">📅 {{ event.date || event.start_date }}</span>
        <span v-if="event.time || event.heure">🕙 {{ event.time || event.heure }}</span>
        <span v-if="event.location || event.lieu">📍 {{ event.location || event.lieu }}</span>
      </div>
      <div class="popover-desc" v-if="event.description || event.description">
        <span>{{ event.description }}</span>
      </div>
      <div class="popover-links">
        <a v-if="event.link || event.lien" :href="event.link || event.lien" class="popover-btn" target="_blank">En savoir plus</a>
        <a v-if="event.ticketUrl || event.billetterie" :href="event.ticketUrl || event.billetterie" target="_blank" class="popover-btn popover-btn-outline">🎟️ Billetterie</a>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Teleport, ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  visible: { type: Boolean, default: false },
  onClose: { type: Function, required: true },
})

const popoverEl = ref<HTMLElement|null>(null)

const popoverStyle = computed(() => ({
  position: 'fixed',
  left: props.x + 'px',
  top: props.y + 'px',
  zIndex: 9999,
  minWidth: '270px',
  maxWidth: '95vw',
}))

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') props.onClose()
}
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
watch(() => props.visible, val => {
  if (val) popoverEl.value?.focus()
})
</script>

<style scoped>
.event-popover-backdrop {
  position: fixed; inset: 0; background: transparent; z-index: 9998;
}
.event-popover {
  background: white;
  box-shadow: 0 8px 40px rgba(20,27,36,0.16); 
  border-radius: 12px;
  padding: 18px 22px 16px;
  border: 1px solid #e5e7eb;
  min-width: 250px;
  max-width: 95vw;
  min-height: 64px;
  outline: none;
  animation: popIn .23s cubic-bezier(.36,.07,.19,.97);
}
@keyframes popIn {
  0% { opacity: 0; transform: translateY(12px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.popover-close {
  position: absolute;
  top: 10px; right: 14px;
  background: none; border: none; color: #888; font-size: 1.2em;
  cursor: pointer;
}
.popover-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 7px;
}
.popover-emoji {
  font-size: 1.3em;
}
.popover-title {
  font-size: 1.08em; color: #21336b; font-weight: 700;
}
.popover-meta {
  display: flex; gap: 16px; font-size: 0.95em; color: #6466b6; margin-bottom: 6px; flex-wrap: wrap;
}
.popover-desc { font-size: 0.98em; color: #444; margin: 6px 0 2px; }
.popover-links { display: flex; gap: 8px; margin-top: 7px; flex-wrap: wrap; }
.popover-btn {
  display: inline-block; padding: 6px 16px; background: #064886;
  color: white; font-size: 0.88em; font-weight: 600;
  border-radius: 6px; text-decoration: none; transition: background 0.16s;
}
.popover-btn:hover {
  background: #053870;
}
.popover-btn-outline {
  background: transparent; border: 2px solid #064886; color: #064886;
}
.popover-btn-outline:hover {
  background: #064886; color: white;
}
@media (max-width: 650px) {
  .event-popover {
    min-width: 95vw; left: 2vw !important; right: 2vw !important; max-width: 97vw;
    top: auto !important; bottom: 0 !important;
    border-radius: 14px 14px 0 0;
    animation: popInUp .20s cubic-bezier(.36,.07,.19,.97);
  }
  @keyframes popInUp {
    0% { opacity: 0; transform: translateY(30px) scale(0.98); }
    100% { opacity:1; transform: translateY(0) scale(1); }
  }
}
</style>

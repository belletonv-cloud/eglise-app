<template>
  <div v-if="visible" :class="['toast', type]">
    <span class="toast-text">{{ message }}</span>
    <button @click="close" class="toast-close">✕</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  message: string
  type?: 'success' | 'error' | 'info'
  visible?: boolean
  duration?: number
}>(), {
  type: 'info',
  visible: false,
  duration: 3000,
})

const emit = defineEmits<{ closed: [] }>()

const visible = ref(props.visible)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (val) => {
  visible.value = val
  if (val) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false; emit('closed') }, props.duration)
  }
})

function close() {
  visible.value = false
  emit('closed')
}
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
  animation: slideIn 0.2s ease-out;
}
.toast.success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.toast.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.toast.info { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.6;
  padding: 0;
  line-height: 1;
}
.toast-close:hover { opacity: 1; }
@keyframes slideIn {
  from { transform: translateY(1rem); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
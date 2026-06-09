<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[99999] flex items-center justify-center p-4" @click.self="close" role="dialog" aria-modal="true" :aria-label="title || 'Détail événement'">
      <div class="fixed inset-0 bg-black/60" @click.self="close" />
      <div ref="contentEl" tabindex="-1" class="relative bg-white dark:bg-gray-800 w-full max-w-[780px] max-h-[90vh] rounded-xl shadow-2xl overflow-y-auto flex flex-col items-center outline-none animate-modal-in">
        <button @click="close" aria-label="Fermer" class="absolute right-3 top-3 z-10 w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xl cursor-pointer border-none transition-colors">
          ✕
        </button>
        <h2 v-if="title" class="mt-2 mb-2 px-12 text-center text-gray-800 dark:text-gray-100 text-lg font-bold leading-tight truncate max-w-full" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          {{ title }}
        </h2>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, watch, ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const contentEl = ref<HTMLElement | null>(null)

const close = () => {
  document.body.style.overflow = ''
  document.body.classList.remove('overflow-hidden')
  emit('update:modelValue', false)
  emit('close')
}

let previousActive: Element | null = null

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    previousActive = document.activeElement
    document.body.style.overflow = 'hidden'
    document.body.classList.add('overflow-hidden')
    window.addEventListener('keydown', onKey)
    await nextTick()
    contentEl.value?.focus()
  } else {
    if (previousActive && 'focus' in previousActive) {
      (previousActive as HTMLElement).focus()
    }
    previousActive = null
    document.body.style.overflow = ''
    document.body.classList.remove('overflow-hidden')
    window.removeEventListener('keydown', onKey)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
  document.body.classList.remove('overflow-hidden')
})
</script>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-in {
  animation: modal-in .23s cubic-bezier(.36,.07,.19,.97);
}
</style>

<template>
  <span class="relative inline-block align-middle">
    <button
      type="button"
      @click="show = !show"
      :aria-label="t('common.help')"
      class="px-2 py-1 hover:bg-blue-50 rounded-full text-blue-600 dark:text-blue-400 text-xl focus:outline-none focus-visible:ring"
      tabindex="0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="inline w-5 h-5 align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9.2a4 4 0 117.542 2.4c-.346.547-.829.981-1.44 1.243-.645.28-1.226.729-1.314 1.513M12 17h.01" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
    </button>
    <div
      v-if="show"
      class="absolute z-40 left-1/2 -translate-x-1/2 mt-2 w-60 max-w-xs px-3 py-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm text-left"
      @click.outside="close"
    >
      <slot>
        {{ text }}
      </slot>
    </div>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  text: { type: String, default: '' },
})

const { t } = useI18n()
const show = ref(false)
function close() { show.value = false }
</script>

<style scoped>
button:focus + div, button:active + div {
  display: block;
}
</style>
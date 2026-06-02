<template>
  <div class="relative group">
    <router-link
      :to="to"
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400"
      :class="{ 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium': active }"
    >
      <span>{{ icon }}</span>
      <slot />
    </router-link>
    <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {{ tooltip }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  to: { type: String, required: true },
  icon: { type: String, required: true },
  tooltip: { type: String, required: true },
  active: { type: Boolean, default: false }
})
</script>

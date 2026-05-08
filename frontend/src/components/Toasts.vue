<template>
  <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
    <div v-for="t in state.items" :key="t.id" :class="['px-4 py-2 rounded shadow', t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white']">
      {{ t.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../stores/toast'
const { state } = useToast()
</script>

<style scoped>
/* simple styles handled by utility classes */
</style>

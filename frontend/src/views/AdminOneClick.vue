<template>
  <div>
    <h1 class="text-xl font-bold mb-4">One-click action</h1>
    <div v-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <p>Action: <strong>{{ actionLabel }}</strong></p>
      <div class="mt-4">
        <button @click="confirm" :disabled="loading" class="px-3 py-2 bg-red-600 text-white rounded">Confirmer</button>
        <button @click="cancel" :disabled="loading" class="ml-2 px-3 py-2 bg-gray-200 rounded">Annuler</button>
      </div>
      <div v-if="result" class="mt-4 text-green-600">{{ resultMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'

const route = useRoute()
const router = useRouter()
const token = ref(null)
const loading = ref(false)
const error = ref(null)
const result = ref(null)
const actionLabel = ref('')

onMounted(() => {
  token.value = route.query.token
  if (!token.value) error.value = 'Token manquant'
  else actionLabel.value = 'Annuler l\'assignation existante'
})

async function confirm() {
  if (!token.value) return
  loading.value = true
  try {
    const res = await api.sendOneClick(token.value)
    result.value = res
  } catch (e) {
    error.value = e.message || JSON.stringify(e)
  } finally { loading.value = false }
}

function cancel() { router.push({ name: 'conflicts' }) }
</script>

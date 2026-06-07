<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{{ $t('adminOneClick.title') }}</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-6">
      {{ $t('adminOneClick.token_help') || "Cette page est normalement ouverte via un lien email contenant ?token=..." }}
    </p>

    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Token</label>
      <input
        v-model="token"
        class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
        placeholder="colle ici le token (depuis l'URL ou l'email)"
      />

      <div v-if="tokenMissing" class="mt-3 text-sm text-amber-700 dark:text-amber-300">
        {{ $t('adminOneClick.token_missing') }}
      </div>

      <div v-if="error" class="mt-3 text-sm text-red-600">
        {{ $t('adminOneClick.result_error', { msg: error }) }}
      </div>

      <div v-if="result" class="mt-3 text-sm text-green-600 font-medium">
        {{ $t('adminOneClick.result_success') }}
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button
          @click="confirm"
          :disabled="loading || tokenMissing"
          class="px-3 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
        >
          {{ loading ? ($t('loading') || 'Chargement...') : $t('adminOneClick.confirm') }}
        </button>
        <button
          @click="cancel"
          :disabled="loading"
          class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg"
        >
          {{ $t('adminOneClick.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const token = ref('')
const loading = ref(false)
const error = ref(null)
const result = ref(false)

const tokenMissing = computed(() => !token.value || !String(token.value).trim())

onMounted(() => {
  token.value = String(route.query.token || '')
})

async function confirm() {
  if (tokenMissing.value) return
  loading.value = true
  error.value = null
  result.value = false
  try {
    await api.sendOneClick({ token: String(token.value).trim() })
    result.value = true
  } catch (e) {
    error.value = e?.message || JSON.stringify(e)
  } finally {
    loading.value = false
  }
}

function cancel() {
  router.push({ name: 'conflicts' })
}
</script>

<template>
  <div>
    <h1 class="text-xl font-bold mb-4">{{$t('adminOneClick.title')}}</h1>
    <div v-if="error" class="text-red-600">{{$t('adminOneClick.result_error', { msg: error })}}</div>
    <div v-else>
      <p>{{$t('adminOneClick.action')}}: <strong>{{$t('adminOneClick.action_label')}}</strong></p>
      <div class="mt-4">
        <button @click="confirm" :disabled="loading" class="px-3 py-2 bg-red-600 text-white rounded">{{$t('adminOneClick.confirm')}}</button>
        <button @click="cancel" :disabled="loading" class="ml-2 px-3 py-2 bg-gray-200 rounded">{{$t('adminOneClick.cancel')}}</button>
      </div>
      <div v-if="result" class="mt-4 text-green-600">{{$t('adminOneClick.result_success')}}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const token = ref(null)
const loading = ref(false)
const error = ref(null)
const result = ref(null)

onMounted(() => {
  token.value = route.query.token
  if (!token.value) error.value = t('adminOneClick.token_missing')
})

async function confirm() {
  if (!token.value) return
  loading.value = true
  error.value = null
  try {
    await api.sendOneClick(token.value)
    result.value = true
  } catch (e) {
    error.value = e.message || JSON.stringify(e)
  } finally { loading.value = false }
}

function cancel() { router.push({ name: 'conflicts' }) }
</script>

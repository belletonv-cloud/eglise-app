<template>
  <div class="max-w-md mx-auto mt-12">
    <div v-if="loading" class="text-center py-12 text-gray-500">Vérification de l'invitation...</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-6 rounded-xl">
      <h2 class="text-lg font-bold mb-2">Lien invalide</h2>
      <p>{{ error }}</p>
    </div>
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Bienvenue {{ invite?.first_name }} !</h1>
      <p class="text-gray-500 mb-6">Tu es invité(e) à rejoindre l'application Église en tant que {{ invite?.first_name }} {{ invite?.last_name }} ({{ invite?.email }}).</p>
      <p class="text-sm text-gray-400 mb-6">Connecte-toi avec ton compte Google pour lier ton profil.</p>
      <button @click="redeem"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        Se connecter avec Google
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { loginWithGoogle, user } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const invite = ref<any>(null)

onMounted(async () => {
  const token = route.query.token as string
  if (!token) { error.value = 'Token manquant'; loading.value = false; return }
  try {
    invite.value = await api.getInvitation(token)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const redeem = async () => {
  if (!user.value) {
    await loginWithGoogle()
  }
  if (!user.value) return
  const token = route.query.token as string
  try {
    const firebaseUid = user.value.uid || user.value.email || 'unknown'
    await api.redeemInvitation(token, firebaseUid)
    router.push('/mon-compte')
  } catch (e: any) {
    error.value = e.message || 'Erreur lors de la liaison du compte'
  }
}
</script>

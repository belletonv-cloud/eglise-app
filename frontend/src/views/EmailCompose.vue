<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Envoyer un email
      <router-link to="/email-templates" class="text-sm font-normal text-blue-600 hover:underline ml-4">Gérer les modèles</router-link>
    </h1>

    <form @submit.prevent="sendEmail" class="space-y-4 bg-white p-6 rounded-lg shadow">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Destinataire (email)</label>
        <input
          v-model="form.recipient_email"
          type="email"
          required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="contact@exemple.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
        <input
          v-model="form.subject"
          type="text"
          required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Objet de l'email"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message (HTML)</label>
        <textarea
          v-model="form.body"
          required
          rows="8"
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="<p>Votre message ici...</p>"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">Tu peux utiliser des balises HTML simples.</p>
      </div>

      <div class="flex items-center gap-4">
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Envoi en cours...' : 'Envoyer' }}
        </button>
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Réinitialiser
        </button>
      </div>

      <div v-if="result" :class="['p-4 rounded-lg', result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800']">
        <p class="font-medium">{{ result.success ? 'Email envoyé avec succès' : 'Erreur lors de l\'envoi' }}</p>
        <p v-if="result?.error" class="text-sm mt-1">{{ result.error }}</p>
        <p v-if="result?.status" class="text-sm mt-1">Statut: {{ result.status }}</p>
      </div>
    </form>

    <div class="mt-8">
      <h2 class="text-lg font-semibold mb-3">Logs d'emails récents</h2>
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Destinataire</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Sujet</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 text-sm">{{ log.recipient_email }}</td>
              <td class="px-4 py-2 text-sm truncate max-w-xs">{{ log.subject }}</td>
              <td class="px-4 py-2">
                <span :class="['px-2 py-1 text-xs rounded-full', log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                  {{ log.status }}
                </span>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="3" class="px-4 py-4 text-center text-gray-500">Aucun email envoyé</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const form = ref({
  recipient_email: '',
  subject: '',
  body: '',
})

const loading = ref(false)
const result = ref<{ success: boolean; error?: string; status?: string } | null>(null)
const logs = ref<any[]>([])

async function loadLogs() {
  try {
    logs.value = await api.getEmailLogs()
    logs.value = logs.value.slice(-10).reverse()
  } catch (e) {
    console.error('Failed to load logs:', e)
  }
}

async function sendEmail() {
  loading.value = true
  result.value = null
  try {
    const res = await api.sendEmail(form.value)
    result.value = res
    if (res.success) {
      resetForm()
      await loadLogs()
    }
  } catch (e: any) {
    result.value = { success: false, error: e.message }
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = { recipient_email: '', subject: '', body: '' }
}

onMounted(loadLogs)
</script>
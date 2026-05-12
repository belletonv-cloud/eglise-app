<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Envoyer un email
      <router-link to="/email-templates" class="text-sm font-normal text-blue-600 hover:underline ml-4">Gérer les modèles</router-link>
    </h1>

    <form @submit.prevent="sendEmail" class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de destinataire</label>
        <select v-model="recipientType" @change="onRecipientTypeChange"
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
          <option value="single">Un seul destinataire</option>
          <option value="team">Toute une équipe</option>
          <option value="plan">Tous les planifiés d'un service</option>
        </select>
      </div>

      <div v-if="recipientType === 'single'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destinataire (email)</label>
        <input v-model="form.recipient_email" type="email" required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="contact@exemple.com" />
      </div>

      <div v-else-if="recipientType === 'team'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Équipe</label>
        <select v-model="bulkTeamId" required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
          <option :value="null">Sélectionner...</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }} ({{ t.member_count || '?' }} membres)</option>
        </select>
      </div>

      <div v-else-if="recipientType === 'plan'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
        <select v-model="bulkPlanId" required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
          <option :value="null">Sélectionner...</option>
          <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.date }} - {{ p.service_type_name || 'Service' }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sujet</label>
        <input v-model="form.subject" type="text" required
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="Objet de l'email" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (HTML)</label>
        <textarea v-model="form.body" required rows="8"
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="<p>Votre message ici...</p>"></textarea>
        <p class="text-xs text-gray-500 mt-1">Tu peux utiliser des balises HTML simples.</p>
      </div>

      <div class="flex items-center gap-4">
        <button type="submit" :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
          {{ loading ? 'Envoi en cours...' : (recipientType === 'single' ? 'Envoyer' : 'Envoyer en masse') }}
        </button>
        <button type="button" @click="resetForm"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
          Réinitialiser
        </button>
      </div>

      <div v-if="result" :class="['p-4 rounded-lg', result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800']">
        <p class="font-medium">{{ result.success ? result.msg : 'Erreur' }}</p>
        <p v-if="result.error" class="text-sm mt-1">{{ result.error }}</p>
        <ul v-if="result.errors?.length" class="text-sm mt-2">
          <li v-for="e in result.errors" :key="e">{{ e }}</li>
        </ul>
      </div>
    </form>

    <div class="mt-8">
      <h2 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Logs d'emails récents</h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Destinataire</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Sujet</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{{ log.recipient_email }}</td>
              <td class="px-4 py-2 text-sm truncate max-w-xs text-gray-800 dark:text-gray-200">{{ log.subject }}</td>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const recipientType = ref('single')
const bulkTeamId = ref<number | null>(null)
const bulkPlanId = ref<number | null>(null)
const teams = ref<any[]>([])
const plans = ref<any[]>([])

const form = ref({ recipient_email: '', subject: '', body: '' })
const loading = ref(false)
const result = ref<{ success: boolean; msg: string; error?: string; errors?: string[] } | null>(null)
const logs = ref<any[]>([])

async function loadData() {
  try {
    const [t, p, l] = await Promise.all([
      api.getTeams(),
      api.getPlans(),
      api.getEmailLogs(),
    ])
    teams.value = t
    plans.value = p
    logs.value = l.slice(-10).reverse()
  } catch { /* ignore */ }
}

function onRecipientTypeChange() {
  form.value.recipient_email = ''
}

async function sendEmail() {
  loading.value = true
  result.value = null
  try {
    if (recipientType.value === 'single') {
      const res = await api.sendEmail(form.value)
      result.value = { success: res.success, msg: res.success ? 'Email envoyé' : 'Échec', error: (res as any).error }
      if (res.success) { resetForm(); await loadData() }
    } else {
      if (!bulkTeamId.value && !bulkPlanId.value) return
      const res = await api.sendBulkEmail({
        subject: form.value.subject,
        body: form.value.body,
        team_id: bulkTeamId.value || undefined,
        plan_id: bulkPlanId.value || undefined,
      })
      result.value = {
        success: res.failed === 0,
        msg: `${res.sent} envoyé(s), ${res.failed} échec(s)`,
        errors: res.errors,
      }
      if (res.sent > 0) { resetForm(); await loadData() }
    }
  } catch (e: any) {
    result.value = { success: false, msg: 'Erreur', error: e.message }
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = { recipient_email: '', subject: '', body: '' }
  bulkTeamId.value = null
  bulkPlanId.value = null
}

onMounted(loadData)
</script>
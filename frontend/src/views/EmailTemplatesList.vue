<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Modèles d'emails</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        + Nouveau modèle
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="t in templates" :key="t.id"
        @click="goToTemplate(t.id)"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ t.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ t.subject }}</p>
            <p class="text-xs text-gray-400 mt-2">
              {{ t.usage_count || 0 }} utilisation(s)
            </p>
          </div>
          <div class="flex gap-2">
            <button @click.stop="sendTest(t.id)" 
              class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              Test
            </button>
            <button @click.stop="deleteTemplate(t.id)"
              class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div v-if="templates.length === 0" class="text-center py-12 text-gray-400">
        Aucun modèle d'email pour le moment.
      </div>
    </div>

    <!-- Modal Nouveau Modèle -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
        <h3 class="text-lg font-bold mb-4">Nouveau modèle d'email</h3>
        <form @submit.prevent="createTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom du modèle *</label>
            <input v-model="form.name" required placeholder="ex: Newsletter hebdomadaire"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Objet *</label>
            <input v-model="form.subject" required placeholder="ex: Bienvenue {{first_name}} !"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Corps du message (HTML) *</label>
            <textarea v-model="form.body" required rows="8" placeholder="<p>Bonjour {{first_name}},</p>..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Variables disponibles</label>
            <input v-model="form.variables" placeholder="ex: first_name, last_name, church_name"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <p class="text-xs text-gray-400 mt-1">Séparer par des virgules. Utiliser [variable] dans le modèle.</p>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'
import { confirmDialog } from '../stores/confirm'

const router = useRouter()
const templates = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({ name: '', subject: '', body: '', variables: '' })

const loadData = async () => {
  try {
    templates.value = await api.getEmailTemplates()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const createTemplate = async () => {
  if (!form.value.name || !form.value.subject || !form.value.body) return
  try {
    await api.createEmailTemplate({
      name: form.value.name,
      subject: form.value.subject,
      body: form.value.body,
      variables: form.value.variables ? form.value.variables.split(',').map((v: string) => v.trim()).join(',') : undefined
    })
    showForm.value = false
    form.value = { name: '', subject: '', body: '', variables: '' }
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const goToTemplate = (id: number) => {
  router.push({ name: 'email-compose' })
}

const deleteTemplate = async (id: number) => {
  if (!await confirmDialog('Supprimer ce modèle ?')) return
  try {
    await api.deleteEmailTemplate(id)
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const sendTest = async (id: number) => {
  const template = templates.value.find((t) => t.id === id)
  if (!template) return showToast('Modèle introuvable', 'error')
  const email = prompt('Adresse email pour le test :', '')
  if (!email) return
  try {
    await api.sendEmail({
      recipient_email: email,
      subject: template.subject,
      body: template.body,
      template_id: id,
    })
    showToast('Email de test envoyé !', 'success')
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

onMounted(loadData)
</script>

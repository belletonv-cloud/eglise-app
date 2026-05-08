<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Planning des Services</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        + Nouveau service
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>

    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="plan in plans" :key="plan.id"
        @click="goToPlan(plan.id)"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-center min-w-[60px]">
              <div class="text-lg font-bold text-gray-800">{{ formatDay(plan.date) }}</div>
              <div class="text-xs text-gray-500">{{ formatMonth(plan.date) }}</div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">{{ plan.service_type_name || 'Service' }}</h3>
              <p class="text-sm text-gray-500">
                {{ plan.date }} <span v-if="plan.time">à {{ plan.time }}</span>
              </p>
              <p v-if="plan.theme" class="text-sm text-gray-600 italic">« {{ plan.theme }} »</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-sm text-gray-500">
            <span>{{ plan.items_count || 0 }} éléments</span>
            <span>·</span>
            <span>{{ plan.people_count || 0 }} personnes</span>
            <span :class="statusClass(plan.status)" class="ml-2 px-2 py-1 rounded-full text-xs font-medium">
              {{ statusLabel(plan.status) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="plans.length === 0" class="text-center py-12 text-gray-400">
        Aucun service planifié pour le moment.
      </div>
    </div>

    <!-- Modal Nouveau Service -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">Nouveau service</h3>
        <form @submit.prevent="createPlan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
            <select v-model="form.service_type_id" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Sélectionner...</option>
              <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input v-model="form.date" type="date" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Heure</label>
              <input v-model="form.time" type="time"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Thème (optionnel)</label>
            <input v-model="form.theme" type="text" placeholder="Thème du service"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea v-model="form.notes" rows="2" placeholder="Notes..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">Créer</button>
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

const router = useRouter()
const plans = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({ service_type_id: '', date: '', time: '10:00', theme: '', notes: '' })

const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const formatDay = (d: string) => d ? new Date(d + 'T12:00:00').getDate().toString().padStart(2, '0') : ''
const formatMonth = (d: string) => d ? months[new Date(d + 'T12:00:00').getMonth()] : ''

const statusLabel = (s: string) => ({ planned: 'Planifié', completed: 'Terminé', cancelled: 'Annulé' })[s] || s
const statusClass = (s: string) => s === 'completed' ? 'bg-green-100 text-green-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'

const goToPlan = (id: number) => router.push({ name: 'plan-detail', params: { id: id.toString() } })

const createPlan = async () => {
  await api.createPlan({
    service_type_id: Number(form.value.service_type_id),
    date: form.value.date,
    time: form.value.time,
    theme: form.value.theme,
    notes: form.value.notes,
  })
  showForm.value = false
  form.value = { service_type_id: '', date: '', time: '10:00', theme: '', notes: '' }
  loadData()
}

const loadData = async () => {
  try {
    const [p, st] = await Promise.all([api.getPlans(), api.getServiceTypes()])
    plans.value = p
    serviceTypes.value = st
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

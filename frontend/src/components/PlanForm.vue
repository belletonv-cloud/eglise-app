<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
      <h3 class="text-xl font-bold mb-4">
        {{ editing ? 'Modifier le service' : 'Nouveau service' }}
      </h3>
      <form @submit.prevent="save" class="space-y-4">
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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
          <select v-model="form.service_type_id"
            class="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option :value="undefined">Aucun</option>
            <option v-for="st in serviceTypes" :key="st.id" :value="st.id">{{ st.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Thème</label>
          <input v-model="form.theme"
            class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea v-model="form.notes" rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
          <button type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            {{ editing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const props = defineProps<{ date?: string; plan?: any }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const editing = !!props.plan
const serviceTypes = ref<any[]>([])
const form = ref({
  date: props.date || '',
  time: '',
  service_type_id: undefined as number | undefined,
  theme: '',
  notes: '',
})

const save = async () => {
  if (editing) {
    await api.updatePlan(props.plan.id, form.value)
  } else {
    await api.createPlan(form.value)
  }
  emit('saved')
}

onMounted(async () => {
  try {
    { const r = await api.getServiceTypes(); serviceTypes.value = r.data ?? r; }
  } catch { console.warn('PlanForm getServiceTypes failed') }
  if (props.plan) {
    form.value = {
      date: props.plan.date?.slice(0, 10) || '',
      time: props.plan.time || '',
      service_type_id: props.plan.service_type_id,
      theme: props.plan.theme || '',
      notes: props.plan.notes || '',
    }
  }
})
</script>

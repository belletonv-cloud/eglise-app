<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Présents ({{ attendances.length }})</h3>
      <button @click="showAdd = true"
        class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 cursor-pointer">
        + Check-in
      </button>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500">Chargement...</div>

    <div v-else-if="attendances.length" class="space-y-2">
      <div v-for="a in attendances" :key="a.id"
        class="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50">
        <div>
          <span class="font-medium text-gray-800">{{ a.first_name }} {{ a.last_name }}</span>
          <span class="text-xs text-gray-400 ml-2">{{ formatTime(a.check_in_time) }}</span>
        </div>
        <button @click="remove(a.id)"
          class="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
      </div>
    </div>

    <div v-else class="text-center py-6 text-gray-400">
      Aucun check-in pour le moment.
    </div>

    <!-- Modal ajout check-in -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAdd = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h4 class="text-lg font-bold mb-4">Check-in manuel</h4>
        <form @submit.prevent="addAttendance" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Membre</label>
            <select v-model="newAttendance.member_id" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="" disabled>Sélectionner...</option>
              <option v-for="m in availableMembers" :key="m.id" :value="m.id">
                {{ m.first_name }} {{ m.last_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select v-model="newAttendance.status"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="present">Présent</option>
              <option value="late">En retard</option>
              <option value="excused">Excusé</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showAdd = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              Check-in
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'
import { confirmDialog } from '../stores/confirm'

const props = defineProps<{ planId: number }>()
const emit = defineEmits<{ changed: [] }>()

const attendances = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)
const showAdd = ref(false)
const newAttendance = ref({ member_id: '', status: 'present' })
const availableMembers = ref<any[]>([])

const formatTime = (t: string) => {
  return t ? new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
}

const loadAttendances = async () => {
  try {
    attendances.value = await api.getPlanAttendances(props.planId)
    const attendanceIds = new Set(attendances.value.map((a: any) => a.member_id))
    availableMembers.value = members.value.filter((m: any) => !attendanceIds.has(m.id))
  } catch { console.warn('AttendanceSection filter failed') } finally {
    loading.value = false
  }
}

const addAttendance = async () => {
  if (!newAttendance.value.member_id) return
  try {
    await api.createAttendance({
      plan_id: props.planId,
      member_id: parseInt(newAttendance.value.member_id),
      status: newAttendance.value.status,
    })
    showAdd.value = false
    newAttendance.value = { member_id: '', status: 'present' }
    loadAttendances()
    emit('changed')
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const remove = async (id: number) => {
  if (!await confirmDialog('Supprimer ce check-in ?')) return
  await api.deleteAttendance(id)
  loadAttendances()
  emit('changed')
}

onMounted(async () => {
  try {
    members.value = await api.getMembers()
  } catch { console.warn('AttendanceSection getMembers failed') }
  loadAttendances()
})
</script>

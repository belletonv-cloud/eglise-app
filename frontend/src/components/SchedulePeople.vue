<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Bénévoles ({{ people.length }})</h3>
      <button @click="showAdd = true"
        class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
        + Ajouter
      </button>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500">Chargement...</div>
    <table v-else-if="people.length" class="w-full">
      <thead class="border-b border-gray-200">
        <tr>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">Nom</th>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">Rôle</th>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">Statut</th>
          <th class="text-right px-3 py-2 text-sm font-medium text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="p in people" :key="p.id" class="hover:bg-gray-50">
          <td class="px-3 py-2.5 text-sm font-medium text-gray-800">{{ p.first_name }} {{ p.last_name }}</td>
          <td class="px-3 py-2.5 text-sm text-gray-600">{{ p.position || '-' }}</td>
          <td class="px-3 py-2.5">
            <select :value="p.status" @change="updateStatus(p, ($event.target as HTMLSelectElement).value)"
              class="text-xs border border-gray-300 rounded px-2 py-1">
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="declined">Decliné</option>
            </select>
          </td>
          <td class="px-3 py-2.5 text-right">
            <button @click="remove(p)"
              class="text-red-600 hover:text-red-800 text-sm cursor-pointer">Retirer</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center py-6 text-gray-400">Aucun bénévole planifié.</div>

    <div v-if="showAdd" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAdd = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h4 class="text-lg font-bold mb-4">Ajouter un bénévole</h4>
        <form @submit.prevent="addPerson" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Membre</label>
            <select v-model="newPerson.member_id" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="" disabled>Choisir...</option>
              <option v-for="m in availableMembers" :key="m.id" :value="m.id">
                {{ m.first_name }} {{ m.last_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <input v-model="newPerson.position" placeholder="leader, musicien, son..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
            <select v-model="newPerson.team_id"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option :value="undefined">Aucune</option>
              <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showAdd = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import { useToast } from '../stores/toast'

const props = defineProps<{ planId: number }>()
const emit = defineEmits<{ changed: [] }>()

const people = ref<any[]>([])
const members = ref<any[]>([])
const teams = ref<any[]>([])
const loading = ref(true)
const showAdd = ref(false)
const newPerson = ref({ member_id: '', position: '', team_id: undefined as number | undefined })

const availableMembers = ref<any[]>([])

const loadPeople = async () => {
  try {
    loading.value = true
    people.value = await api.getPlanPeople(props.planId)
    const scheduledIds = new Set(people.value.map((p: any) => p.member_id))
    availableMembers.value = members.value.filter((m: any) => !scheduledIds.has(m.id))
  } catch {} finally {
    loading.value = false
  }
}

const updateStatus = async (p: any, status: string) => {
  await api.updateSchedule(props.planId, p.id, { status })
  p.status = status
  emit('changed')
}

const { show } = useToast()

const addPerson = async () => {
  try {
    await api.schedulePerson(props.planId, {
      member_id: parseInt(newPerson.value.member_id),
      position: newPerson.value.position || undefined,
      team_id: newPerson.value.team_id || undefined,
    })
    show('Bénévole ajouté', 'success')
    showAdd.value = false
    newPerson.value = { member_id: '', position: '', team_id: undefined }
    loadPeople()
  } catch (e: any) {
    // If conflict (409), allow forcing the scheduling
    if ((e as any).status === 409) {
      const ok = await confirmDialog('Conflit détecté: ce membre est déjà planifié pour ce service. Forcer l\'ajout ?')
      if (ok) {
        try {
          await api.schedulePerson(props.planId, {
            member_id: parseInt(newPerson.value.member_id),
            position: newPerson.value.position || undefined,
            team_id: newPerson.value.team_id || undefined,
            force: true,
          })
          show('Bénévole ajouté malgré le conflit', 'success')
          showAdd.value = false
          newPerson.value = { member_id: '', position: '', team_id: undefined }
          loadPeople()
        } catch (err: any) {
          show(err.message || 'Erreur', 'error')
        }
      }
    } else {
      show(e.message || 'Erreur', 'error')
    }
  }
}

const remove = async (p: any) => {
  if (!await confirmDialog(`Retirer ${p.first_name} ${p.last_name} ?`)) return
  await api.removeSchedule(props.planId, p.id)
  loadPeople()
}

onMounted(async () => {
  try {
    ;[members.value, teams.value] = await Promise.all([api.getMembers(), api.getTeams()])
  } catch {}
  loadPeople()
})
</script>

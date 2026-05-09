<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Membres ({{ members.length }})</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        + Ajouter un membre
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Chargement...</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 flex items-center gap-3">
        <label class="text-sm text-gray-600">Filtrer par ministère :</label>
        <select v-model="selectedTeam" class="border px-2 py-1 rounded">
          <option :value="null">Tous</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Nom</th>
            <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
            <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Téléphone</th>
            <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
            <th class="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in filteredMembers" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ m.first_name }} {{ m.last_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ m.email || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ m.phone || '-' }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-col gap-2">
                <span :class="typeClass(m.membership_type)"
                  class="px-2 py-1 rounded-full text-xs font-medium inline-block w-max">
                  {{ typeLabel(m.membership_type) }}
                </span>
                <div v-if="m.teams && m.teams.length > 0" class="flex flex-wrap gap-2 mt-1">
                  <span v-for="t in m.teams" :key="t.id" class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                    {{ t.name }}<span v-if="t.position"> · {{ t.position }}</span>
                  </span>
                </div>
                <div v-else class="text-xs text-gray-400">Aucun ministère</div>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="editMember(m)"
                class="text-blue-600 hover:text-blue-800 text-sm mr-3 cursor-pointer">Modifier</button>
              <button @click="deleteMember(m.id)"
                class="text-red-600 hover:text-red-800 text-sm cursor-pointer">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="members.length === 0" class="text-center py-12 text-gray-400">
        Aucun membre.
      </div>
    </div>

    <!-- Modal Ajouter/Modifier -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">{{ editing ? 'Modifier' : 'Ajouter' }} un membre</h3>
        <form @submit.prevent="saveMember" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input v-model="form.first_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input v-model="form.last_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="form.email" type="email"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input v-model="form.phone" type="tel"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type de membre</label>
            <select v-model="form.membership_type"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="guest">Invité</option>
              <option value="member">Membre</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Annuler</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ editing ? 'Enregistrer' : 'Ajouter' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'

const members = ref<any[]>([])
const teams = ref<any[]>([])
const selectedTeam = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const editing = ref<number | null>(null)
const form = ref({ first_name: '', last_name: '', email: '', phone: '', membership_type: 'guest' })

const typeLabel = (t: string) => ({ member: 'Membre', guest: 'Invité', inactive: 'Inactif' })[t] || t
const typeClass = (t: string) => t === 'member' ? 'bg-green-100 text-green-700' : t === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'

const editMember = (m: any) => {
  editing.value = m.id
  form.value = { first_name: m.first_name, last_name: m.last_name, email: m.email || '', phone: m.phone || '', membership_type: m.membership_type }
  showForm.value = true
}

const deleteMember = async (id: number) => {
  if (!await confirmDialog('Supprimer ce membre ?')) return
  await api.deleteMember(id)
  loadData()
}

const saveMember = async () => {
  if (editing.value) {
    await api.updateMember(editing.value, form.value)
  } else {
    await api.createMember(form.value)
  }
  showForm.value = false
  editing.value = null
  form.value = { first_name: '', last_name: '', email: '', phone: '', membership_type: 'guest' }
  loadData()
}

const loadData = async () => {
  try {
    members.value = await api.getMembers()
    teams.value = await api.getTeams()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

  onMounted(loadData)

const filteredMembers = computed(() => {
  if (!selectedTeam.value) return members.value
  return members.value.filter(m => (m.teams || []).some((t: any) => t.id === selectedTeam.value))
})
</script>

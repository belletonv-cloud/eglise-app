<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Administration des membres</h1>

    <div class="mb-6">
      <div class="flex gap-2 mb-4">
        <button @click="tab = 'roles'" :class="tab === 'roles' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-lg cursor-pointer">Rôles & Permissions</button>
        <button @click="tab = 'rbac'" :class="tab === 'rbac' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-lg cursor-pointer">Permissions par ressource</button>
      </div>

      <!-- Roles tab -->
      <div v-if="tab === 'roles'">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <label class="text-sm sm:text-base">Rechercher :</label>
          <input v-model="q" placeholder="Nom" class="border px-2 py-1 rounded w-full sm:w-auto" />
        </div>

        <div class="overflow-x-auto">
        <table class="w-full bg-white rounded shadow">
          <thead><tr><th class="p-2">Nom</th><th class="p-2">Email</th><th class="p-2">Rôle</th><th class="p-2">Exceptions</th></tr></thead>
          <tbody>
            <tr v-for="m in filtered" :key="m.id" class="border-b">
              <td class="p-2">{{ m.first_name }} {{ m.last_name }}</td>
              <td class="p-2">{{ m.email }}</td>
              <td class="p-2">
                <select v-model="m.role" @change="updateRole(m)" class="border px-2 py-1">
                  <option value="viewer">viewer</option>
                  <option value="volunteer">volunteer</option>
                  <option value="editor">editor</option>
                  <option value="scheduler">scheduler</option>
                  <option value="music_director">music_director</option>
                  <option value="tech_director">tech_director</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td class="p-2">
                <ul>
                  <li v-for="e in exceptionsByMember[m.id] || []" :key="e.id">{{ e.permission }} — {{ e.granted ? 'granted' : 'denied' }} <button @click="removeException(e.id)" class="text-red-500 cursor-pointer">x</button></li>
                </ul>
                <div class="mt-2 flex flex-wrap gap-2">
                  <input v-model="newPermission[m.id]" placeholder="permission" class="border px-2 py-1 text-sm" />
                  <select v-model="newGranted[m.id]" class="border px-2 py-1 text-sm"><option :value="true">grant</option><option :value="false">deny</option></select>
                  <button @click="addException(m.id)" class="px-2 py-1 bg-blue-500 text-white rounded text-sm cursor-pointer">Ajouter</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- RBAC tab -->
      <div v-if="tab === 'rbac'">
        <div class="mb-4 flex gap-2 items-center">
          <select v-model="rbacForm.resource_type" class="border px-3 py-2 rounded">
            <option value="">Type de ressource...</option>
            <option value="plan">Plan (service)</option>
            <option value="song">Chant</option>
            <option value="arrangement">Arrangement</option>
            <option value="team">Équipe</option>
          </select>
          <input v-model="rbacForm.resource_id" type="number" placeholder="ID ressource" class="border px-3 py-2 rounded w-24" />
          <select v-model="rbacForm.member_id" class="border px-3 py-2 rounded">
            <option value="">Membre...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">{{ m.first_name }} {{ m.last_name }}</option>
          </select>
          <select v-model="rbacForm.permission" class="border px-3 py-2 rounded">
            <option value="">Permission...</option>
            <option value="view">Voir</option>
            <option value="edit">Modifier</option>
            <option value="schedule">Planifier</option>
            <option value="admin">Admin</option>
          </select>
          <button @click="addResourcePermission" :disabled="!canAddRbac" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer">Ajouter</button>
        </div>

        <div class="overflow-x-auto">
        <table class="w-full bg-white rounded shadow">
          <thead><tr><th class="p-2">Membre</th><th class="p-2">Ressource</th><th class="p-2">ID</th><th class="p-2">Permission</th><th class="p-2">Accès</th><th class="p-2"></th></tr></thead>
          <tbody>
            <tr v-for="p in resourcePerms" :key="p.id" class="border-b">
              <td class="p-2">{{ memberName(p.member_id) }}</td>
              <td class="p-2">{{ p.resource_type }}</td>
              <td class="p-2">{{ p.resource_id }}</td>
              <td class="p-2">{{ p.permission }}</td>
              <td class="p-2">
                <span :class="p.granted ? 'text-green-600' : 'text-red-600'">{{ p.granted ? 'Autorisé' : 'Refusé' }}</span>
              </td>
              <td class="p-2">
                <button @click="removeResourcePermission(p.id)" class="text-red-500 cursor-pointer">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'

const tab = ref('roles')
const q = ref('')
const members = ref([])
const exceptions = ref([])
const resourcePerms = ref([])
const newPermission = ref({})
const newGranted = ref({})
const rbacForm = ref({ resource_type: '', resource_id: '', member_id: '', permission: '' })

async function load() {
  members.value = await api.getMembers()
  exceptions.value = await api.getMemberExceptions()
  resourcePerms.value = await api.getResourcePermissions()
}

onMounted(load)

const filtered = computed(() => members.value.filter(m => (m.first_name + ' ' + m.last_name).toLowerCase().includes(q.value.toLowerCase())))

const canAddRbac = computed(() =>
  rbacForm.value.resource_type && rbacForm.value.resource_id && rbacForm.value.member_id && rbacForm.value.permission
)

const memberName = (id) => {
  const m = members.value.find(m => m.id === id)
  return m ? `${m.first_name} ${m.last_name}` : `#${id}`
}

const exceptionsByMember = computed(() => {
  const map = {}
  for (const e of exceptions.value) {
    map[e.member_id] = map[e.member_id] || []
    map[e.member_id].push(e)
  }
  return map
})

async function addException(memberId) {
  const perm = newPermission.value[memberId]
  const granted = newGranted.value[memberId]
  if (!perm) return alert('permission required')
  await api.createMemberException({ member_id: memberId, permission: perm, granted: granted === true || granted === 'true' })
  await load()
}

async function removeException(id) {
  await api.deleteMemberException(id)
  await load()
}

async function updateRole(m) {
  await api.updateMemberRole(m.id, { role: m.role })
}

async function addResourcePermission() {
  if (!canAddRbac.value) return
  await api.createResourcePermission({
    member_id: Number(rbacForm.value.member_id),
    resource_type: rbacForm.value.resource_type,
    resource_id: Number(rbacForm.value.resource_id),
    permission: rbacForm.value.permission,
    granted: true,
  })
  rbacForm.value = { resource_type: '', resource_id: '', member_id: '', permission: '' }
  await load()
}

async function removeResourcePermission(id) {
  if (!confirm('Supprimer cette permission ?')) return
  await api.deleteResourcePermission(id)
  await load()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Administration des membres</h1>
    <div class="mb-4">
      <label class="mr-2">Rechercher :</label>
      <input v-model="q" placeholder="Nom" class="border px-2 py-1" />
    </div>

    <table class="w-full bg-white rounded shadow">
      <thead><tr><th class="p-2">Nom</th><th class="p-2">Email</th><th class="p-2">Rôle</th><th class="p-2">Exceptions</th></tr></thead>
      <tbody>
        <tr v-for="m in filtered" :key="m.id" class="border-b">
          <td class="p-2">{{ m.first_name }} {{ m.last_name }}</td>
          <td class="p-2">{{ m.email }}</td>
          <td class="p-2">
            <select v-model="m.role" @change="updateRole(m)" class="border px-2 py-1">
              <option value="member">member</option>
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="scheduler">scheduler</option>
              <option value="admin">admin</option>
            </select>
          </td>
          <td class="p-2">
            <ul>
              <li v-for="e in exceptionsByMember[m.id] || []" :key="e.id">{{ e.permission }} — {{ e.granted ? 'granted' : 'denied' }} <button @click="removeException(e.id)" class="text-red-500">x</button></li>
            </ul>
            <div class="mt-2 flex gap-2">
              <input v-model="newPermission[m.id]" placeholder="permission" class="border px-2 py-1" />
              <select v-model="newGranted[m.id]" class="border px-2 py-1"><option :value="true">grant</option><option :value="false">deny</option></select>
              <button @click="addException(m.id)" class="px-2 py-1 bg-blue-500 text-white rounded">Ajouter</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../utils/api'

const q = ref('')
const members = ref([])
const exceptions = ref([])
const newPermission = ref({})
const newGranted = ref({})

async function load() {
  members.value = await api.getMembers()
  exceptions.value = await api.getMemberExceptions()
}

onMounted(load)

const filtered = computed(() => members.value.filter(m => (m.first_name + ' ' + m.last_name).toLowerCase().includes(q.value.toLowerCase())))

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
</script>

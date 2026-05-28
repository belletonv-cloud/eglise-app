<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">{{$t('schedulePeople.title')}} ({{ people.length }})</h3>
      <button @click="showAdd = true"
        class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
        + {{$t('schedulePeople.add_person.add')}}
      </button>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500">{{$t('schedulePeople.loading')}}</div>
    <table v-else-if="people.length" class="w-full">
      <thead class="border-b border-gray-200">
        <tr>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">{{$t('schedulePeople.name')}}</th>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">{{$t('schedulePeople.role')}}</th>
          <th class="text-left px-3 py-2 text-sm font-medium text-gray-600">{{$t('schedulePeople.status')}}</th>
          <th class="text-right px-3 py-2 text-sm font-medium text-gray-600">{{$t('schedulePeople.actions')}}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="p in people" :key="p.id" class="hover:bg-gray-50">
          <td class="px-3 py-2.5 text-sm font-medium text-gray-800">{{ p.first_name }} {{ p.last_name }}</td>
          <td class="px-3 py-2.5 text-sm text-gray-600">{{ p.position || '-' }}</td>
          <td class="px-3 py-2.5">
            <select :value="p.status" @change="updateStatus(p, ($event.target as HTMLSelectElement).value)"
              class="text-xs border border-gray-300 rounded px-2 py-1">
              <option value="pending">{{$t('schedulePeople.pending')}}</option>
              <option value="confirmed">{{$t('schedulePeople.confirmed')}}</option>
              <option value="declined">{{$t('schedulePeople.declined')}}</option>
            </select>
          </td>
          <td class="px-3 py-2.5 text-right space-x-2">
            <button v-if="p.status === 'declined'" @click="showReplacements(p)"
              class="text-amber-600 hover:text-amber-800 text-sm cursor-pointer">{{$t('schedulePeople.replace')}}</button>
            <button @click="remove(p)"
              class="text-red-600 hover:text-red-800 text-sm cursor-pointer">{{$t('schedulePeople.remove')}}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center py-6 text-gray-400">{{$t('schedulePeople.none')}}</div>

    <div v-if="showReplacement" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showReplacement = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h4 class="text-lg font-bold mb-4">{{$t('schedulePeople.replacement_modal.title', { name: replacingPerson ? (replacingPerson.first_name + ' ' + replacingPerson.last_name) : '' })}}</h4>
        <div v-if="replacementsLoading" class="text-center py-4 text-gray-500">{{$t('schedulePeople.replacement_modal.searching')}}</div>
        <div v-else-if="replacements.length === 0" class="text-center py-4 text-gray-400">{{$t('schedulePeople.replacement_modal.not_found')}}</div>
        <div v-else class="space-y-2">
          <div v-for="r in replacements" :key="r.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <div class="font-medium text-gray-800">{{ r.first_name }} {{ r.last_name }}</div>
              <div v-if="r.email" class="text-sm text-gray-500">{{ r.email }}</div>
            </div>
            <button @click="doReplace(r)"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">{{$t('schedulePeople.replacement_modal.choose')}}</button>
          </div>
        </div>
        <div class="flex justify-end mt-4">
<button @click="showReplacement = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{$t('schedulePeople.replacement_modal.close')}}</button>
        </div>
      </div>
    </div>

    <div v-if="showAdd" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAdd = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h4 class="text-lg font-bold mb-4">{{$t('schedulePeople.add_person.title')}}</h4>
        <form @submit.prevent="addPerson" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('schedulePeople.add_person.member')}}</label>
            <select v-model="newPerson.member_id" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="" disabled>{{$t('generic.choose')}}</option>
              <option v-for="m in availableMembers" :key="m.id" :value="m.id">
                {{ m.first_name }} {{ m.last_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('schedulePeople.add_person.role')}}</label>
            <input v-model="newPerson.position" :placeholder="$t('schedulePeople.add_person.role_placeholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('schedulePeople.add_person.team')}}</label>
            <select v-model="newPerson.team_id"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option :value="undefined">{{$t('schedulePeople.add_person.none')}}</option>
              <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-2">
<button type="button" @click="showAdd = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{$t('schedulePeople.add_person.cancel')}}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{$t('schedulePeople.add_person.add')}}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { confirmDialog } from '../stores/confirm'
import { useToast } from '../stores/toast'

const props = defineProps<{ planId: number }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()

const people = ref<any[]>([])
const members = ref<any[]>([])
const teams = ref<any[]>([])
const loading = ref(true)
const showAdd = ref(false)
const newPerson = ref({ member_id: '', position: '', team_id: undefined as number | undefined })
const showReplacement = ref(false)
const replacingPerson = ref<any>(null)
const replacements = ref<any[]>([])
const replacementsLoading = ref(false)

const availableMembers = ref<any[]>([])

const loadPeople = async () => {
  try {
    loading.value = true
    people.value = await api.getPlanPeople(props.planId)
    const scheduledIds = new Set(people.value.map((p: any) => p.member_id))
    availableMembers.value = members.value.filter((m: any) => !scheduledIds.has(m.id))
  } catch { console.warn('SchedulePeople filter failed') } finally {
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
    show(t('schedulePeople.toast.added'), 'success')
    showAdd.value = false
    newPerson.value = { member_id: '', position: '', team_id: undefined }
    loadPeople()
  } catch (e: any) {
    // If conflict (409), allow forcing the scheduling and show conflict details
    if ((e as any).status === 409 && (e as any).errorBody && (e as any).errorBody.conflict) {
      const c = (e as any).errorBody.conflict
      // Try to show team name by finding in teams list
      const existingTeam = teams.value.find(t => t.id === c.team_id)
      const teamLabel = existingTeam ? `${existingTeam.name}` : `équipe #${c.team_id}`
      const msg = t('schedulePeople.toast.conflict', { position: c.position || '—', team: teamLabel })
      const ok = await confirmDialog(msg)
      if (ok) {
        try {
          await api.schedulePerson(props.planId, {
            member_id: parseInt(newPerson.value.member_id),
            position: newPerson.value.position || undefined,
            team_id: newPerson.value.team_id || undefined,
            force: true,
            forced_by: 'web-ui',
          } as any)
          show(t('schedulePeople.toast.added_anyway'), 'success')
          showAdd.value = false
          newPerson.value = { member_id: '', position: '', team_id: undefined }
          loadPeople()
        } catch (err: any) {
          show(err.message || t('schedulePeople.toast.error'), 'error')
        }
      }
    } else {
      show(e.message || t('schedulePeople.toast.error'), 'error')
    }
  }
}

const remove = async (p: any) => {
  if (!await confirmDialog(t('schedulePeople.remove') + ` ${p.first_name} ${p.last_name} ?`)) return
  await api.removeSchedule(props.planId, p.id)
  loadPeople()
}

const showReplacements = async (p: any) => {
  replacingPerson.value = p
  showReplacement.value = true
  replacementsLoading.value = true
  try {
    replacements.value = await api.getReplacements(props.planId, p.id)
  } catch { replacements.value = [] }
  finally { replacementsLoading.value = false }
}

const doReplace = async (r: any) => {
  try {
    await api.applyReplacement(props.planId, replacingPerson.value.id, r.id)
    show(t('schedulePeople.toast.replaced', { name: r.first_name + ' ' + r.last_name }), 'success')
    showReplacement.value = false
    loadPeople()
  } catch (e: any) {
    show(e.message || t('schedulePeople.toast.error'), 'error')
  }
}

onMounted(async () => {
  try {
    ;[members.value, teams.value] = await Promise.all([api.getMembers(), api.getTeams()])
  } catch { console.warn('SchedulePeople getMembers/getTeams failed') }
  loadPeople()
})
</script>

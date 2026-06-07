<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">{{ $t('loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>
    
    <template v-else-if="group">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.push('/house-groups')"
          class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('houseGroups.back', '← Retour') }}</button>
        <div class="flex-1" />
        <button @click="showEditForm = true"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('houseGroups.edit') }}</button>
        <button @click="deleteGroup"
          class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">{{ $t('houseGroups.delete') }}</button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ group.name }}</h1>
        <p v-if="group.leader_first" class="text-gray-500 mt-1">
          {{ $t('houseGroups.leader') }} : {{ group.leader_first }} {{ group.leader_last }}
        </p>
        <p v-if="group.meeting_day" class="text-gray-600 mt-2">
          📅 {{ group.meeting_day }}<span v-if="group.meeting_time"> {{ $t('at') }} {{ group.meeting_time }}</span>
        </p>
        <p v-if="group.location" class="text-gray-600 mt-1">📍 {{ group.location }}</p>
        <p v-if="group.description" class="text-gray-600 mt-3">{{ group.description }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Membres -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ $t('houseGroups.members') }} ({{ group.members?.length || 0 }})</h2>
            <button @click="showAddMember = true"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ $t('houseGroups.add_member') }}
            </button>
          </div>

          <div v-if="group.members?.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500">
            {{ $t('houseGroups.no_members') }}
          </div>

          <div v-else class="space-y-2">
            <div v-for="m in group.members" :key="m.id"
              class="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg">
              <div>
                <span class="font-medium text-gray-800 dark:text-gray-100">{{ m.first_name }} {{ m.last_name }}</span>
                <span v-if="m.role" class="text-xs text-gray-400 dark:text-gray-500 ml-2">{{ m.role }}</span>
              </div>
              <button @click="removeMember(m.member_id)"
                class="text-red-400 hover:text-red-600 text-sm cursor-pointer">✕</button>
            </div>
          </div>
        </div>

        <!-- Réunions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ $t('houseGroups.meetings') }}</h2>
            <button @click="showAddMeeting = true"
              class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              {{ $t('houseGroups.add_meeting') }}
            </button>
          </div>

          <div v-if="group.meetings?.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500">
            {{ $t('houseGroups.no_meetings') }}
          </div>

          <div v-else class="space-y-2">
            <div v-for="meeting in group.meetings" :key="meeting.id"
              class="p-2.5 border border-gray-100 rounded-lg">
              <div class="font-medium text-gray-800 dark:text-gray-100">{{ formatDate(meeting.date) }}</div>
              <p v-if="meeting.notes" class="text-sm text-gray-600 mt-1">{{ meeting.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Modifier -->
      <div v-if="showEditForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showEditForm = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
          <h3 class="text-lg font-bold mb-4">{{ $t('houseGroups.edit_title') }}</h3>
          <form @submit.prevent="updateGroup" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.name') }}</label>
              <input v-model="editForm.name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.leader') }}</label>
              <select v-model="editForm.leader_id"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option :value="null">{{ $t('schedulePeople.add_person.none') }}</option>
                <option v-for="m in members" :key="m.id" :value="m.id">
                  {{ m.first_name }} {{ m.last_name }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_day') }}</label>
                <select v-model="editForm.meeting_day"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">-</option>
                  <option v-for="d in $t('dayNames')" :key="d">{{ d }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_time') }}</label>
                <input v-model="editForm.meeting_time" type="time"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.location') }}</label>
              <input v-model="editForm.location"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.description') }}</label>
              <textarea v-model="editForm.description" rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showEditForm = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('houseGroups.cancel') }}</button>
              <button type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                {{ $t('houseGroups.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Ajouter membre -->
      <div v-if="showAddMember" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddMember = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="text-lg font-bold mb-4">{{ $t('houseGroups.add_member') }}</h3>
          <form @submit.prevent="addMember" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('schedulePeople.add_person.member') }}</label>
              <select v-model="newMember.member_id" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">{{ $t('generic.choose') }}</option>
                <option v-for="m in availableMembers" :key="m.id" :value="m.id">
                  {{ m.first_name }} {{ m.last_name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('schedulePeople.add_person.role') }}</label>
              <input v-model="newMember.role" :placeholder="$t('schedulePeople.add_person.role_placeholder')"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showAddMember = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('houseGroups.cancel') }}</button>
              <button type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                {{ $t('schedulePeople.add_person.add') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Ajouter réunion -->
      <div v-if="showAddMeeting" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddMeeting = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="text-lg font-bold mb-4">{{ $t('houseGroups.add_meeting') }}</h3>
          <form @submit.prevent="addMeeting" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_date') }} *</label>
              <input v-model="newMeeting.date" type="date" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_notes') }}</label>
              <textarea v-model="newMeeting.notes" rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showAddMeeting = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('houseGroups.cancel') }}</button>
              <button type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                {{ $t('houseGroups.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'
import { confirmDialog } from '../stores/confirm'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const group = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showEditForm = ref(false)
const showAddMember = ref(false)
const showAddMeeting = ref(false)
const editForm = ref<any>({})
const newMember = ref({ member_id: '', role: 'member' })
const newMeeting = ref({ date: '', notes: '' })
const availableMembers = ref<any[]>([])

const formatDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const loadData = async () => {
  const groupId = Number(route.params.id)
  if (!groupId) return
  
  try {
    const [groupData, membersData] = await Promise.all([
      api.getHouseGroup(groupId),
      api.getMembers()
    ])
    group.value = groupData
    members.value = membersData
    
    if (group.value?.members) {
      const memberIds = new Set(group.value.members.map((m: any) => m.member_id))
      availableMembers.value = membersData.filter((m: any) => !memberIds.has(m.id))
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const updateGroup = async () => {
  try {
    await api.updateHouseGroup(Number(route.params.id), editForm.value)
    showEditForm.value = false
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const deleteGroup = async () => {
  if (!await confirmDialog(t('houseGroups.confirm_delete'))) return
  try {
    await api.deleteHouseGroup(Number(route.params.id))
    router.push('/house-groups')
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const addMember = async () => {
  if (!newMember.value.member_id) return
  try {
    await api.addGroupMember(Number(route.params.id), {
      member_id: Number(newMember.value.member_id),
      role: newMember.value.role
    })
    showAddMember.value = false
    newMember.value = { member_id: '', role: 'member' }
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const removeMember = async (memberId: number) => {
  if (!await confirmDialog(t('team.confirm_remove'))) return
  try {
    await api.removeGroupMember(Number(route.params.id), memberId)
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const addMeeting = async () => {
  if (!newMeeting.value.date) return
  try {
    await api.addGroupMeeting(Number(route.params.id), newMeeting.value)
    showAddMeeting.value = false
    newMeeting.value = { date: '', notes: '' }
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

onMounted(() => {
  loadData()
})
</script>

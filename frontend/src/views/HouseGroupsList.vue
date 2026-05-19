<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('houseGroups.title') }}</h2>
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('houseGroups.add') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="group in groups" :key="group.id"
        @click="goToGroup(group.id)"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all">
        <h3 class="text-lg font-semibold text-gray-800">{{ group.name }}</h3>
        <p v-if="group.leader_first" class="text-sm text-gray-500 mt-1">
          {{ $t('houseGroups.leader') }}: {{ group.leader_first }} {{ group.leader_last }}
        </p>
        <p class="text-sm text-gray-400 mt-2">
          {{ group.member_count || 0 }} {{ $t('table.member') }}(s)
        </p>
        <p v-if="group.meeting_day" class="text-xs text-gray-400 mt-1">
          {{ group.meeting_day }}{{ group.meeting_time ? ' ' + $t('at') + ' ' + group.meeting_time : '' }}
        </p>
        <p v-if="group.location" class="text-xs text-gray-400 mt-1">
          📍 {{ group.location }}
        </p>
      </div>

      <div v-if="groups.length === 0" class="col-span-full text-center py-12 text-gray-400">
        {{ $t('houseGroups.title') }} {{ $t('members.no_members') }}
      </div>
    </div>

    <!-- Modal Nouveau Groupe -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-lg font-bold mb-4">{{ $t('houseGroups.create_title') }}</h3>
        <form @submit.prevent="createGroup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.name') }} *</label>
            <input v-model="form.name" required :placeholder="$t('houseGroups.name')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.leader') }}</label>
            <select v-model="form.leader_id"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option :value="undefined">{{ $t('schedulePeople.add_person.none') }}</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.first_name }} {{ m.last_name }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_day') }}</label>
              <select v-model="form.meeting_day"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">-</option>
                <option v-for="d in $t('dayNames')" :key="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.meeting_time') }}</label>
              <input v-model="form.meeting_time" type="time"
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.location') }}</label>
            <input v-model="form.location" :placeholder="$t('houseGroups.location')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('houseGroups.description') }}</label>
            <textarea v-model="form.description" rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('houseGroups.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ $t('houseGroups.create') }}
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
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t } = useI18n()
const router = useRouter()
const groups = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const form = ref({
  name: '',
  leader_id: undefined as number | undefined,
  meeting_day: '',
  meeting_time: '',
  location: '',
  description: ''
})

const loadData = async () => {
  try {
    const [groupsData, membersData] = await Promise.all([
      api.getHouseGroups(),
      api.getMembers()
    ])
    groups.value = groupsData
    members.value = membersData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const createGroup = async () => {
  if (!form.value.name) return
  try {
    await api.createHouseGroup(form.value)
    showForm.value = false
    form.value = { name: '', leader_id: undefined, meeting_day: '', meeting_time: '', location: '', description: '' }
    loadData()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const goToGroup = (id: number) => {
  router.push({ name: 'house-group-detail', params: { id: id.toString() } })
}

onMounted(loadData)
</script>

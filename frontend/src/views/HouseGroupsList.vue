<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('houseGroups.title') }}</h2>
        <PageHelp page="housegroups" :helpText="$t('help.housegroups')" />
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('houseGroups.add') }}
      </button>
    </div>

    <div v-if="isLoading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
  <div class="w-80 h-8 bg-gray-200 rounded"></div>
  <div class="w-72 h-5 bg-gray-100 rounded"></div>
  <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
  <div class="w-80 h-12 bg-gray-200 rounded"></div>
  <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
</div>
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

      <div v-if="groups.length === 0 && !isLoading" class="col-span-full text-center py-12 text-gray-400">
        Aucun groupe trouvé.
      </div>

      <!-- Pagination -->
      <div class="pagination flex items-center gap-2 justify-center py-4 col-span-full" v-if="total > pageSize">
        <button type="button" @click="goPrev" :disabled="page === 1"
          class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Précédent</button>
        <button v-for="p in totalPages" :key="p" type="button"
          @click="goToPage(p)" :class="['px-3 py-1 rounded', { 'bg-blue-600 text-white': p === page, 'bg-gray-100': p !== page } ]">
          {{ p }}
        </button>
        <button type="button" @click="goNext" :disabled="page === totalPages"
          class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Suivant</button>
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
import PageHelp from '../components/PageHelp.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getHouseGroups } from '../api/houseGroups'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t } = useI18n()
const router = useRouter()
// Pagination state
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const groups = ref<any[]>([])
const isLoading = ref(false) // switched from loading
const error = ref<string | null>(null)
const members = ref<any[]>([])
const showForm = ref(false)
const form = ref({
  name: '',
  leader_id: undefined as number | undefined,
  meeting_day: '',
  meeting_time: '',
  location: '',
  description: ''
})

const totalPages = computed(() => total.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1)

async function fetchGroups() {
  isLoading.value = true
  error.value = null
  try {
    const res = await getHouseGroups({ page: page.value, limit: pageSize.value })
    groups.value = res.groups ?? []
    total.value = res.total ?? groups.value.length
    // Correction UX : rollback page si out-of-bounds
    if (page.value > totalPages.value) {
      page.value = totalPages.value
      await fetchGroups()
    }
  } catch (e: any) {
    error.value = 'Impossible de charger les groupes.'
    groups.value = []
    total.value = 0
  } finally {
    isLoading.value = false // replaced loading -> isLoading
  }
}

watch([page, pageSize], () => { fetchGroups() }, { immediate: true })

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
}
function goPrev() {
  if (page.value > 1) page.value--
}
function goNext() {
  if (page.value < totalPages.value) page.value++
}

const loadMembers = async () => {
  try {
    members.value = await api.getMembers()
  } catch {}
}
onMounted(() => {
  fetchGroups()
  loadMembers()
})

const createGroup = async () => {
  if (!form.value.name) return
  try {
    await api.createHouseGroup(form.value)
    showForm.value = false
    form.value = { name: '', leader_id: undefined, meeting_day: '', meeting_time: '', location: '', description: '' }
    fetchGroups()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const goToGroup = (id: number) => {
  router.push({ name: 'house-group-detail', params: { id: id.toString() } })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('members.title', { count: members.length }) }}</h2>
        <ContextHelp :text="$t('help.members')" />
      <button @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('members.add') }}
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

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 flex items-center gap-3">
        <label class="text-sm text-gray-600">{{ $t('members.filter_ministry') }}</label>
        <select v-model="selectedTeam" class="border px-2 py-1 rounded">
          <option :value="null">{{ $t('members.all') }}</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <span v-if="isLoadingTeams" class="text-xs text-gray-400 ml-2">{{ $t('loading') }}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">{{ $t('table.name') }}</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">{{ $t('table.email') }}</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">{{ $t('members.phone') }}</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">{{ $t('members.type') }}</th>
              <th class="text-right px-4 py-3 text-sm font-medium text-gray-600">{{ $t('members.edit') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="m in filteredMembers" :key="m.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ m.first_name }} {{ m.last_name }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.email ?? '-' }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.phone ?? '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-col gap-2">
                  <span :class="typeClass(m.membership_type ?? 'guest')"
                    class="px-2 py-1 rounded-full text-xs font-medium inline-block w-max">
                    {{ typeLabel(m.membership_type ?? 'guest') }}
                  </span>
                  <div v-if="m.teams && m.teams.length > 0" class="flex flex-wrap gap-2 mt-1">
<span v-for="t in m.teams as MemberTeam[]" :key="t.id" class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                       {{ t.name }}<span v-if="t.position"> · {{ t.position }}</span>
                    </span>
                  </div>
                  <div v-else class="text-xs text-gray-400">{{ $t('members.no_ministry') }}</div>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="editMember(m)"
                  class="text-blue-600 hover:text-blue-800 text-sm mr-3 cursor-pointer">{{ $t('members.edit') }}</button>
                <button @click="deleteMember(m.id)"
                  class="text-red-600 hover:text-red-800 text-sm cursor-pointer">{{ $t('members.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredMembers.length === 0 && !isLoading" class="text-center py-12 text-gray-400">
        {{ $t('members.no_members') }}
      </div>

      <!-- Pagination -->
      <div class="pagination flex items-center gap-2 justify-center py-4" v-if="total > pageSize">
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

    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold mb-4">{{ editing ? $t('members.form_title_edit') : $t('members.form_title_add') }}</h3>
        <form @submit.prevent="saveMember" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.first_name') }}</label>
              <input v-model="form.first_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.last_name') }}</label>
              <input v-model="form.last_name" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.email') }}</label>
            <input v-model="form.email" type="email"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.phone') }}</label>
            <input v-model="form.phone" type="tel"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('members.membership_type') }}</label>
            <select v-model="form.membership_type"
              class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="guest">{{ $t('members.types.guest') }}</option>
              <option value="member">{{ $t('members.types.member') }}</option>
              <option value="inactive">{{ $t('members.types.inactive') }}</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showForm = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">{{ $t('members.cancel') }}</button>
            <button type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              {{ editing ? $t('members.save') : $t('members.add') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ContextHelp from '../components/ContextHelp.vue';
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMembers } from '../api/members'
import { useTeams } from '../composables/useTeams'
import { api } from '../utils/api'
import type { Member, Team } from '../utils/types'
type MemberTeam = Team & { position?: string }
import { confirmDialog } from '../stores/confirm'
import { showToast } from '../stores/toast'

const { t } = useI18n()

// Pagination state
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const members = ref<Member[]>([])
const { teams, loadTeams } = useTeams()
const isLoadingTeams = ref(false)
const selectedTeam = ref<number | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const showForm = ref(false)
const editing = ref<number | null>(null)
const form = ref({ first_name: '', last_name: '', email: '', phone: '', membership_type: 'guest' })

const totalPages = computed(() => (total.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1))

async function fetchMembers() {
  isLoading.value = true
  error.value = null
  try {
    const res = await getMembers({ page: page.value, limit: pageSize.value })
    members.value = res.members ?? []
    total.value = res.total ?? members.value.length

    // Correction UX : rollback page si out-of-bounds (classement rafraîchi)
    if (page.value > totalPages.value) {
      page.value = totalPages.value
      await fetchMembers()
    }
  } catch (e: any) {
    error.value = 'Impossible de charger les membres.'
    members.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

watch([page, pageSize], () => {
  fetchMembers()
}, { immediate: true })

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

const typeLabel = (tl: string) => {
  const key = `members.types.${tl}`
  const translated = t(key)
  return translated === key ? tl : translated
}
const typeClass = (tl: string) => tl === 'member' ? 'bg-green-100 text-green-700' : tl === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'

const editMember = (m: Member) => {
  editing.value = m.id
  form.value = { first_name: m.first_name, last_name: m.last_name, email: m.email ?? '', phone: m.phone ?? '', membership_type: m.membership_type ?? 'guest' }
  showForm.value = true
}

const deleteMember = async (id: number) => {
  if (!await confirmDialog(t('members.confirm_delete'))) return
  try {
    await api.deleteMember(id)
    fetchMembers()
  } catch (e: any) {
    showToast(e.message || 'Erreur lors de la suppression', 'error')
  }
}

const saveMember = async () => {
  try {
    if (editing.value) {
      await api.updateMember(editing.value, form.value)
    } else {
      await api.createMember(form.value)
    }
    showForm.value = false
    editing.value = null
    form.value = { first_name: '', last_name: '', email: '', phone: '', membership_type: 'guest' }
    fetchMembers()
  } catch (e: any) {
    showToast(e.message || 'Erreur lors de l\'enregistrement', 'error')
  }
}

const loadTeamsInternal = async () => {
  isLoadingTeams.value = true
  try {
    await loadTeams()
  } finally {
    isLoadingTeams.value = false
  }
}
onMounted(() => {
  loadTeamsInternal()
})

// Si on filtre par team, reset sur page 1
watch(selectedTeam, () => {
  page.value = 1
})

const filteredMembers = computed(() => {
  if (!selectedTeam.value) return members.value
  return members.value.filter(m => (m.teams as MemberTeam[] || []).some((t: MemberTeam) => t.id === selectedTeam.value))
})
</script>

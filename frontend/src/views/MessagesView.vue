<template>
  <div class="p-4">
    <h1 class="text-xl font-semibold mb-4">{{ $t('messages.title') }}</h1>
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="w-full lg:w-1/3">
        <div v-for="msg in inbox" :key="msg.id" class="p-2 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" @click="select(msg)">
          <div class="font-medium">{{ msg.subject || $t('messages.no_subject') }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('messages.from') }}: {{ msg.sender_first }} {{ msg.sender_last }} — {{ msg.created_at }}</div>
        </div>
      </div>
      <div class="flex-1">
        <div v-if="selected">
          <h2 class="text-lg font-semibold">{{ selected.subject || $t('messages.no_subject') }}</h2>
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('messages.from') }}: {{ selected.sender_first }} {{ selected.sender_last }} — {{ selected.created_at }}</div>
          <div class="mt-4 whitespace-pre-wrap">{{ selected.content }}</div>
        </div>
        <div v-else class="text-gray-500">{{ $t('messages.select_prompt') }}</div>
        <hr class="my-4" />
        <h3 class="font-semibold mb-2">{{ $t('messages.new') }}</h3>
        <form @submit.prevent="send">
          <input v-model="form.subject" :placeholder="$t('messages.subject')" class="w-full p-2 border mb-2 rounded dark:bg-gray-800 dark:border-gray-600" />
          <textarea v-model="form.content" :placeholder="$t('messages.content')" class="w-full p-2 border mb-2 rounded dark:bg-gray-800 dark:border-gray-600" rows="6"></textarea>

          <!-- Member picker -->
          <div class="mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('messages.recipients') }}</label>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('search.placeholder')"
              class="w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:border-gray-600"
              @focus="showPicker = true"
            />
            <div v-if="showPicker" class="border rounded max-h-48 overflow-y-auto bg-white dark:bg-gray-800 dark:border-gray-600">
              <div
                v-for="m in filteredMembers"
                :key="m.id"
                class="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="toggleMember(m)"
              >
                <input type="checkbox" :checked="selectedMemberIds.includes(m.id)" class="rounded" />
                <span class="text-sm">{{ m.first_name }} {{ m.last_name }}</span>
                <span v-if="m.email" class="text-xs text-gray-400 ml-auto">{{ m.email }}</span>
              </div>
              <div v-if="filteredMembers.length === 0" class="p-2 text-sm text-gray-400 text-center">
                {{ $t('members.no_members') }}
              </div>
            </div>
            <!-- Selected members chips -->
            <div v-if="selectedMembers.length > 0" class="flex flex-wrap gap-1 mt-2">
              <span v-for="m in selectedMembers" :key="m.id" class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                {{ m.first_name }} {{ m.last_name }}
                <button type="button" @click="toggleMember(m)" class="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100">✕</button>
              </span>
            </div>
          </div>

          <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">{{ $t('messages.send') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t } = useI18n()

const inbox = ref<any[]>([])
const selected = ref<any>(null)
const form = ref({ subject: '', content: '' })
const members = ref<any[]>([])
const searchQuery = ref('')
const showPicker = ref(false)
const selectedMemberIds = ref<number[]>([])

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const q = searchQuery.value.toLowerCase()
  return members.value.filter(m =>
    `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q)
  )
})

const selectedMembers = computed(() =>
  members.value.filter(m => selectedMemberIds.value.includes(m.id))
)

function toggleMember(m: any) {
  const idx = selectedMemberIds.value.indexOf(m.id)
  if (idx === -1) {
    selectedMemberIds.value.push(m.id)
  } else {
    selectedMemberIds.value.splice(idx, 1)
  }
}

async function loadInbox() {
  inbox.value = await api.getInbox().catch(() => [])
}

async function loadMembers() {
  members.value = await api.getMembers().catch(() => [])
}

async function select(m: any) {
  selected.value = await api.getMessage(m.id).catch(() => m)
  await api.markMessageRead(m.id).catch(() => {})
}

async function send() {
  if (selectedMemberIds.value.length === 0) return
  try {
    await api.sendMessage({
      subject: form.value.subject,
      content: form.value.content,
      recipients: selectedMemberIds.value,
    })
    form.value.subject = ''
    form.value.content = ''
    selectedMemberIds.value = []
    searchQuery.value = ''
    await loadInbox()
  } catch (e: any) {
    showToast(e.message || 'Error', 'error')
  }
}

// Close picker when clicking outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.member-picker-area')) {
    showPicker.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadInbox(), loadMembers()])
  document.addEventListener('click', handleClickOutside)
})
</script>

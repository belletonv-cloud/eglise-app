<template>
  <div class="p-4">
    <h1 class="text-xl font-semibold mb-4">Messagerie interne</h1>
    <div class="flex gap-4">
      <div class="w-1/3">
        <div v-for="msg in inbox" :key="msg.id" class="p-2 border-b cursor-pointer" @click="select(msg)">
          <div class="font-medium">{{ msg.subject || '(sans objet)' }}</div>
          <div class="text-sm text-gray-600">De: {{ msg.sender_first }} {{ msg.sender_last }} — {{ msg.created_at }}</div>
        </div>
      </div>
      <div class="flex-1">
        <div v-if="selected">
          <h2 class="text-lg font-semibold">{{ selected.subject || '(sans objet)' }}</h2>
          <div class="text-sm text-gray-600">De: {{ selected.sender_first }} {{ selected.sender_last }} — {{ selected.created_at }}</div>
          <div class="mt-4 whitespace-pre-wrap">{{ selected.content }}</div>
        </div>
        <div v-else class="text-gray-500">Sélectionne un message pour le lire.</div>
        <hr class="my-4" />
        <h3 class="font-semibold mb-2">Nouveau message</h3>
        <form @submit.prevent="send">
          <input v-model="form.subject" placeholder="Objet" class="w-full p-2 border mb-2" />
          <textarea v-model="form.content" placeholder="Message" class="w-full p-2 border mb-2" rows="6"></textarea>
          <input v-model="form.recipients" placeholder="IDs destinataires, séparés par des virgules" class="w-full p-2 border mb-2" />
          <button class="px-4 py-2 bg-blue-600 text-white rounded">Envoyer</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const inbox = ref([])
const selected = ref(null)
const form = ref({ subject: '', content: '', recipients: '' })

async function loadInbox() {
  inbox.value = await api.getInbox().catch(() => []);
}

async function select(m) {
  selected.value = await api.getMessage(m.id).catch(() => m)
  // mark as read locally
  await api.markMessageRead(m.id).catch(() => {})
}

async function send() {
  const recipients = form.value.recipients.split(',').map(s => parseInt(s.trim())).filter(Boolean)
  await api.sendMessage({ subject: form.value.subject, content: form.value.content, recipients })
  form.value.subject = ''
  form.value.content = ''
  form.value.recipients = ''
  await loadInbox()
}

onMounted(loadInbox)
</script>

<style scoped>
</style>

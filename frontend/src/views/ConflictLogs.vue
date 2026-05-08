<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Logs de conflits planifiés</h2>
    <div class="mb-4 flex gap-3">
      <div>
        <label class="text-sm text-gray-600 mr-2">Filtrer par plan :</label>
        <select v-model="planId" class="border px-2 py-1 rounded">
          <option :value="null">Tous</option>
          <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.date }} — {{ p.theme || p.id }}</option>
        </select>
      </div>
      <div>
        <label class="text-sm text-gray-600 mr-2">Membre (nom) :</label>
        <input v-model="memberQuery" placeholder="Jean Dupont" class="border px-2 py-1 rounded" />
      </div>
    </div>

    <table class="w-full bg-white rounded shadow">
      <thead>
        <tr class="text-left border-b"><th class="p-2">Date</th><th class="p-2">Service</th><th class="p-2">Membre</th><th class="p-2">Assignation existante</th><th class="p-2">Forcé par</th><th class="p-2">Note</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id" class="border-b">
          <td class="p-2">{{ r.created_at }}</td>
          <td class="p-2">{{ r.plan_id }}</td>
          <td class="p-2">{{ r.first_name }} {{ r.last_name }}</td>
          <td class="p-2">{{ r.existing_team_name || '-' }} (scheduled id {{ r.existing_scheduled_id }})</td>
          <td class="p-2">{{ r.forced_by }}</td>
          <td class="p-2">{{ r.note || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex items-center gap-3">
      <button @click="prev" class="px-2 py-1 bg-gray-200 rounded">Préc</button>
      <span>Page {{ page }}</span>
      <button @click="next" class="px-2 py-1 bg-gray-200 rounded">Suiv</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '../utils/api'

const rows = ref<any[]>([])
const plans = ref<any[]>([])
const planId = ref<number | null>(null)
const memberQuery = ref('')
const page = ref(1)
const per = ref(25)

async function load() {
  const res = await api.getConflictLogs(planId.value || undefined, page.value, per.value, memberQuery.value || undefined)
  // server response: { rows, page, per }
  if ((res as any).rows) {
    rows.value = (res as any).rows
    page.value = (res as any).page || 1
  } else {
    rows.value = res as any
  }
}

onMounted(async () => {
  plans.value = await api.getPlans()
  await load()
})

watch([planId, memberQuery], () => { page.value = 1; load() })

function prev() { if (page.value > 1) { page.value--; api.getConflictLogs(planId.value || undefined) ; load() } }
function next() { page.value++; load() }
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Logs de conflits planifiés</h2>
    <div class="mb-4">
      <label class="text-sm text-gray-600 mr-2">Filtrer par plan :</label>
      <select v-model="planId" class="border px-2 py-1 rounded">
        <option :value="null">Tous</option>
        <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.date }} — {{ p.theme || p.id }}</option>
      </select>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '../utils/api'

const rows = ref<any[]>([])
const plans = ref<any[]>([])
const planId = ref<number | null>(null)

async function load() {
  rows.value = await api.getConflictLogs(planId.value || undefined)
}

onMounted(async () => {
  plans.value = await api.getPlans()
  await load()
})

watch(planId, load)
</script>

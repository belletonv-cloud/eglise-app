<template>
  <div class="bg-white min-h-[calc(100vh-64px)]">
    <!-- Top banner (desktop) -->
    <div class="hidden md:block bg-[#2ECC71]">
      <div class="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div class="text-center lg:text-left">
          <div class="text-4xl font-extrabold text-white tracking-tight">Serving Schedule</div>
          <div class="mt-2 text-white/90 text-lg">
            Accept or Decline scheduling requests for your entire family
          </div>
        </div>

        <div class="flex justify-center lg:justify-end">
          <div class="w-[340px] rounded-[2.25rem] bg-black p-3 shadow-2xl">
            <div class="rounded-[1.9rem] bg-white overflow-hidden">
              <PhoneSchedule />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Phone-only layout (mobile) -->
    <div class="md:hidden max-w-md mx-auto">
      <PhoneSchedule />
    </div>

    <!-- Bottom nav (mobile / prototype) -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="max-w-md mx-auto px-2 py-2 grid grid-cols-5 gap-1 text-[11px] text-gray-700">
        <button class="flex flex-col items-center gap-1 py-1" @click="go('/serving-schedule')">
          <span :class="isActive('/serving-schedule') ? 'text-[#2ECC71]' : 'text-gray-700'">📅</span>
          <span :class="isActive('/serving-schedule') ? 'text-[#2ECC71] font-semibold' : ''">Schedule</span>
        </button>
        <button class="flex flex-col items-center gap-1 py-1" @click="go('/services-center')">
          <span :class="isActive('/services-center') ? 'text-[#2ECC71]' : 'text-gray-700'">🧾</span>
          <span :class="isActive('/services-center') ? 'text-[#2ECC71] font-semibold' : ''">Plans</span>
        </button>
        <button class="flex flex-col items-center gap-1 py-1" @click="go('/music-stand-app')">
          <span :class="isActive('/music-stand-app') ? 'text-[#2ECC71]' : 'text-gray-700'">🎵</span>
          <span :class="isActive('/music-stand-app') ? 'text-[#2ECC71] font-semibold' : ''">Songs</span>
        </button>
        <button class="flex flex-col items-center gap-1 py-1" @click="go('/admin/content')">
          <span class="text-gray-700">📎</span>
          <span>Media</span>
        </button>
        <button class="flex flex-col items-center gap-1 py-1" @click="go('/members')">
          <span :class="isActive('/members') ? 'text-[#2ECC71]' : 'text-gray-700'">👥</span>
          <span :class="isActive('/members') ? 'text-[#2ECC71] font-semibold' : ''">People</span>
        </button>
      </div>
    </div>

    <div class="md:hidden h-16"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../utils/api'
import { member } from '../stores/member'

const router = useRouter()
const route = useRoute()

function go(path: string) {
  router.push(path)
}

function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/')
}

function formatScheduleDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const PhoneSchedule = defineComponent({
  name: 'PhoneSchedule',
  setup() {
    const personName = computed(() => {
      if (!member.value) return 'Moi'
      return member.value.first_name || member.value.email?.split('@')[0] || 'Moi'
    })
    const loading = ref(true)

    const pending = ref<any[]>([])
    const confirmed = ref<any[]>([])

    const pendingCount = computed(() => pending.value.length)
    const confirmedCount = computed(() => confirmed.value.length)

    function accept(idx: number) {
      const item = pending.value.splice(idx, 1)[0]
      if (item) confirmed.value.unshift(item)
    }

    function decline(idx: number) {
      pending.value.splice(idx, 1)
    }

    onMounted(async () => {
      try {
        const rows = await api.getMySchedule()
        const items: any[] = Array.isArray(rows) ? rows : []
        for (const r of items) {
          const card = {
            date: formatScheduleDate(r.date),
            service: r.service_type_name || r.theme || 'Service',
            role: r.position || '',
            id: r.id,
          }
          if (r.status === 'pending' || !r.status) pending.value.push(card)
          else confirmed.value.push(card)
        }
        // Show placeholder confirmed items if none from API
        if (confirmed.value.length === 0 && pending.value.length === 0) {
          confirmed.value = [
            { date: '', service: 'Aucun service planifié', role: '' },
          ]
        }
      } catch {
        confirmed.value = [{ date: '', service: 'Chargement impossible', role: '' }]
      } finally {
        loading.value = false
      }
    })

    return { personName, loading, pending, confirmed, pendingCount, confirmedCount, accept, decline }
  },
  template: `
    <div class="px-4 pt-5 pb-3">
      <div class="text-xl font-extrabold text-gray-900">My Schedule</div>
      <div class="mt-2">
        <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm">{{ personName }}</div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <button class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-medium">Add Blockout</button>
        <button class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-medium">Email Leader</button>
      </div>

      <div v-if="loading" class="mt-6 text-sm text-gray-400 text-center py-4">Chargement…</div>

      <div v-else>
        <div class="mt-5">
          <div class="text-sm font-semibold text-gray-700">Pending {{ pendingCount }}</div>

          <div v-if="pendingCount === 0" class="mt-2 text-sm text-gray-400">Aucune demande en attente</div>
          <div v-for="(it, idx) in pending" :key="idx" class="mt-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-2xl font-extrabold text-gray-900">{{ it.date }}</div>
                <div class="mt-1 text-sm text-gray-900 font-semibold">{{ it.service }}</div>
                <div class="text-sm text-gray-700">{{ it.role }}</div>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button @click="decline(idx)" class="px-3 py-2 rounded-lg border border-red-400 text-red-600 bg-white text-sm font-semibold">Decline</button>
              <button @click="accept(idx)" class="px-3 py-2 rounded-lg border border-[#2ECC71] text-[#2ECC71] bg-white text-sm font-semibold">Accept</button>
            </div>
          </div>
        </div>

        <div class="mt-6 pb-4">
          <div class="text-sm font-semibold text-gray-700">Confirmed {{ confirmedCount }}</div>
          <div v-for="(it, idx) in confirmed" :key="idx" class="mt-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="text-sm text-gray-900 font-semibold">{{ it.date }}{{ it.date ? ' — ' : '' }}{{ it.service }}<span v-if="it.role"> — {{ it.role }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
</script>

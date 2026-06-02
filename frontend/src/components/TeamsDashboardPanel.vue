<template>
  <div>
    <div v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TeamBlock
        title="Band"
        :stats="bandStats"
        :roles="bandRoles"
        :alert="bandAlert"
        :loading="loading"
      />
      <TeamBlock
        title="Audio/Visual"
        :stats="avStats"
        :roles="avRoles"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { api } from '../utils/api'

type TeamSummary = { id: number; name: string; service_type?: string | null }

type TeamMember = {
  id: number
  first_name?: string
  last_name?: string
  position?: string | null
}

type TeamDetail = { id: number; name: string; members?: TeamMember[] }

type RoleLine = {
  role: string
  members: { id: number; name: string }[]
}

type Stats = { ok: number; missing: number; pending: number }

const loading = ref(true)
const error = ref('')

const bandRoles = ref<RoleLine[]>([])
const avRoles = ref<RoleLine[]>([])

const bandStats = ref<Stats>({ ok: 0, missing: 0, pending: 0 })
const avStats = ref<Stats>({ ok: 0, missing: 0, pending: 0 })

const bandAlert = computed(() => {
  if (bandStats.value.missing <= 0) return ''
  return `${bandStats.value.missing} unsent emails`
})

function nameOf(m: TeamMember): string {
  const n = `${m.first_name || ''} ${m.last_name || ''}`.trim()
  return n || `Member #${m.id}`
}

function buildRoles(details: TeamDetail[]): { roles: RoleLine[]; stats: Stats } {
  const roleMap = new Map<string, { id: number; name: string }[]>()
  let ok = 0
  let missing = 0

  for (const t of details) {
    for (const m of t.members || []) {
      const role = (m.position || '').trim() || 'Unassigned'
      if (role === 'Unassigned') missing += 1
      else ok += 1

      const arr = roleMap.get(role) || []
      arr.push({ id: m.id, name: nameOf(m) })
      roleMap.set(role, arr)
    }
  }

  const roles = Array.from(roleMap.entries())
    .map(([role, members]) => ({ role, members }))
    .sort((a, b) => {
      if (a.role === 'Unassigned') return 1
      if (b.role === 'Unassigned') return -1
      return a.role.localeCompare(b.role)
    })

  return { roles, stats: { ok, missing, pending: 0 } }
}

function isBandTeam(t: TeamSummary): boolean {
  const name = (t.name || '').toLowerCase()
  const st = (t.service_type || '').toLowerCase()
  return st === 'worship' || name.includes('band') || name.includes('worship')
}

function isAvTeam(t: TeamSummary): boolean {
  const name = (t.name || '').toLowerCase()
  const st = (t.service_type || '').toLowerCase()
  return (
    ['sound', 'lights', 'video'].includes(st) ||
    name.includes('audio') ||
    name.includes('visual') ||
    name.includes('av') ||
    name.includes('sound') ||
    name.includes('lights') ||
    name.includes('video')
  )
}

async function loadCategory(ids: number[]): Promise<TeamDetail[]> {
  const uniq = Array.from(new Set(ids)).slice(0, 6)
  return Promise.all(uniq.map(id => api.getTeam(id)))
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const all = (await api.getTeams()) as TeamSummary[]

    const bandIds = all.filter(isBandTeam).map(t => t.id)
    const avIds = all.filter(isAvTeam).map(t => t.id)

    const [bandDetails, avDetails] = await Promise.all([
      loadCategory(bandIds),
      loadCategory(avIds),
    ])

    const band = buildRoles(bandDetails)
    const av = buildRoles(avDetails)

    bandRoles.value = band.roles
    avRoles.value = av.roles

    bandStats.value = band.stats
    avStats.value = av.stats
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const TeamBlock = defineComponent({
  name: 'TeamBlock',
  props: {
    title: { type: String, required: true },
    stats: { type: Object as any, required: true },
    roles: { type: Array as any, required: true },
    alert: { type: String, default: '' },
    loading: { type: Boolean, default: false },
  },
  setup() {
    function send() {
      window.alert('Send emails (prototype)')
    }
    return { send }
  },
  template: `
    <section class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-bold text-gray-900">{{ title }}</div>
          <div class="mt-2 flex items-center gap-3 text-sm">
            <div class="flex items-center gap-1"><span class="text-emerald-600 font-bold">✓</span><span class="font-semibold">{{ stats.ok }}</span></div>
            <div class="flex items-center gap-1"><span class="text-red-600 font-bold">✕</span><span class="font-semibold">{{ stats.missing }}</span></div>
            <div class="flex items-center gap-1"><span class="text-amber-500 font-bold">●</span><span class="font-semibold">{{ stats.pending }}</span></div>
          </div>
        </div>
      </div>

      <div v-if="alert" class="mt-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <div class="text-sm text-amber-900 font-semibold">{{ alert }}</div>
        <button @click="send" class="px-3 py-1.5 rounded-lg bg-[#2ECC71] text-white text-sm font-semibold">Send</button>
      </div>

      <div v-if="loading" class="py-10 text-sm text-gray-500">Loading…</div>

      <div v-else class="mt-4 space-y-3">
        <div v-for="r in roles" :key="r.role" class="border border-gray-100 rounded-lg">
          <div class="px-3 py-2 bg-gray-50 rounded-t-lg text-sm font-semibold text-gray-800">{{ r.role }}</div>
          <div class="px-3 py-2 space-y-2">
            <div v-for="m in r.members" :key="m.id" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">👤</div>
                <div class="text-sm text-gray-900 truncate">{{ m.name }}</div>
              </div>
              <button class="shrink-0 text-gray-500 hover:text-gray-900" title="Email">✉️</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
</script>

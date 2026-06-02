<template>
  <div class="max-w-6xl mx-auto p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-gray-900">
          Teams
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Band / Audio‑Visual — dashboard de préparation
        </p>
      </div>
      <router-link to="/services-center" class="text-sm text-blue-700 hover:underline shrink-0">
        ← Services Center
      </router-link>
    </div>

    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TeamBlock
        title="Band"
        :stats="{ ok: 12, missing: 2, pending: 3 }"
        alert="6 unsent emails"
        :roles="band"
      />
      <TeamBlock
        title="Audio/Visual"
        :stats="{ ok: 9, missing: 1, pending: 2 }"
        :roles="av"
      />
    </div>

    <div class="mt-5 text-xs text-gray-400">
      Prototype UI : on branchera ensuite les vraies équipes depuis /teams et les invitations / confirmations.
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'

type RoleLine = { role: string; members: { name: string; email?: string }[] }

const band: RoleLine[] = [
  {
    role: 'Acoustic Guitar',
    members: [{ name: 'Channelle Castillo‑Brocke' }],
  },
  {
    role: 'Bass',
    members: [{ name: 'Justin Kent' }],
  },
  {
    role: 'Keys',
    members: [{ name: 'Seth Holmes' }, { name: 'Joslyn Frye' }],
  },
]

const av: RoleLine[] = [
  {
    role: 'Pro Presenter',
    members: [{ name: 'Will Frye' }],
  },
  {
    role: 'Camera Operators',
    members: [{ name: 'May Winters' }, { name: 'Roger Wes' }],
  },
  {
    role: 'Light Operator',
    members: [{ name: 'Sheila Calo' }, { name: 'Eli Martin' }],
  },
]

const TeamBlock = defineComponent({
  name: 'TeamBlock',
  props: {
    title: { type: String, required: true },
    stats: { type: Object as any, required: true },
    roles: { type: Array as any, required: true },
    alert: { type: String, default: '' },
  },
  emits: ['send'],
  setup(props) {
    function send() {
      // UI only (placeholder)
      // Later: call /api/email/send or similar
      window.alert('Send emails (prototype)')
    }

    return { send, props }
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

      <div class="mt-4 space-y-3">
        <div v-for="r in roles" :key="r.role" class="border border-gray-100 rounded-lg">
          <div class="px-3 py-2 bg-gray-50 rounded-t-lg text-sm font-semibold text-gray-800">{{ r.role }}</div>
          <div class="px-3 py-2 space-y-2">
            <div v-for="m in r.members" :key="m.name" class="flex items-center justify-between gap-3">
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

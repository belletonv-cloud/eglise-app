<template>
  <div class="mx-auto max-w-7xl p-4 pb-24 md:pb-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Songs</h2>
        <div class="mt-1 flex items-center gap-3 text-sm text-gray-500">
          <span class="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Teams</span>
          <span class="rounded-full bg-gray-100 px-2 py-0.5">Add text filter</span>
          <span class="font-medium text-gray-700">{{ filteredSongs.length }} songs</span>
        </div>
      </div>
      <button
        v-if="canEdit"
        @click="showCreate = true"
        class="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        + {{ $t('songs.new_song') }}
      </button>
    </div>

    <div v-if="loading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
      <div class="h-8 w-80 rounded bg-gray-200"></div>
      <div class="h-5 w-72 rounded bg-gray-100"></div>
      <div class="h-16 w-[340px] rounded bg-gray-100"></div>
      <span class="mt-4 text-gray-400">{{ $t('loading') }}</span>
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-red-700">{{ error }}</div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="space-y-5 text-sm">
          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Teams</h3>
            <div class="space-y-2">
              <label v-for="team in teams" :key="team.id" class="flex items-center gap-2 text-gray-700">
                <input type="checkbox" :checked="selectedTeamIds.includes(Number(team.id))" @change="toggleTeam(Number(team.id))" />
                <span>{{ team.name }}</span>
              </label>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                class="rounded-full border px-2 py-1 text-xs"
                :class="selectedTags.includes(tag) ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600'"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Dates</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2"><input v-model="dateFilter" type="radio" value="all" /> All</label>
              <label class="flex items-center gap-2"><input v-model="dateFilter" type="radio" value="recent" /> Last 90 days</label>
              <label class="flex items-center gap-2"><input v-model="dateFilter" type="radio" value="year" /> This year</label>
              <label class="flex items-center gap-2"><input v-model="dateFilter" type="radio" value="stale" /> Older</label>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Keys</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="k in availableKeys"
                :key="k"
                type="button"
                class="rounded-full border px-2 py-1 text-xs"
                :class="selectedKeys.includes(k) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'"
                @click="toggleKey(k)"
              >
                {{ k }}
              </button>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Themes</h3>
            <div class="space-y-2">
              <label v-for="theme in availableThemes" :key="theme" class="flex items-center gap-2">
                <input type="checkbox" :checked="selectedThemes.includes(theme)" @change="toggleTheme(theme)" />
                <span>{{ theme }}</span>
              </label>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Usage</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2"><input v-model="usageFilter" type="radio" value="all" /> All</label>
              <label class="flex items-center gap-2"><input v-model="usageFilter" type="radio" value="used" /> Recently used</label>
              <label class="flex items-center gap-2"><input v-model="usageFilter" type="radio" value="unused" /> Not used</label>
            </div>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-gray-700">Permissions</h3>
            <div class="space-y-2">
              <label v-for="perm in permissionFilters" :key="perm" class="flex items-center gap-2">
                <input type="checkbox" :checked="selectedPermissions.includes(perm)" @change="togglePermission(perm)" />
                <span>{{ perm }}</span>
              </label>
            </div>
          </section>
        </div>
      </aside>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 bg-gray-50/80 dark:bg-gray-800/50 p-4">
          <div class="relative max-w-xl">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            <input
              v-model="search"
              type="search"
              :placeholder="$t('songs.search_placeholder')"
              class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div v-if="filteredSongs.length === 0" class="px-4 py-10 text-center text-sm text-gray-500">
          {{ search ? $t('songs.no_results') : $t('songs.no_songs') }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Title</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Key</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Last Used</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Last Edited</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tags</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="song in pagedSongs"
                :key="song.id"
                class="cursor-pointer hover:bg-gray-50"
                @click="goToSong(song.id)"
              >
                <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{{ song.title }}</td>
                <td class="px-4 py-3 text-gray-600">{{ song.primary_key || '—' }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDate(song.last_used) }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDate(song.last_edited) }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in parseThemes(song.themes).slice(0, 3)"
                      :key="`${song.id}-${tag}`"
                      class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="parseThemes(song.themes).length === 0" class="text-xs text-gray-400">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredSongs.length > pageSize" class="flex items-center justify-center gap-2 py-4">
          <button type="button" @click="goPrev" :disabled="page === 1" class="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50">
            Précédent
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            @click="page = p"
            :class="['rounded px-3 py-1', p === page ? 'bg-blue-600 text-white' : 'bg-gray-100']"
          >
            {{ p }}
          </button>
          <button type="button" @click="goNext" :disabled="page === totalPages" class="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50">
            Suivant
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showCreate = false">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{{ $t('songs.new_song') }}</h3>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ $t('songs.song_title') }} *</label>
              <input
                v-model="form.title"
                type="text"
                autofocus
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                :placeholder="$t('songs.song_title')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ $t('songs.author') }}</label>
              <input v-model="form.author" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ $t('songs.ccli') }}</label>
              <input
                v-model="form.ccli_number"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="123456"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ $t('songs.themes') }}</label>
              <input
                v-model="form.themes"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                :placeholder="$t('songs.themes_placeholder')"
              />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button @click="showCreate = false" class="cursor-pointer rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
              {{ $t('cancel') }}
            </button>
            <button
              @click="createSong"
              :disabled="creating || !form.title.trim()"
              class="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ creating ? $t('saving') : $t('songs.create_song') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api, authenticatedFetch, getApiBase } from '../utils/api'
import { showToast } from '../stores/toast'
import { member } from '../stores/member'
import type { Song, Team } from '../utils/types'

const { t } = useI18n()
const router = useRouter()

const songs = ref<Song[]>([])
const teams = ref<Team[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const showCreate = ref(false)
const creating = ref(false)
const page = ref(1)
const pageSize = 20
const selectedTeamIds = ref<number[]>([])
const selectedTags = ref<string[]>([])
const selectedThemes = ref<string[]>([])
const selectedKeys = ref<string[]>([])
const selectedPermissions = ref<string[]>([])
const dateFilter = ref<'all' | 'recent' | 'year' | 'stale'>('all')
const usageFilter = ref<'all' | 'used' | 'unused'>('all')
const permissionFilters = ['admin', 'music_director', 'editor', 'viewer']
const form = ref({ title: '', author: '', ccli_number: '', themes: '' })

const canEdit = computed(() =>
  member.value?.role === 'admin' ||
  member.value?.role === 'music_director' ||
  member.value?.role === 'editor',
)

const parseThemes = (themes?: string) =>
  (themes || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const availableThemes = computed(() => {
  const all = new Set<string>()
  for (const song of songs.value) {
    for (const th of parseThemes(song.themes)) all.add(th)
  }
  return Array.from(all).sort((a, b) => a.localeCompare(b))
})

const availableTags = computed(() => availableThemes.value.slice(0, 12))

const availableKeys = computed(() => {
  const keys = new Set<string>()
  for (const song of songs.value) {
    if (song.primary_key) keys.add(song.primary_key)
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b))
})

const filteredSongs = computed(() => {
  const q = search.value.trim().toLowerCase()
  const now = new Date()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(now.getDate() - 90)

  return songs.value.filter((song) => {
    if (q && !song.title?.toLowerCase().includes(q) && !song.author?.toLowerCase().includes(q)) {
      return false
    }

    if (selectedTeamIds.value.length > 0) {
      // Placeholder for future team-song mapping; keep filter block to mirror PCO UI.
    }

    const songThemes = parseThemes(song.themes)
    if (selectedTags.value.length > 0 && !selectedTags.value.some((tag) => songThemes.includes(tag))) {
      return false
    }
    if (selectedThemes.value.length > 0 && !selectedThemes.value.some((theme) => songThemes.includes(theme))) {
      return false
    }

    if (selectedKeys.value.length > 0 && (!song.primary_key || !selectedKeys.value.includes(song.primary_key))) {
      return false
    }

    if (selectedPermissions.value.length > 0) {
      const role = (member.value?.role || 'viewer').toLowerCase()
      if (!selectedPermissions.value.some((perm) => role.includes(perm))) return false
    }

    const lastUsed = song.last_used ? new Date(`${song.last_used}T12:00:00`) : null
    if (dateFilter.value === 'recent' && (!lastUsed || lastUsed < ninetyDaysAgo)) return false
    if (dateFilter.value === 'year' && (!lastUsed || lastUsed.getFullYear() !== now.getFullYear())) return false
    if (dateFilter.value === 'stale' && (!lastUsed || lastUsed.getFullYear() >= now.getFullYear())) return false

    if (usageFilter.value === 'used' && !song.last_used) return false
    if (usageFilter.value === 'unused' && song.last_used) return false

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSongs.value.length / pageSize)))
const pagedSongs = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredSongs.value.slice(start, start + pageSize)
})

const formatDate = (value?: string) => {
  if (!value) return '—'
  const dt = new Date(`${value}T12:00:00`)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function goToSong(id: number) {
  router.push({ name: 'song-detail', params: { id: String(id) } })
}

function goPrev() {
  if (page.value > 1) page.value--
}

function goNext() {
  if (page.value < totalPages.value) page.value++
}

function toggleTeam(teamId: number) {
  if (selectedTeamIds.value.includes(teamId)) {
    selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== teamId)
  } else {
    selectedTeamIds.value = [...selectedTeamIds.value, teamId]
  }
  page.value = 1
}

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((v) => v !== tag)
  } else {
    selectedTags.value = [...selectedTags.value, tag]
  }
  page.value = 1
}

function toggleTheme(theme: string) {
  if (selectedThemes.value.includes(theme)) {
    selectedThemes.value = selectedThemes.value.filter((v) => v !== theme)
  } else {
    selectedThemes.value = [...selectedThemes.value, theme]
  }
  page.value = 1
}

function toggleKey(key: string) {
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((v) => v !== key)
  } else {
    selectedKeys.value = [...selectedKeys.value, key]
  }
  page.value = 1
}

function togglePermission(permission: string) {
  if (selectedPermissions.value.includes(permission)) {
    selectedPermissions.value = selectedPermissions.value.filter((v) => v !== permission)
  } else {
    selectedPermissions.value = [...selectedPermissions.value, permission]
  }
  page.value = 1
}

async function loadSongs() {
  loading.value = true
  error.value = ''
  try {
    const [songData, teamData] = await Promise.all([api.getSongs(), api.getTeams()])
    songs.value = (songData || []) as Song[]
    teams.value = (teamData || []) as Team[]
  } catch (e: any) {
    error.value = e.message || 'Erreur lors du chargement des chants'
    songs.value = []
    teams.value = []
  } finally {
    loading.value = false
  }
}

async function createSong() {
  if (!form.value.title.trim()) return
  creating.value = true
  try {
    const res = await authenticatedFetch(`${getApiBase()}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.value.title.trim(),
        author: form.value.author.trim() || null,
        ccli_number: form.value.ccli_number.trim() || null,
        themes: form.value.themes.trim() || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const song = await res.json()
    showCreate.value = false
    form.value = { title: '', author: '', ccli_number: '', themes: '' }
    router.push({ name: 'song-detail', params: { id: String(song.id) } })
  } catch (e: any) {
    showToast(e.message || t('songs.create_error'), 'error')
  } finally {
    creating.value = false
  }
}

onMounted(loadSongs)

watch(totalPages, (next) => {
  if (page.value > next) page.value = next
})
</script>

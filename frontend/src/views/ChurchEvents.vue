<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('churchEvents.title') }}</h1>
    </div>

    <div class="flex gap-2 mb-4">
      <button @click="filter = 'all'" class="px-3 py-1.5 rounded-lg text-sm" :class="filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">{{ $t('churchEvents.all') }}</button>
      <button @click="filter = 'cieuxouverts.bzh'" class="px-3 py-1.5 rounded-lg text-sm" :class="filter === 'cieuxouverts.bzh' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">Cieux Ouverts</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>

    <div v-else class="space-y-6">
      <!-- Récurrents -->
      <div v-if="recurring.length" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">🔄 {{ $t('churchEvents.recurring') }}</h2>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="ev in recurring" :key="ev.originalId + '-' + ev.date"
            class="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-750">
            <div class="p-3">
              <div class="flex items-start justify-between">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm flex-1">{{ ev.title }}</h3>
                <button @click="openActions(ev)" class="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">⚙️</button>
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>📆 {{ ev.dateLabel }}</span>
                <span v-if="ev.startTime">🕐 {{ ev.startTime }}</span>
              </div>
              <div v-if="ev.location" class="text-xs text-gray-500 dark:text-gray-400 mt-1">📍 {{ ev.location }}</div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{{ ev.ruleLabel }}</span>
                <span v-if="ev.cancelled" class="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Annulé</span>
                <span v-if="ev.moved" class="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Décalé → {{ ev.movedTo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ponctuels -->
      <div v-if="oneTime.length" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">📌 Événements ponctuels</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="ev in oneTime" :key="ev.id"
            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
            :class="{ 'opacity-60': ev.status === 'cancelled' }">
            <img v-if="ev.image_url" :src="ev.image_url" :alt="ev.title" class="w-full h-32 object-cover" loading="lazy" />
            <div v-else class="w-full h-32 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span class="text-white text-3xl">📌</span>
            </div>
            <div class="p-3">
              <div class="flex items-start justify-between">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm flex-1">{{ ev.title }}</h3>
                <button @click="openOneTimeActions(ev)" class="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">⚙️</button>
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>📆 {{ formatDate(ev.start_date) }}</span>
                <span v-if="ev.start_time">🕐 {{ ev.start_time }}</span>
              </div>
              <div v-if="ev.location" class="text-xs text-gray-500 dark:text-gray-400 mt-1">📍 {{ ev.location }}</div>
              <span v-if="ev.status === 'cancelled'" class="inline-block mt-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Annulé</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal actions récurrent -->
    <div v-if="showActionsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showActionsModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">⚙️ {{ selectedEvent?.title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ selectedEvent?.ruleLabel }} — {{ selectedEvent?.dateLabel }}</p>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Périodicité</label>
            <select v-model="actionForm.repeat_period" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
              <option value="week">Hebdomadaire</option>
              <option value="month">Mensuel</option>
              <option value="">Ponctuel (plus de récurrence)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('churchEvents.cancel_occurrence') }}</label>
            <div class="flex gap-2">
              <input v-model="actionForm.cancelDate" type="date" class="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
              <button @click="cancelOccurrence" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm cursor-pointer">{{ $t('churchEvents.cancel') }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Décaler cette occurrence</label>
            <div class="flex gap-2">
              <input v-model="actionForm.moveDate" type="date" class="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
              <button @click="moveOccurrence" class="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm cursor-pointer">Décaler</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison (optionnel)</label>
            <input v-model="actionForm.reason" type="text" placeholder="Férié, intempéries..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button @click="showActionsModal = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-sm">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal actions ponctuel -->
    <div v-if="showOneTimeActionsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showOneTimeActionsModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">⚙️ {{ selectedOneTime?.title }}</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouvelle date</label>
            <input v-model="oneTimeForm.newDate" type="date" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison (optionnel)</label>
            <input v-model="oneTimeForm.reason" type="text" placeholder="Salle indisponible..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
          </div>

          <div class="flex gap-2">
            <button @click="cancelOneTime" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer text-sm">{{ $t('churchEvents.cancel_event') }}</button>
            <button @click="moveOneTime" class="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer text-sm">{{ $t('churchEvents.cancel_occurrence').replace('Annuler', 'Décaler') }}</button>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button @click="showOneTimeActionsModal = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-sm">Fermer</button>
        </div>
      </div>
    </div>

    <div v-if="!loading && recurring.length === 0 && oneTime.length === 0" class="text-center py-12 text-gray-400">{{ $t('churchEvents.nothing') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t, locale } = useI18n()

const items = ref<any[]>([])
const loading = ref(true)
const filter = ref('all')

const showActionsModal = ref(false)
const showOneTimeActionsModal = ref(false)
const selectedEvent = ref<any>(null)
const selectedOneTime = ref<any>(null)
const actionForm = ref({ repeat_period: 'week', cancelDate: '', moveDate: '', reason: '' })
const oneTimeForm = ref({ newDate: '', reason: '' })

const filtered = computed(() => {
  if (filter.value === 'all') return items.value
  return items.value.filter(i => i.source === filter.value)
})

function dayOfWeek(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

function weekOfMonth(date: Date): number {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const day = date.getDate()
  const dow = dayOfWeek(first)
  return Math.ceil((day + dow) / 7)
}

function isLastWeekOfMonth(date: Date): boolean {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7)
  return next.getMonth() !== date.getMonth()
}

function dayNameFr(dow: number): string {
  return (['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][dow]) || ''
}

function ordinalFr(n: number): string {
  const map: Record<number, string> = { 1: '1er', 2: '2e', 3: '3e', 4: '4e', 5: '5e' }
  return map[n] || `${n}e`
}

function isCancelled(eventId: number, date: string): boolean {
  const ev = items.value.find(e => e.id === eventId)
  if (!ev?.exceptions) return false
  return ev.exceptions.some((ex: any) => ex.exception_date === date && ex.type === 'cancelled')
}

function getMovedTo(eventId: number, date: string): string | null {
  const ev = items.value.find(e => e.id === eventId)
  if (!ev?.exceptions) return null
  const ex = ev.exceptions.find((e: any) => e.exception_date === date && e.type === 'moved')
  return ex?.new_date || null
}

function generateRecurringDates(ev: any, count: number = 6): any[] {
  const start = new Date(ev.start_date + 'T00:00:00')
  const results: any[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (ev.repeat_period === 'week') {
    let d = new Date(start)
    while (results.length < count) {
      if (d >= now) {
        const dateStr = d.toISOString().slice(0, 10)
        results.push({
          originalId: ev.id,
          title: ev.title,
          date: dateStr,
          dateLabel: formatDate(dateStr),
          startTime: ev.start_time,
          location: ev.location,
          ruleLabel: `Chaque ${dayNameFr(dayOfWeek(d))}`,
          image_url: ev.image_url,
          cancelled: isCancelled(ev.id, dateStr),
          moved: !!getMovedTo(ev.id, dateStr),
          movedTo: getMovedTo(ev.id, dateStr) ? formatDate(getMovedTo(ev.id, dateStr)!) : null,
        })
      }
      d.setDate(d.getDate() + 7)
    }
  } else if (ev.repeat_period === 'month') {
    const dow = dayOfWeek(start)
    const wom = weekOfMonth(start)
    const last = isLastWeekOfMonth(start)
    let year = start.getFullYear()
    let month = start.getMonth()

    while (results.length < count) {
      let targetDate: Date | null = null

      if (last) {
        const lastDay = new Date(year, month + 1, 0).getDate()
        for (let day = lastDay; day >= 1; day--) {
          const candidate = new Date(year, month, day)
          if (dayOfWeek(candidate) === dow && isLastWeekOfMonth(candidate)) {
            targetDate = candidate
            break
          }
        }
      } else {
        let found = 0
        for (let day = 1; day <= 31; day++) {
          const candidate = new Date(year, month, day)
          if (candidate.getMonth() !== month) break
          if (dayOfWeek(candidate) === dow) {
            found++
            if (found === wom) {
              targetDate = candidate
              break
            }
          }
        }
      }

      if (targetDate && targetDate >= now) {
        const dateStr = targetDate.toISOString().slice(0, 10)
        results.push({
          originalId: ev.id,
          title: ev.title,
          date: dateStr,
          dateLabel: formatDate(dateStr),
          startTime: ev.start_time,
          location: ev.location,
          ruleLabel: last ? `Dernier ${dayNameFr(dow)} du mois` : `${ordinalFr(wom)} ${dayNameFr(dow)} du mois`,
          image_url: ev.image_url,
          cancelled: isCancelled(ev.id, dateStr),
          moved: !!getMovedTo(ev.id, dateStr),
          movedTo: getMovedTo(ev.id, dateStr) ? formatDate(getMovedTo(ev.id, dateStr)!) : null,
        })
      }

      month++
      if (month > 11) { month = 0; year++ }
    }
  }

  return results
}

const recurring = computed(() => {
  const all: any[] = []
  for (const ev of filtered.value) {
    if (ev.repeat_period && ev.status !== 'cancelled') {
      all.push(...generateRecurringDates(ev))
    }
  }
  all.sort((a, b) => a.date.localeCompare(b.date))
  return all.slice(0, 18)
})

const oneTime = computed(() => {
  const now = new Date().toISOString().slice(0, 10)
  return filtered.value
    .filter(ev => (!ev.repeat_period || ev.status === 'cancelled') && ev.start_date >= now)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
})

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

async function openActions(ev: any) {
  selectedEvent.value = ev
  actionForm.value = { repeat_period: '', cancelDate: ev.date, moveDate: '', reason: '' }
  showActionsModal.value = true
}

async function openOneTimeActions(ev: any) {
  selectedOneTime.value = ev
  oneTimeForm.value = { newDate: ev.start_date, reason: '' }
  showOneTimeActionsModal.value = true
}

async function cancelOccurrence() {
  if (!selectedEvent.value || !actionForm.value.cancelDate) return
  try {
    await api.createChurchEventException(selectedEvent.value.originalId, {
      type: 'cancelled',
      exception_date: actionForm.value.cancelDate,
      reason: actionForm.value.reason,
    })
    showToast('Occurrence annulée')
    showActionsModal.value = false
    await load()
  } catch (e: any) { showToast(e.message, 'error') }
}

async function moveOccurrence() {
  if (!selectedEvent.value || !actionForm.value.moveDate) return
  try {
    await api.createChurchEventException(selectedEvent.value.originalId, {
      type: 'moved',
      exception_date: actionForm.value.cancelDate,
      new_date: actionForm.value.moveDate,
      reason: actionForm.value.reason,
    })
    showToast('Occurrence décalée')
    showActionsModal.value = false
    await load()
  } catch (e: any) { showToast(e.message, 'error') }
}

async function cancelOneTime() {
  if (!selectedOneTime.value) return
  try {
    await api.updateChurchEvent(selectedOneTime.value.id, { status: 'cancelled' })
    showToast('Événement annulé')
    showOneTimeActionsModal.value = false
    await load()
  } catch (e: any) { showToast(e.message, 'error') }
}

async function moveOneTime() {
  if (!selectedOneTime.value || !oneTimeForm.value.newDate) return
  try {
    await api.updateChurchEvent(selectedOneTime.value.id, { start_date: oneTimeForm.value.newDate })
    showToast('Événement décalé')
    showOneTimeActionsModal.value = false
    await load()
  } catch (e: any) { showToast(e.message, 'error') }
}

const load = async () => {
  try {
    const events = await api.getChurchEvents(undefined, true)
    items.value = events
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(load)
</script>

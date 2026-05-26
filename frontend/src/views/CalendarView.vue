<template>
  <div class="calendar">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('calendar.title') }}</h2>
      <ContextHelp :text="$t('help.calendar')" />
    </div>

    <div v-if="isLoading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
      <div class="w-80 h-8 bg-gray-200 rounded"></div>
      <div class="w-72 h-5 bg-gray-100 rounded"></div>
      <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
      <div class="w-80 h-12 bg-gray-200 rounded"></div>
      <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
    </div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else>
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <button @click="prev" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600">&larr;</button>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mx-2 min-w-[180px] text-center">{{ periodLabel }}</h3>
          <button @click="next" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600">&rarr;</button>
        </div>
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button v-for="v in views" :key="v.key" @click="currentView = v.key"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer"
            :class="currentView === v.key ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'">
            {{ v.label }}
          </button>
        </div>
      </div>

      <!-- Month view -->
      <template v-if="currentView === 'month'">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div v-for="d in dayNames" :key="d" class="bg-gray-50 dark:bg-gray-800 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{{ d }}</div>
          <div v-for="(day, i) in calendarDays" :key="i"
            @click="createPlan(day)"
            class="bg-white dark:bg-gray-900 min-h-[70px] md:min-h-[100px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            :class="{ 'text-gray-400': !day.isCurrentMonth, 'bg-blue-50/30 dark:bg-blue-900/10': isToday(day.date) }">
            <div class="text-xs font-medium mb-1 flex items-center justify-center" :class="isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="item in day.items" :key="item.id"
                @click.stop="handleItemClick(item)"
                class="text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight"
                :class="itemColor(item)">
                {{ item.emoji || '' }} {{ item.title }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Week view -->
      <template v-if="currentView === 'week'">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div v-for="d in dayNames" :key="d" class="bg-gray-50 dark:bg-gray-800 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{{ d }}</div>
          <div v-for="day in weekDays" :key="day.date"
            class="bg-white dark:bg-gray-900 min-h-[120px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            :class="{ 'bg-blue-50/30 dark:bg-blue-900/10': isToday(day.date) }">
            <div class="text-xs font-medium mb-1 flex items-center justify-center"
              :class="isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="item in day.items" :key="item.id"
                @click.stop="handleItemClick(item)"
                class="text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight"
                :class="itemColor(item)">
                {{ item.emoji || '' }} {{ item.title }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Cards view -->
      <template v-if="currentView === 'cards'">
        <div class="space-y-4">
          <div v-for="item in sortedItems" :key="item.id" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-4 flex gap-4 items-start">
              <div class="flex flex-col items-center justify-center min-w-[56px] bg-blue-600 rounded-lg py-2 px-3 text-white flex-shrink-0">
                <span class="text-xl font-black leading-none">{{ formatDay(item.date) }}</span>
                <span class="text-[0.6rem] font-bold uppercase opacity-85 mt-0.5">{{ formatMonth(item.date) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.title }}</h3>
                  <span class="text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0"
                    :class="item.type === 'plan' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'">
                    {{ item.type === 'plan' ? 'Service' : 'Événement' }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  <span v-if="item.time">🕙 {{ item.time }}</span>
                  <span v-if="item.location">📍 {{ item.location }}</span>
                </div>
                <p v-if="item.description" class="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{{ item.description }}</p>
                <div class="flex gap-2 mt-2 flex-wrap">
                  <button v-if="item.type === 'plan'" @click="goToPlan(item.planId)" class="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                    {{ $t('plan.edit') }}
                  </button>
                  <a v-if="item.link" :href="item.link" target="_blank" rel="noopener" class="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
                    En savoir plus
                  </a>
                  <a v-if="item.ticketUrl" :href="item.ticketUrl" target="_blank" rel="noopener" class="text-xs px-2.5 py-1 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 inline-block">
                    🎟️ Billetterie
                  </a>
                </div>
              </div>
            </div>
          </div>
          <p v-if="sortedItems.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-12">{{ $t('churchEvents.nothing') }}</p>
        </div>
      </template>

      <!-- Agenda view -->
      <template v-if="currentView === 'agenda'">
        <div class="space-y-8">
          <div v-for="group in groupedByDate" :key="group.key" class="border-l-3 border-blue-600 pl-4">
            <h3 class="text-base font-bold text-blue-700 dark:text-blue-400 mb-3 capitalize">{{ group.label }}</h3>
            <div v-for="item in group.items" :key="item.id" class="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <span class="text-sm text-gray-500 dark:text-gray-400 font-semibold min-w-[50px] flex-shrink-0 pt-0.5">{{ item.time || '—' }}</span>
              <div class="flex-1">
                <div class="flex items-start gap-2">
                  <strong class="text-sm text-gray-800 dark:text-gray-200">{{ item.title }}</strong>
                  <span class="text-[0.6rem] px-1 py-0.5 rounded font-medium"
                    :class="item.type === 'plan' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'">
                    {{ item.type === 'plan' ? 'Service' : '' }}
                  </span>
                </div>
                <span v-if="item.location" class="text-xs text-gray-500 dark:text-gray-400">📍 {{ item.location }}</span>
                <p v-if="item.description" class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ item.description }}</p>
              </div>
              <button v-if="item.type === 'plan'" @click="goToPlan(item.planId)" class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 shrink-0 self-start cursor-pointer">
                {{ $t('plan.edit') }}
              </button>
            </div>
          </div>
          <p v-if="sortedItems.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-12">{{ $t('churchEvents.nothing') }}</p>
        </div>
      </template>
    </template>

    <PlanForm v-if="showForm" :date="selectedDate" @close="showForm = false" @saved="onPlanSaved" />
  </div>
</template>

<script setup lang="ts">
import ContextHelp from '../components/ContextHelp.vue';
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import PlanForm from '../components/PlanForm.vue'

const router = useRouter()
const { t, tm } = useI18n()
const plans = ref<any[]>([])
const events = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')
const showForm = ref(false)
const selectedDate = ref('')
const currentDate = ref(new Date())
const currentView = ref('month')

const views = [
  { key: 'month', label: 'Mois' },
  { key: 'week', label: 'Semaine' },
  { key: 'cards', label: 'Cartes' },
  { key: 'agenda', label: 'Ordre du jour' },
]

const dayNames = computed(() => tm('dayNames') as unknown as string[])
const monthNames = computed(() => tm('monthFull') as unknown as string[])

const monthLabel = computed(() => {
  const d = currentDate.value
  return `${monthNames.value[d.getMonth()]} ${d.getFullYear()}`
})

const periodLabel = computed(() => {
  if (currentView.value === 'week') {
    const wd = weekDays.value
    if (!wd.length) return monthLabel.value
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    return `${formatDateLabel(wd[0].dateObj, opts)} — ${formatDateLabel(wd[wd.length - 1].dateObj, opts)}`
  }
  return monthLabel.value
})

const firstDayOfMonth = computed(() => {
  const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  return (d.getDay() + 6) % 7
})

const daysInMonth = computed(() => {
  return new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0).getDate()
})

const weekDays = computed(() => {
  const d = new Date(currentDate.value)
  const dayOfWeek = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dayOfWeek)
  const days: any[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(d)
    date.setDate(date.getDate() + i)
    const dateStr = dateStrFromDate(date)
    days.push({
      date: dateStr,
      dateObj: date,
      day: date.getDate(),
      items: getItemsForDate(dateStr),
    })
  }
  return days
})

interface CalendarItem {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  emoji: string
  type: 'plan' | 'event'
  status: string
  link: string
  ticketUrl: string
  planId: number | null
}

const allItems = computed<CalendarItem[]>(() => {
  const items: CalendarItem[] = []
  for (const p of plans.value) {
    items.push({
      id: `plan-${p.id}`,
      title: p.service_type_name || t('calendar.service'),
      date: p.date,
      time: p.time || '',
      location: p.location || '',
      description: p.notes || '',
      emoji: '📋',
      type: 'plan',
      status: p.status || 'planned',
      link: '',
      ticketUrl: '',
      planId: p.id,
    })
  }
  for (const e of events.value) {
    if (e.status === 'cancelled') continue
    items.push({
      id: `event-${e.id}`,
      title: e.title,
      date: e.start_date,
      time: e.start_time || '',
      location: e.location || '',
      description: e.description || '',
      emoji: e.emoji || '📌',
      type: 'event',
      status: e.status || 'active',
      link: e.lien || '',
      ticketUrl: e.billetterie || '',
      planId: null,
    })
  }
  return items
})

const sortedItems = computed(() => {
  return [...allItems.value].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
})

function getItemsForDate(dateStr: string): CalendarItem[] {
  return allItems.value.filter(item => item.date === dateStr)
}

const calendarDays = computed(() => {
  const days: any[] = []
  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), -i)
    days.push({
      date: dateStrFromDate(d),
      day: d.getDate(),
      isCurrentMonth: false,
      items: getItemsForDate(dateStrFromDate(d)),
    })
  }
  for (let i = 1; i <= daysInMonth.value; i++) {
    const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), i)
    const dateStr = dateStrFromDate(d)
    days.push({
      date: dateStr,
      day: i,
      isCurrentMonth: true,
      items: getItemsForDate(dateStr),
    })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, i)
    days.push({
      date: dateStrFromDate(d),
      day: d.getDate(),
      isCurrentMonth: false,
      items: getItemsForDate(dateStrFromDate(d)),
    })
  }
  return days
})

const groupedByDate = computed(() => {
  const map: Record<string, { key: string; label: string; items: CalendarItem[] }> = {}
  for (const item of sortedItems.value) {
    const date = new Date(item.date + 'T00:00:00')
    const key = date.toDateString()
    if (!map[key]) {
      map[key] = {
        key,
        label: formatDateLabelFull(date),
        items: [],
      }
    }
    map[key].items.push(item)
  }
  return Object.values(map)
})

const eventColors = ['bg-blue-600', 'bg-red-500', 'bg-amber-500', 'bg-purple-600', 'bg-emerald-500']

function itemColor(item: CalendarItem): string {
  if (item.type === 'plan') {
    if (item.status === 'completed') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    if (item.status === 'cancelled') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
    return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
  }
  const idx = (item.title?.charCodeAt(0) || 0) % eventColors.length
  return eventColors[idx] + ' text-white'
}

function isToday(dateStr: string) {
  const now = new Date()
  return dateStr === dateStrFromDate(now)
}

function prev() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'week') d.setDate(d.getDate() - 7)
  else d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

function next() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'week') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}

function createPlan(day: any) {
  if (!day.isCurrentMonth) return
  selectedDate.value = day.date
  showForm.value = true
}

function goToPlan(id: number | null) {
  if (!id) return
  router.push({ name: 'plan-detail', params: { id: String(id) } })
}

function handleItemClick(item: CalendarItem) {
  if (item.type === 'plan') goToPlan(item.planId)
  else if (item.link) window.open(item.link, '_blank')
}

const onPlanSaved = () => {
  showForm.value = false
  loadData()
}

function dateStrFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return String(d.getDate()).padStart(2, '0')
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
}

function formatDateLabel(date: Date, opts?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'long' })
}

function formatDateLabelFull(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const loadData = async () => {
  try {
    isLoading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    const [plansData, eventsData] = await Promise.all([
      api.getPlans(month, year),
      api.getChurchEvents('include_exceptions=1').catch(() => []),
    ])
    plans.value = plansData
    events.value = eventsData
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
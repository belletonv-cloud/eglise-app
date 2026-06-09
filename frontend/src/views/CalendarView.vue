<template>
  <div class="calendar">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('calendar.title') }}</h2>
    </div>

    <div v-if="isLoading" class="py-12 flex flex-col gap-3 items-center animate-pulse" aria-busy="true">
      <div class="w-80 h-8 bg-gray-200 rounded"></div>
      <div class="w-72 h-5 bg-gray-100 rounded"></div>
      <div class="w-[340px] h-16 bg-gray-100 rounded"></div>
      <div class="w-80 h-12 bg-gray-200 rounded"></div>
      <span class="text-gray-400 mt-4">{{ $t('loading') }}</span>
    </div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <div v-else>
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <button @click="prev" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600">&larr;</button>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mx-2 min-w-[180px] text-center">{{ periodLabel }}</h3>
          <button @click="next" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600">&rarr;</button>
        </div>
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
          <button v-for="v in views" :key="v.key" @click="currentView = v.key"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer"
            :class="currentView === v.key ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'">
            {{ v.label }}
          </button>
        </div>
      </div>

      <!-- Month view -->
      <div v-if="currentView === 'month'">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div v-for="d in dayNames" :key="d" class="bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{{ d }}</div>
          <div v-for="(day, i) in calendarDays" :key="i"
            @click="createPlan(day)"
            class="bg-white dark:bg-gray-900 min-h-[70px] md:min-h-[100px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            :class="{ 'text-gray-400': !day.isCurrentMonth, 'bg-blue-50/30 dark:bg-blue-900/10': isToday(day.date) }">
            <div class="text-xs font-medium mb-1 flex items-center justify-center" :class="isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="item in day.items" :key="item.id"
                @click.stop="handleItemClick(item, $event)"
                class="text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight"
                :class="itemColor(item)">
                {{ item.emoji || '' }} {{ item.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week view -->
      <div v-if="currentView === 'week'">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div v-for="d in dayNames" :key="d" class="bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{{ d }}</div>
          <div v-for="day in weekDays" :key="day.date"
            class="bg-white dark:bg-gray-900 min-h-[120px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            :class="{ 'bg-blue-50/30 dark:bg-blue-900/10': isToday(day.date) }">
            <div class="text-xs font-medium mb-1 flex items-center justify-center"
              :class="isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="item in day.items" :key="item.id"
                @click.stop="handleItemClick(item, $event)"
                class="text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight"
                :class="itemColor(item)">
                {{ item.emoji || '' }} {{ item.title }}
              </div>
            </div>
      </div>
     </div>
    </div>

    <!-- Cards view -->
    <div v-if="currentView === 'cards'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow min-h-[280px]"
        @click="handleItemClick(item, $event)"
      >
        <div class="relative min-h-[160px] w-full">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="w-full h-40 object-cover bg-gray-100 dark:bg-gray-700" loading="lazy" />
          <div v-else class="w-full h-40 flex items-center justify-center bg-[#ebf0fa] dark:bg-gray-700">
            <svg width="58" height="58" viewBox="0 0 40 40" fill="#b8c7da"><circle cx="20" cy="20" r="18" stroke="#a6bed7" stroke-width="2" fill="#e9f0fa"/><path d="M12.5 27.5L20 15l7.5 12.5h-15z" fill="#b8c7da"/><rect x="17.2" y="18" width="5.6" height="5.5" rx="2.7" fill="#a6bed7"/></svg>
          </div>
          <div class="absolute top-2.5 left-3 flex flex-col items-center justify-center min-w-[46px] bg-[#064886]/97 rounded-lg px-1.5 py-1.5 text-white shadow-sm z-10">
            <span class="text-xl font-black leading-none">{{ formatDay(item.date) }}</span>
            <span class="text-[10px] font-bold tracking-wide opacity-85 uppercase">{{ formatMonth(item.date) }}</span>
          </div>
          <div v-if="item.type === 'plan'" class="absolute top-2.5 right-3 text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium z-10">
            {{ $t('calendar.service') }}
          </div>
        </div>
        <div class="flex-1 flex flex-col gap-1.5 px-4.5 py-3.5 pb-1">
          <h3 class="text-base font-bold text-[#064886] dark:text-blue-300 leading-tight">{{ item.title }}</h3>
          <div class="flex gap-3.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <span v-if="item.time">🕙 {{ item.time }}</span>
            <span v-if="item.location">📍 {{ item.location }}</span>
          </div>
          <p v-if="item.description" class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2" v-html="sanitizeHtml(item.description)"></p>
          <div v-if="item.link || item.ticketUrl" class="flex gap-2.5 flex-wrap mt-1">
            <a v-if="item.link" :href="item.link" target="_blank" rel="noopener" @click.stop
              class="inline-block px-4 py-1.5 bg-[#064886] text-white text-xs font-semibold rounded-md no-underline hover:bg-[#053870] transition-colors">En savoir plus</a>
            <a v-if="item.ticketUrl" :href="item.ticketUrl" target="_blank" rel="noopener" @click.stop
              class="inline-block px-4 py-1.5 bg-transparent border-2 border-[#064886] text-[#064886] dark:text-blue-300 dark:border-blue-300 text-xs font-semibold rounded-md no-underline hover:bg-[#064886] hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-colors">🎟️ Billetterie</a>
          </div>
        </div>
      </article>
      <p v-if="sortedItems.length === 0" class="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">{{ $t('no_results') }}</p>
    </div>

    <!-- Agenda view -->
    <div v-if="currentView === 'agenda'" class="flex flex-col gap-8">
      <div v-for="group in groupedByDate" :key="group.key" class="border-l-4 border-[#064886] dark:border-blue-500 pl-5">
        <h3 class="text-lg font-bold text-[#064886] dark:text-blue-300 mb-3 capitalize">{{ group.label }}</h3>
        <div class="flex flex-col">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors last:border-b-0"
            @click="handleItemClick(item, $event)"
          >
            <span class="flex-shrink-0 w-14 text-sm text-gray-500 dark:text-gray-400 font-semibold pt-0.5">{{ item.time || '—' }}</span>
            <div class="flex flex-col gap-0.5">
              <strong class="text-sm text-[#064886] dark:text-blue-300">{{ item.title }}</strong>
              <span v-if="item.location" class="text-xs text-gray-500 dark:text-gray-400">📍 {{ item.location }}</span>
              <p v-if="item.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5" v-html="sanitizeHtml(item.description)"></p>
            </div>
          </div>
        </div>
      </div>
      <p v-if="groupedByDate.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">{{ $t('no_results') }}</p>
    </div>

    <PlanForm v-if="showForm" :date="selectedDate" @close="showForm = false" @saved="onPlanSaved" />
    <EventModal
      v-if="selectedEvent"
      :model-value="!!selectedEvent"
      :title="selectedEvent.title"
      @close="selectedEvent = null"
      @update:model-value="v => { if (!v) selectedEvent = null }"
    >
      <template #default>
        <div v-if="selectedEvent.imageUrl" class="w-full max-w-[700px] mx-auto mb-5">
          <img :src="selectedEvent.imageUrl" :alt="selectedEvent.title" class="w-full h-[340px] object-contain rounded-xl bg-gray-100 dark:bg-gray-700" loading="lazy" />
        </div>
        <div class="w-full max-w-[610px] mx-auto mb-4 px-2">
          <div class="flex gap-4 flex-wrap items-center py-1.5 text-[#118e8e] dark:text-teal-400 text-base">
            <span v-if="selectedEvent.date">📅 {{ formatDateLabelFull(new Date(selectedEvent.date + 'T00:00:00')) }}</span>
            <span v-if="selectedEvent.time">🕙 {{ selectedEvent.time }}</span>
            <span v-if="selectedEvent.location">📍 {{ selectedEvent.location }}</span>
          </div>
          <div v-if="selectedEvent.description" class="py-1.5 text-gray-700 dark:text-gray-300 text-base leading-relaxed" v-html="selectedEvent.description"></div>
          <div v-if="selectedEvent.link || selectedEvent.ticketUrl" class="flex gap-2.5 flex-wrap mt-3.5">
            <a v-if="selectedEvent.link" :href="selectedEvent.link" target="_blank" rel="noopener" class="inline-block px-4 py-2 bg-[#064886] text-white text-sm font-semibold rounded-md no-underline hover:bg-[#053870] transition-colors">En savoir plus</a>
            <a v-if="selectedEvent.ticketUrl" :href="selectedEvent.ticketUrl" target="_blank" rel="noopener" class="inline-block px-4 py-2 bg-transparent border-2 border-[#064886] text-[#064886] dark:text-blue-300 dark:border-blue-300 text-sm font-semibold rounded-md no-underline hover:bg-[#064886] hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-colors">🎟️ Billetterie</a>
          </div>
        </div>
      </template>
    </EventModal>
  </div>
</div>

</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import PlanForm from '../components/PlanForm.vue'
import EventModal from '../components/EventModal.vue'

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

const selectedEvent = ref<CalendarItem | null>(null)

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
  imageUrl: string
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
      imageUrl: '',
    })
  }
  for (const e of events.value) {
    items.push({
      id: `event-${e.id}-${e._occurrenceKey || e.start_date}`,
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
      imageUrl: e.image_url || '',
    })
  }
  return items
})

const sortedItems = computed(() => {
  return [...allItems.value].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
})

const filteredItems = computed(() => {
  const d = currentDate.value
  return sortedItems.value.filter(item => {
    const ed = new Date(item.date + 'T00:00:00')
    return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
  })
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
  for (const item of filteredItems.value) {
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
  loadData()
}

function next() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'week') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  currentDate.value = d
  loadData()
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

function handleItemClick(item: CalendarItem, _evt?: MouseEvent) {
  if (item.type === 'plan') {
    goToPlan(item.planId)
    return
  }
  selectedEvent.value = item
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

function sanitizeHtml(text: string): string {
  if (typeof text !== 'string') return ''
  return text.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
}

function expandRecurring(ev: any, now: Date, maxCount: number): any[] {
  const start = new Date(ev.start_date + 'T00:00:00')
  const results: any[] = []
  let d = new Date(start)

  if (d < now) {
    if (ev.repeat_period === 'week') {
      while (d < now) d.setDate(d.getDate() + 7)
    } else if (ev.repeat_period === 'month') {
      while (d < now) d.setMonth(d.getMonth() + 1)
    }
  }

  let count = 0
  while (count < maxCount) {
    const dateStr = dateStrFromDate(d)

    const cancelled = ev.exceptions?.some((ex: any) => ex.exception_date === dateStr && ex.type === 'cancelled')
    const moved = ev.exceptions?.find((ex: any) => ex.exception_date === dateStr && ex.type === 'moved')

    if (!cancelled) {
      const targetDate = moved ? moved.new_date : dateStr
      results.push({ ...ev, start_date: targetDate, start_time: ev.start_time || '', _occurrenceKey: dateStr })
      count++
    }

    if (ev.repeat_period === 'week') {
      d.setDate(d.getDate() + 7)
    } else if (ev.repeat_period === 'month') {
      d.setMonth(d.getMonth() + 1)
    } else {
      break
    }
  }

  return results
}

const loadData = async () => {
  try {
    isLoading.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    const [plansData, eventsData] = await Promise.all([
      api.getPlans({ month, year }),
      api.getChurchEvents().catch(() => []),
    ])
    plans.value = plansData

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const expanded: any[] = []
    for (const ev of eventsData) {
      if (ev.status === 'cancelled') continue
      if (ev.repeat_period) {
        const occurrences = expandRecurring(ev, now, 12)
        expanded.push(...occurrences)
      } else {
        const evtDate = new Date(ev.start_date + 'T00:00:00')
        if (evtDate < now) continue
        expanded.push(ev)
      }
    }
    events.value = expanded
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
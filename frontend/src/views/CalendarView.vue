<template>
  <div class="calendar">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('calendar.title') }}</h2>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

    <template v-else>
      <div class="flex items-center justify-between mb-4">
        <button @click="prevMonth" class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">&larr;</button>
        <h3 class="text-lg font-semibold text-gray-700">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
        <button @click="nextMonth" class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">&rarr;</button>
      </div>

      <div class="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        <div v-for="d in dayNames" :key="d" class="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">
          {{ d }}
        </div>
        <div v-for="(day, i) in calendarDays" :key="i"
          @click="createPlan(day)"
          class="bg-white min-h-[60px] md:min-h-[100px] p-1 cursor-pointer hover:bg-blue-50 transition-colors"
          :class="{ 'text-gray-400': !day.isCurrentMonth, 'bg-blue-50/30': isToday(day.date) }">
          <div class="text-xs font-medium mb-1" :class="isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''">
            {{ day.day }}
          </div>
          <div v-for="plan in day.plans" :key="plan.id"
            @click.stop="goToPlan(plan.id)"
            class="text-xs px-1.5 py-0.5 mb-0.5 rounded truncate cursor-pointer"
            :class="statusClass(plan.status)">
            {{ plan.service_type_name || $t('calendar.service') }}
          </div>
        </div>
      </div>

      <PlanForm v-if="showForm" :date="selectedDate" @close="showForm = false" @saved="onPlanSaved" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import PlanForm from '../components/PlanForm.vue'

const router = useRouter()
const { t } = useI18n()
const plans = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const selectedDate = ref('')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const monthNames = computed(() => t('monthFull') as unknown as string[])
const dayNames = computed(() => t('dayNames') as unknown as string[])

const statusClass = (s: string) =>
  s === 'completed' ? 'bg-green-100 text-green-700' :
  s === 'cancelled' ? 'bg-red-100 text-red-700' :
  'bg-blue-100 text-blue-700'

const isToday = (dateStr: string) => {
  const today = new Date()
  const d = new Date(dateStr)
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7
  const days: any[] = []

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(currentYear.value, currentMonth.value, -i)
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false, plans: [] })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(currentYear.value, currentMonth.value, i)
    const dateStr = d.toISOString().slice(0, 10)
    days.push({
      date: dateStr,
      day: i,
      isCurrentMonth: true,
      plans: plans.value.filter(p => p.date === dateStr),
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentYear.value, currentMonth.value + 1, i)
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false, plans: [] })
  }

  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
  loadPlans()
}

const nextMonth = () => {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
  loadPlans()
}

const createPlan = (day: any) => {
  if (!day.isCurrentMonth) return
  selectedDate.value = day.date
  showForm.value = true
}

const goToPlan = (id: number) => {
  router.push({ name: 'plan-detail', params: { id: String(id) } })
}

const onPlanSaved = () => {
  showForm.value = false
  loadPlans()
}

const loadPlans = async () => {
  try {
    loading.value = true
    plans.value = await api.getPlans()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadPlans)
</script>

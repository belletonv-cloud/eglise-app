<template>
  <div class="card">
    <h3>{{$t('volunteerPreferences.title') || 'Disponibilités'}}</h3>
    <div v-if="loading" class="text-gray-500 py-2">{{$t('volunteerPreferences.loading')}}</div>
    <div v-else>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('volunteerPreferences.max_services')}}</label>
        <input v-model.number="form.max_services_per_month" type="number" min="1" max="31"
          class="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('volunteerPreferences.notes')}}</label>
        <textarea v-model="form.notes" rows="3"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{$t('volunteerPreferences.unavailable')}}</label>
        <div class="flex gap-2 mb-2" v-for="(d, i) in form.unavailable_dates" :key="i">
          <input type="date" v-model="form.unavailable_dates[i]"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2" />
          <button @click="form.unavailable_dates.splice(i, 1)"
            class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">{{$t('volunteerPreferences.remove_date')}}</button>
        </div>
        <button @click="form.unavailable_dates.push('')"
          class="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">{{$t('volunteerPreferences.add_date')}}</button>
      </div>
      <button @click="save" :disabled="saving"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
        {{ saving ? $t('volunteerPreferences.saving') : $t('volunteerPreferences.save') }}
      </button>
      <span v-if="saved" class="ml-3 text-green-600 text-sm">{{$t('volunteerPreferences.saved')}}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { useToast } from '../stores/toast'

const props = defineProps<{ memberId: number }>()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const form = ref({ max_services_per_month: 4, notes: '', unavailable_dates: [] as string[] })

async function load() {
  try {
    const prefs = await api.getVolunteerPreferences(props.memberId)
    form.value = {
      max_services_per_month: prefs.max_services_per_month || 4,
      notes: prefs.notes || '',
      unavailable_dates: JSON.parse(prefs.unavailable_dates || '[]'),
    }
  } catch {
    // Use defaults
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  saved.value = false
  try {
    await api.updateVolunteerPreferences(props.memberId, {
      max_services_per_month: form.value.max_services_per_month,
      notes: form.value.notes,
      unavailable_dates: JSON.stringify(form.value.unavailable_dates.filter(d => d.trim())),
    })
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } catch (e: any) {
    useToast().show(e.message || t('volunteerPreferences.error'), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
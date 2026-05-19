<template>
  <div class="member-detail" v-if="member">
    <button @click="$router.push('/members')" class="back-btn">{{ $t('memberDetail.back') }}</button>
    <h1>{{ member.first_name }} {{ member.last_name }}</h1>

    <div class="card">
      <h3>{{ $t('memberDetail.info') }}</h3>
      <p><strong>{{ $t('memberDetail.email') }} :</strong> {{ member.email || '-' }}</p>
      <p><strong>{{ $t('memberDetail.phone') }} :</strong> {{ member.phone || '-' }}</p>
      <p><strong>{{ $t('memberDetail.status') }} :</strong> <span class="badge" :class="member.membership_type">{{ typeLabel(member.membership_type) }}</span></p>
      <p><strong>{{ $t('memberDetail.notes') }} :</strong> {{ member.notes || '-' }}</p>
      <button @click="editing = !editing" class="edit-btn">{{ editing ? $t('memberDetail.cancel') : $t('memberDetail.edit') }}</button>
    </div>

    <div v-if="editing" class="card">
      <h3>{{ $t('memberDetail.edit_title') }}</h3>
      <form @submit.prevent="saveMember">
        <label>{{ $t('memberDetail.first_name') }} <input v-model="form.first_name" required /></label>
        <label>{{ $t('memberDetail.last_name') }} <input v-model="form.last_name" required /></label>
        <label>{{ $t('memberDetail.email') }} <input v-model="form.email" type="email" /></label>
        <label>{{ $t('memberDetail.phone') }} <input v-model="form.phone" /></label>
        <label>{{ $t('memberDetail.status') }}
          <select v-model="form.membership_type">
            <option value="guest">{{ $t('memberDetail.types.guest') }}</option>
            <option value="member">{{ $t('memberDetail.types.member') }}</option>
            <option value="inactive">{{ $t('memberDetail.types.inactive') }}</option>
          </select>
        </label>
        <label>{{ $t('memberDetail.notes') }} <textarea v-model="form.notes" rows="3"></textarea></label>
        <button type="submit" class="save-btn">{{ $t('memberDetail.save') }}</button>
      </form>
    </div>

    <div class="card" v-if="member.teams && member.teams.length > 0">
      <h3>{{ $t('memberDetail.teams_title', { count: member.teams.length }) }}</h3>
      <ul>
        <li v-for="t in member.teams" :key="t.id">
          <router-link :to="`/teams/${t.id}`">{{ t.name }}</router-link>
          <span v-if="t.position" class="position">— {{ t.position }}</span>
          <button @click="leaveTeam(t.id)" class="ml-3 text-sm text-red-600">{{ $t('memberDetail.leave') }}</button>
        </li>
      </ul>
    </div>

    <div class="card">
      <h3>{{ $t('memberDetail.join_title') }}</h3>
      <div class="flex gap-2 items-center">
        <select v-model="joinTeamId" class="px-2 py-1 border rounded">
          <option :value="null">{{ $t('memberDetail.join_select') }}</option>
          <template v-for="t in teams" :key="t.id">
            <option :value="t.id" v-if="!member.teams?.find((x: any) => x.id === t.id)">{{ t.name }}</option>
          </template>
        </select>
        <input v-model="joinPosition" :placeholder="$t('memberDetail.join_position')" class="px-2 py-1 border rounded" />
        <button @click="joinTeam" class="px-3 py-1 bg-green-600 text-white rounded">{{ $t('memberDetail.join_button') }}</button>
      </div>
    </div>

    <VolunteerPreferences :member-id="Number(route.params.id)" />

    <div class="card">
      <h3>{{ $t('memberDetail.notifications') }}</h3>
      <NotificationPrefs :member-id="Number(route.params.id)" />
    </div>
  </div>
  <div v-else-if="loading" class="loading">{{ $t('memberDetail.loading') }}</div>
  <div v-else class="error">{{ error }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import NotificationPrefs from '../components/NotificationPrefs.vue'
import VolunteerPreferences from '../components/VolunteerPreferences.vue'
import { useToast } from '../stores/toast'

const { t } = useI18n()

const route = useRoute()
const member = ref<any>(null)
const loading = ref(true)
const error = ref('')
const editing = ref(false)
const form = ref<any>({})
const teams = ref<any[]>([])
const joinTeamId = ref<number | null>(null)
const joinPosition = ref('')

const typeLabel = (tl: string) => {
  const key = `memberDetail.types.${tl}`
  const translated = t(key)
  return translated === key ? tl : translated
}

async function load() {
  try {
    loading.value = true
    const id = Number(route.params.id)
    if (isNaN(id)) throw new Error(t('app.invalid_id'))
    member.value = await api.getMember(id)
    teams.value = await api.getTeams()
    form.value = { ...member.value }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveMember() {
  const id = Number(route.params.id)
  if (isNaN(id)) return
  await api.updateMember(id, form.value)
  editing.value = false
  load()
}

onMounted(load)

const { show } = useToast()

const leaveTeam = async (teamId: number) => {
  try {
    const id = Number(route.params.id)
    await api.removeTeamMember(teamId, id)
    show(t('memberDetail.removed'), 'success')
    await load()
  } catch (e: any) {
    show(e.message || t('memberDetail.error'), 'error')
  }
}

const joinTeam = async () => {
  try {
    if (!joinTeamId.value) return
    const id = Number(route.params.id)
    await api.addTeamMember(joinTeamId.value, id, joinPosition.value || undefined)
    show(t('memberDetail.joined'), 'success')
    joinTeamId.value = null
    joinPosition.value = ''
    await load()
  } catch (e: any) {
    show(e.message || t('memberDetail.error'), 'error')
  }
}
</script>

<style scoped>
.member-detail { max-width: 700px; margin: 0 auto; }
.back-btn { background: #7f8c8d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }
h1 { margin: 10px 0 20px; color: #2c3e50; }
.card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.card h3 { margin-top: 0; }
.card p { margin: 8px 0; }
.card label { display: block; margin-bottom: 12px; }
.card input, .card select, .card textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-top: 4px; box-sizing: border-box; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
.badge.member { background: #d4edda; color: #155724; }
.badge.guest { background: #fff3cd; color: #856404; }
.badge.inactive { background: #f8d7da; color: #721c24; }
.edit-btn, .save-btn { margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
.loading, .error { padding: 20px; text-align: center; }
</style>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ $t('polls.title') }}</h1>
      <button @click="showCreate = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        {{ $t('polls.new') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="polls.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">{{ $t('polls.no_polls') }}</div>

    <div v-else class="space-y-4">
      <div v-for="poll in polls" :key="poll.id"
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ poll.question }}</h3>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ poll.vote_count }} {{ $t('polls.votes') }} · {{ poll.max_votes }} {{ $t('polls.max_votes') }}</p>
          </div>
          <span v-if="poll.expires_at && poll.expires_at < now" class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{{ $t('polls.expired') }}</span>
        </div>

        <div class="space-y-2">
          <div v-for="opt in poll.options" :key="opt.id"
            @click="vote(poll, opt)"
            class="relative p-3 border rounded-lg cursor-pointer transition-colors"
            :class="poll.my_votes?.includes(opt.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-blue-300'">
            <div class="flex items-center justify-between relative z-10">
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ opt.label }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ getVoteCount(poll, opt.id) }} {{ $t('polls.voice') }}</span>
            </div>
            <div class="absolute inset-0 bg-blue-500/10 rounded-lg" :style="{ width: getVotePercent(poll, opt.id) + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{{ $t('polls.create_title') }}</h3>
        <form @submit.prevent="createPoll" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('polls.question') }}</label>
            <input v-model="form.question" required class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('polls.max_votes_label') }}</label>
            <input v-model.number="form.max_votes" type="number" min="1" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('polls.options_label') }}</label>
            <textarea v-model="form.optionsText" rows="4" :placeholder="$t('polls.options_placeholder')" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"></textarea>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showCreate = false" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{{ $t('polls.cancel') }}</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">{{ $t('polls.create') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../utils/api'
import { showToast } from '../stores/toast'

const { t } = useI18n()

const polls = ref<any[]>([])
const loading = ref(true)
const showCreate = ref(false)
const now = new Date().toISOString()
const form = ref({ question: '', max_votes: 1, optionsText: '' })

const getVoteCount = (poll: any, optionId: number) => {
  return poll.vote_count || 0
}

const getVotePercent = (poll: any, optionId: number) => {
  const total = poll.vote_count || 1
  const perOption = total / (poll.options?.length || 1)
  return Math.round((perOption / total) * 100)
}

const vote = async (poll: any, opt: any) => {
  if (poll.expires_at && poll.expires_at < new Date().toISOString()) {
    showToast(t('polls.expired_toast'), 'error')
    return
  }
  if (poll.my_votes?.includes(opt.id)) {
    try {
      await api.deleteVote(poll.id, opt.id)
      poll.my_votes = poll.my_votes.filter((v: number) => v !== opt.id)
      showToast(t('polls.vote_removed'))
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  } else {
    try {
      await api.createVote(poll.id, opt.id)
      poll.my_votes = [...(poll.my_votes || []), opt.id]
      showToast(t('polls.vote_saved'))
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }
}

const createPoll = async () => {
  try {
    const poll = await api.createPoll({
      question: form.value.question,
      max_votes: form.value.max_votes,
    })
    const options = form.value.optionsText.split('\n').filter(l => l.trim())
    for (const label of options) {
      await api.createPollOption(poll.id, label.trim())
    }
    showCreate.value = false
    form.value = { question: '', max_votes: 1, optionsText: '' }
    showToast(t('polls.created'))
    await loadPolls()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

const loadPolls = async () => {
  try {
    polls.value = await api.getPolls()
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(loadPolls)
</script>

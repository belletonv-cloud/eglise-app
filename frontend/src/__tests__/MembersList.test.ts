import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from './setup'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

const membersMocks = vi.hoisted(() => ({
  getMembers: vi.fn(),
  loadTeams: vi.fn(),
}))

vi.mock('../api/members', () => ({
  getMembers: membersMocks.getMembers,
}))

vi.mock('../composables/useTeams', async () => {
  const { ref } = await import('vue')
  return {
    useTeams: () => ({
      teams: ref([{ id: 4, name: 'Accueil' }]),
      loadTeams: membersMocks.loadTeams,
    }),
  }
})

vi.mock('../stores/member', async () => {
  const { ref } = await import('vue')
  return {
    isAdmin: ref(false),
    canManageMembers: ref(false),
  }
})

vi.mock('../stores/confirm', () => ({
  confirmDialog: vi.fn(async () => true),
}))

vi.mock('../stores/toast', () => ({
  showToast: vi.fn(),
}))

import MembersList from '../views/MembersList.vue'

describe('MembersList', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    membersMocks.getMembers.mockReset()
    membersMocks.loadTeams.mockReset()
    membersMocks.loadTeams.mockResolvedValue(undefined)
    membersMocks.getMembers.mockResolvedValue({ members: [], total: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('sends search query to the members API helper', async () => {
    const wrapper = mount(MembersList)
    await vi.runAllTimersAsync()
    await Promise.resolve()
    await Promise.resolve()

    expect(membersMocks.getMembers).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      q: '',
      teamId: null,
    })

    const searchInput = wrapper.find('input[type="search"]')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('marie')
    await vi.advanceTimersByTimeAsync(250)

    expect(membersMocks.getMembers).toHaveBeenLastCalledWith({
      page: 1,
      limit: 100,
      q: 'marie',
      teamId: null,
    })
  })
})

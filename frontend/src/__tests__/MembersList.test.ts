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

  it('sends search and team filters to the members API helper', async () => {
    const wrapper = mount(MembersList)
    await Promise.resolve()

    expect(membersMocks.getMembers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: '',
      teamId: null,
    })

    await wrapper.find('input[type="search"]').setValue('marie')
    await wrapper.find('select').setValue('4')
    await vi.advanceTimersByTimeAsync(250)

    expect(membersMocks.getMembers).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      q: 'marie',
      teamId: 4,
    })
  })
})

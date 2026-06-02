import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from './setup'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

const apiMocks = vi.hoisted(() => ({
  getTeams: vi.fn(),
  getTeam: vi.fn(),
}))

vi.mock('../utils/api', () => ({
  api: {
    getTeams: apiMocks.getTeams,
    getTeam: apiMocks.getTeam,
  },
}))

import TeamsDashboardPanel from '../components/TeamsDashboardPanel.vue'

const flush = async () => {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('TeamsDashboardPanel', () => {
  beforeEach(() => {
    apiMocks.getTeams.mockReset()
    apiMocks.getTeam.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders band, audio/visual and support teams from API data', async () => {
    apiMocks.getTeams.mockResolvedValue([
      { id: 1, name: 'Louange', service_type: 'worship' },
      { id: 2, name: 'Son', service_type: 'sound' },
      { id: 3, name: 'Accueil', service_type: 'welcome' },
    ])

    apiMocks.getTeam.mockImplementation(async (id: number) => {
      if (id === 1) {
        return {
          id: 1,
          name: 'Louange',
          service_type: 'worship',
          members: [{ id: 1, first_name: 'Channelle', last_name: 'Castillo', position: 'Lead Vocal' }],
        }
      }
      if (id === 2) {
        return {
          id: 2,
          name: 'Son',
          service_type: 'sound',
          members: [{ id: 2, first_name: 'Will', last_name: 'Frye', position: 'FOH' }],
        }
      }
      return {
        id: 3,
        name: 'Accueil',
        service_type: 'welcome',
        members: [{ id: 3, first_name: 'Marie', last_name: 'Laurent', position: 'Accueil' }],
      }
    })

    const wrapper = mount(TeamsDashboardPanel)
    await flush()
    await flush()

    expect(apiMocks.getTeams).toHaveBeenCalled()
    expect(apiMocks.getTeam).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain('Band')
    expect(wrapper.text()).toContain('Audio/Visual')
    expect(wrapper.text()).toContain('Support teams')
    expect(wrapper.text()).toContain('Channelle Castillo')
    expect(wrapper.text()).toContain('Will Frye')
    expect(wrapper.text()).toContain('Marie Laurent')
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from './setup'

const apiMocks = vi.hoisted(() => ({
  updateArrangement: vi.fn(),
}))

vi.mock('../utils/api', () => ({
  api: { updateArrangement: apiMocks.updateArrangement },
}))

vi.mock('../utils/chordpro', () => ({
  parseChordPro: vi.fn(() => []),
}))

import ChordProEditor from '../components/ChordProEditor.vue'

describe('ChordProEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProps = { arrangementId: 1, initialChart: 'Am C G' }

  it('renders textarea with song content', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Am C G')
  })

  it('renders title "Éditeur ChordPro"', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    expect(wrapper.text()).toContain('Éditeur ChordPro')
  })

  it('renders save and cancel buttons', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    expect(wrapper.text()).toContain('Sauvegarder')
    expect(wrapper.text()).toContain('Annuler')
  })

  it('save button calls updateArrangement and emits save', async () => {
    apiMocks.updateArrangement.mockResolvedValue({ success: true })
    const wrapper = mount(ChordProEditor, { props: baseProps })
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))
    expect(apiMocks.updateArrangement).toHaveBeenCalledWith(1, {
      chord_chart: 'Am C G',
    })
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')![0][0]).toBe('Am C G')
  })

  it('shows success message after save', async () => {
    apiMocks.updateArrangement.mockResolvedValue({ success: true })
    const wrapper = mount(ChordProEditor, { props: baseProps })
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.text()).toContain('Sauvegardé avec succès!')
  })

  it('shows error message when save fails', async () => {
    apiMocks.updateArrangement.mockRejectedValue(new Error('Network error'))
    const wrapper = mount(ChordProEditor, { props: baseProps })
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.text()).toContain('Network error')
  })

  it('shows saving state on save button while saving', async () => {
    apiMocks.updateArrangement.mockImplementation(
      () => new Promise(() => {}),
    )
    const wrapper = mount(ChordProEditor, { props: baseProps })
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Sauvegarde...')
  })

  it('disables save button while saving', async () => {
    apiMocks.updateArrangement.mockImplementation(
      () => new Promise(() => {}),
    )
    const wrapper = mount(ChordProEditor, { props: baseProps })
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(
      (wrapper.find('.save-btn').element as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('cancel button emits close', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    wrapper.find('.cancel-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('close button emits close', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders preview section when chart is non-empty', () => {
    const wrapper = mount(ChordProEditor, { props: baseProps })
    expect(wrapper.find('.preview-content').exists()).toBe(true)
  })

  it('shows preview placeholder when chart is empty', () => {
    const wrapper = mount(ChordProEditor, {
      props: { ...baseProps, initialChart: '' },
    })
    expect(wrapper.text()).toContain("L'aperçu apparaîtra ici...")
  })
})

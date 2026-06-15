import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from './setup'

const apiMocks = vi.hoisted(() => ({
  getArrangementAnnotations: vi.fn(),
  createAnnotation: vi.fn(),
  deleteAnnotation: vi.fn(),
}))

vi.mock('../utils/api', () => ({
  api: {
    getArrangementAnnotations: apiMocks.getArrangementAnnotations,
    createAnnotation: apiMocks.createAnnotation,
    deleteAnnotation: apiMocks.deleteAnnotation,
  },
}))

vi.mock('../stores/toast', () => ({
  showToast: vi.fn(),
}))

import MusicStandNotes from '../components/musicstand/MusicStandNotes.vue'

const flush = async () => {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function mountWithVisible(
  props: Record<string, any>,
  visible = true,
) {
  const wrapper = mount(MusicStandNotes, {
    props: { ...props, visible: !visible },
  })
  wrapper.setProps({ visible })
  return wrapper
}

describe('MusicStandNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProps = {
    visible: false,
    arrangementId: 1,
    currentMemberId: 42,
  }

  const mockAnnotations = [
    {
      id: 1,
      content: 'Note one',
      first_name: 'Alice',
      last_name: 'Smith',
      member_id: 42,
      is_shared: true,
    },
    {
      id: 2,
      content: 'Note two',
      first_name: 'Bob',
      last_name: 'Jones',
      member_id: 99,
      is_shared: false,
    },
  ]

  it('renders list of notes', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    const wrapper = mountWithVisible(baseProps)
    await flush()
    expect(wrapper.find('.notes-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('Note one')
    expect(wrapper.text()).toContain('Note two')
  })

  it('shows member info for each note', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    const wrapper = mountWithVisible(baseProps)
    await flush()
    expect(wrapper.text()).toContain('Alice Smith')
    expect(wrapper.text()).toContain('Bob Jones')
  })

  it('shows shared badge for shared notes and private badge for private ones', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    const wrapper = mountWithVisible(baseProps)
    await flush()
    const badges = wrapper.findAll('.note-badge')
    expect(badges).toHaveLength(2)
    expect(badges[0].text()).toBe('Partagée')
    expect(badges[1].text()).toBe('Privée')
  })

  it('add note button calls createAnnotation', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue([])
    apiMocks.createAnnotation.mockResolvedValue({ id: 3 })
    apiMocks.getArrangementAnnotations.mockResolvedValue([
      {
        id: 3,
        content: 'Nouvelle note',
        first_name: 'Alice',
        last_name: 'Smith',
        member_id: 42,
        is_shared: false,
      },
    ])
    const wrapper = mountWithVisible(baseProps)
    await flush()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Nouvelle note')
    await wrapper.find('.notes-save-btn').trigger('click')
    await flush()
    expect(apiMocks.createAnnotation).toHaveBeenCalledWith(1, {
      content: 'Nouvelle note',
      is_shared: false,
    })
  })

  it('reloads annotations after creation', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue([])
    const wrapper = mountWithVisible(baseProps)
    await flush()
    expect(apiMocks.getArrangementAnnotations).toHaveBeenCalledTimes(1)

    apiMocks.createAnnotation.mockResolvedValue({ id: 3 })
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Nouvelle note')
    await wrapper.find('.notes-save-btn').trigger('click')
    await flush()
    expect(apiMocks.getArrangementAnnotations).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Alice Smith')
  })

  it('delete note button appears only for own notes', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    const wrapper = mountWithVisible(baseProps)
    await flush()
    const deleteBtns = wrapper.findAll('.note-delete')
    expect(deleteBtns).toHaveLength(1)
  })

  it('delete note button calls deleteAnnotation', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue(mockAnnotations)
    apiMocks.deleteAnnotation.mockResolvedValue({ success: true })
    apiMocks.getArrangementAnnotations.mockResolvedValue([
      mockAnnotations[0],
    ])
    const wrapper = mountWithVisible(baseProps)
    await flush()
    await wrapper.find('.note-delete').trigger('click')
    await flush()
    expect(apiMocks.deleteAnnotation).toHaveBeenCalledWith(1)
  })

  it('shows empty state when no notes', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue([])
    const wrapper = mountWithVisible(baseProps)
    await flush()
    expect(wrapper.text()).toContain('Aucune note pour ce chant')
  })

  it('renders nothing when visible is false', () => {
    const wrapper = mount(MusicStandNotes, {
      props: { ...baseProps, visible: false },
    })
    expect(wrapper.find('.notes-panel').exists()).toBe(false)
  })

  it('disables save button when content is empty', async () => {
    apiMocks.getArrangementAnnotations.mockResolvedValue([])
    const wrapper = mountWithVisible(baseProps)
    await flush()
    const saveBtn = wrapper.find('.notes-save-btn')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })
})

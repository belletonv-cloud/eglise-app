import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import MusicStandSetlist from '../components/musicstand/MusicStandSetlist.vue'

describe('MusicStandSetlist', () => {
  const songItem = {
    id: 1,
    type: 'song',
    title: 'Monument',
    song_title: 'Monument',
    arrangement_id: 10,
    song_id: 100,
    key: 'E',
    tempo: 72,
  }

  const nonSongItem = {
    id: 2,
    type: 'prayer',
    title: 'Prayer',
  }

  const baseProps = {
    visible: true,
    planItems: [songItem, nonSongItem],
    currentSongId: null,
    title: 'Service Plan',
    emptyLabel: 'No items',
  }

  it('renders the title', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('Service Plan')
  })

  it('renders song items with title and details', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('Monument')
    expect(wrapper.text()).toContain('72 BPM')
  })

  it('renders non-song items', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    expect(wrapper.text()).toContain('Prayer')
  })

  it('shows empty label when no items', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: { ...baseProps, planItems: [] },
    })
    expect(wrapper.text()).toContain('No items')
  })

  it('emits select-item on song item click', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    const songEl = wrapper.findAll('.setlist-item').find(
      el => el.text().includes('Monument')
    )
    expect(songEl).toBeTruthy()
    songEl!.trigger('click')
    expect(wrapper.emitted('select-item')).toBeTruthy()
    expect(wrapper.emitted('select-item')![0][0]).toEqual(songItem)
  })

  it('does not emit select-item on non-song item click', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    const nonSongEl = wrapper.findAll('.setlist-item').find(
      el => el.text().includes('Prayer')
    )
    expect(nonSongEl).toBeTruthy()
    nonSongEl!.trigger('click')
    expect(wrapper.emitted('select-item')).toBeFalsy()
  })

  it('emits close on close button click', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    wrapper.find('.setlist-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    wrapper.find('.setlist-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: { ...baseProps, visible: false },
    })
    expect(wrapper.find('.setlist-overlay').exists()).toBe(false)
  })

  it('marks current song with current class', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: { ...baseProps, currentSongId: 100 },
    })
    const items = wrapper.findAll('.setlist-item')
    const currentItem = items.find(el => el.classes().includes('current'))
    expect(currentItem).toBeTruthy()
    expect(currentItem!.text()).toContain('Monument')
  })

  it('shows play icon on song items with arrangement_id', () => {
    const wrapper = mount(MusicStandSetlist, {
      props: baseProps,
    })
    expect(wrapper.find('.setlist-play').exists()).toBe(true)
  })
})

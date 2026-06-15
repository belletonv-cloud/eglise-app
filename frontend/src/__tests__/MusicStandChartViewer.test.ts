import { describe, it, expect } from 'vitest'
import { mount } from './setup'
import MusicStandChartViewer from '../components/musicstand/MusicStandChartViewer.vue'
import type { ParsedLine } from '../types/ParsedLine'

describe('MusicStandChartViewer', () => {
  const mockLines: ParsedLine[] = [
    { type: 'section', label: 'Verse 1' },
    { type: 'chord-lyric', parts: [{ chord: 'Am', lyric: 'Hello' }] },
    { type: 'plain', text: 'Some text' },
  ]

  it('renders all line types', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: mockLines, fontSize: 20 },
    })
    expect(wrapper.text()).toContain('Verse 1')
    expect(wrapper.text()).toContain('Am')
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.text()).toContain('Some text')
  })

  it('renders multiple chord-lyric parts', () => {
    const lines: ParsedLine[] = [
      {
        type: 'chord-lyric',
        parts: [
          { chord: 'C', lyric: 'Do' },
          { chord: 'G', lyric: 'Sol' },
        ],
      },
    ]
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines, fontSize: 20 },
    })
    expect(wrapper.text()).toContain('C')
    expect(wrapper.text()).toContain('Do')
    expect(wrapper.text()).toContain('G')
    expect(wrapper.text()).toContain('Sol')
  })

  it('applies fontSize as inline style', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: mockLines, fontSize: 28 },
    })
    const container = wrapper.find('.chart-container')
    expect(container.attributes('style')).toContain('font-size: 28px')
  })

  it('shows fallback slot content when lines is empty', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: [], fontSize: 20 },
    })
    expect(wrapper.text()).toContain('No chart available')
  })

  it('renders section label with section-label class', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: mockLines, fontSize: 20 },
    })
    const sectionLabel = wrapper.find('.section-label')
    expect(sectionLabel.exists()).toBe(true)
    expect(sectionLabel.text()).toBe('Verse 1')
  })

  it('renders chord and lyric in separate spans', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: mockLines, fontSize: 20 },
    })
    expect(wrapper.find('.chord').exists()).toBe(true)
    expect(wrapper.find('.lyric').exists()).toBe(true)
    expect(wrapper.find('.chord').text()).toBe('Am')
    expect(wrapper.find('.lyric').text()).toBe('Hello')
  })

  it('renders plain line with plain-text class', () => {
    const wrapper = mount(MusicStandChartViewer, {
      props: { lines: mockLines, fontSize: 20 },
    })
    expect(wrapper.find('.plain-text').exists()).toBe(true)
    expect(wrapper.find('.plain-text').text()).toBe('Some text')
  })
})

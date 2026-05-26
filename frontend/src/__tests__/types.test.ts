import { describe, it, expect } from 'vitest'
import type {
  Song, Arrangement, Member, Team, Plan, PlanItem, ServiceType,
  Poll, PollOption, Announcement, ChurchEvent, ChurchEventException,
  Webhook, Message, ChecklistItem
} from '../utils/types'

describe('TypeScript type definitions', () => {
  it('Song type has required fields', () => {
    const song: Song = { id: 1, title: 'Test Song' }
    expect(song.id).toBe(1)
    expect(song.title).toBe('Test Song')
  })

  it('Arrangement type has required fields', () => {
    const arr: Arrangement = { id: 1, song_id: 1, name: 'Test Arrangement' }
    expect(arr.key).toBeUndefined()
    expect(arr.tempo).toBeUndefined()
  })

  it('Member type has required fields', () => {
    const member: Member = { id: 1, first_name: 'John', last_name: 'Doe' }
    expect(member.email).toBeUndefined()
  })

  it('Team type has required fields', () => {
    const team: Team = { id: 1, name: 'Worship Team' }
    expect(team.description).toBeUndefined()
  })

  it('Plan type has required fields', () => {
    const plan: Plan = { id: 1, date: '2026-06-15' }
    expect(plan.theme).toBeUndefined()
  })

  it('PlanItem type has required fields', () => {
    const item: PlanItem = { id: 1, plan_id: 1, type: 'song', title: 'Worship' }
    expect(item.position).toBeUndefined()
  })

  it('ServiceType type has required fields', () => {
    const st: ServiceType = { id: 1, name: 'Culte Dominical' }
    expect(st.recurrence).toBeUndefined()
  })

  it('Poll type has optional fields', () => {
    const poll: Poll = { id: 1, question: 'Best song?' }
    expect(poll.options).toBeUndefined()
    expect(poll.max_votes).toBeUndefined()
  })

  it('PollOption type has required fields', () => {
    const opt: PollOption = { id: 1, poll_id: 1, label: 'Option A' }
    expect(opt.vote_count).toBeUndefined()
  })

  it('Announcement type has required fields', () => {
    const ann: Announcement = { id: 1, type: 'prayer', content: 'Pray for peace' }
    expect(ann.plan_id).toBeUndefined()
  })

  it('ChurchEvent type with recurrence', () => {
    const event: ChurchEvent = {
      id: 1, title: 'Sunday Service', start_date: '2026-06-15',
      repeat_period: 'week', status: 'active',
    }
    expect(event.repeat_period).toBe('week')
    expect(event.exceptions).toBeUndefined()
  })

  it('ChurchEventException type discriminates by type', () => {
    const cancelled: ChurchEventException = {
      id: 1, event_id: 1, exception_date: '2026-06-15', type: 'cancelled',
    }
    const moved: ChurchEventException = {
      id: 2, event_id: 1, exception_date: '2026-06-15',
      type: 'moved', new_date: '2026-06-16',
    }
    expect(cancelled.type).toBe('cancelled')
    expect(moved.new_date).toBe('2026-06-16')
  })

  it('Webhook type has required fields', () => {
    const webhook: Webhook = { id: 1, url: 'https://hook.example.com', events: ['plan.created'] }
    expect(webhook.label).toBeUndefined()
  })

  it('Message type has optional subject', () => {
    const msg: Message = { id: 1, content: 'Hello' }
    expect(msg.subject).toBeUndefined()
    expect(msg.recipients).toBeUndefined()
  })

  it('ChecklistItem type has position and label', () => {
    const item: ChecklistItem = { id: 1, position: 'sound', label: 'Check micro' }
    expect(item.done).toBeUndefined()
  })
})

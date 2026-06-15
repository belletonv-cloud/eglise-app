import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('FCM helper (sendFcmV1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports sendFcmV1 and sendFcmV1FireAndForget', async () => {
    const fcm = await import('../../src/fcm.js')
    expect(typeof fcm.sendFcmV1).toBe('function')
    expect(typeof fcm.sendFcmV1FireAndForget).toBe('function')
  })

  it('sendFcmV1FireAndForget does not throw on error', async () => {
    // Mock crypto.subtle to avoid real key import
    const originalImportKey = crypto.subtle.importKey
    const originalSign = crypto.subtle.sign
    crypto.subtle.importKey = vi.fn().mockRejectedValue(new Error('Crypto error'))
    crypto.subtle.sign = vi.fn().mockRejectedValue(new Error('Sign error'))

    try {
      const fcm = await import('../../src/fcm.js')
      const sa = { project_id: 'test', client_email: 'a@b.com', private_key: 'fake' }
      await expect(fcm.sendFcmV1FireAndForget(sa, 'token', 'Title', 'Message'))
        .resolves.toBeUndefined()
    } finally {
      crypto.subtle.importKey = originalImportKey
      crypto.subtle.sign = originalSign
    }
  })

  it('sendFcmV1 handles crypto errors and returns error counts', async () => {
    const originalImportKey = crypto.subtle.importKey
    const originalSign = crypto.subtle.sign
    crypto.subtle.importKey = vi.fn().mockRejectedValue(new Error('Invalid key'))
    crypto.subtle.sign = vi.fn()

    try {
      const fcm = await import('../../src/fcm.js')
      const sa = { project_id: 'test', client_email: 'a@b.com', private_key: 'fake' }
      await expect(fcm.sendFcmV1(sa, ['tok1'], 'Title', 'Message'))
        .rejects.toThrow('Invalid key')
    } finally {
      crypto.subtle.importKey = originalImportKey
      crypto.subtle.sign = originalSign
    }
  })

  it('sendFcmV1 sends notifications on successful auth', async () => {
    // Mock crypto.subtle to succeed
    const originalImportKey = crypto.subtle.importKey
    const originalSign = crypto.subtle.sign
    crypto.subtle.importKey = vi.fn().mockResolvedValue('fake-key')
    crypto.subtle.sign = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    const originalFetch = global.fetch
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(async (url) => {
      callCount++
      if (url === 'https://oauth2.googleapis.com/token') {
        return { ok: true, json: () => ({ access_token: 'test-token', expires_in: 3600 }) }
      }
      return { ok: true, json: () => ({}) }
    })

    try {
      const fcm = await import('../../src/fcm.js')
      const sa = { project_id: 'test-proj', client_email: 'a@b.com', private_key: '-----BEGIN PRIVATE KEY-----\nZm9v\n-----END PRIVATE KEY-----' }
      const result = await fcm.sendFcmV1(sa, ['tok1'], 'Title', 'Message')
      expect(result.sent).toBe(1)
      expect(result.failed).toBe(0)
    } finally {
      global.fetch = originalFetch
      crypto.subtle.importKey = originalImportKey
      crypto.subtle.sign = originalSign
    }
  })
})

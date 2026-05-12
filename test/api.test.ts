import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'

describe('Environment', () => {
  it('should have DB binding', () => {
    expect(env.DB).toBeDefined()
  })
})

describe('Helpers', () => {
  it('should return null for invalid id', () => {
    const id = parseInt('abc', 10)
    expect(isNaN(id) ? null : id).toBeNull()
  })

  it('should return number for valid id', () => {
    const id = parseInt('42', 10)
    expect(isNaN(id) ? null : id).toBe(42)
  })
})

describe('Response format', () => {
  it('should create proper json response', () => {
    const data = { test: true }
    const body = JSON.stringify(data)
    expect(body).toBe('{"test":true}')
  })

  it('should handle error responses', () => {
    const error = { error: 'Not Found' }
    const body = JSON.stringify(error)
    expect(body).toContain('Not Found')
  })
})

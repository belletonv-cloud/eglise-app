import { vi } from 'vitest'

// Mock fetch globally
globalThis.fetch = vi.fn()

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Notification API
Object.defineProperty(globalThis, 'Notification', {
  value: { permission: 'granted', requestPermission: vi.fn() },
  writable: true,
})

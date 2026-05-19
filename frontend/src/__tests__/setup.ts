import { vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { mount as vueMount, shallowMount as vueShallowMount, type ComponentMountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import fr from '../locales/fr'

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

// Create shared i18n instance for tests
export const testI18n = createI18n({
  legacy: false,
  locale: 'fr',
  messages: { fr },
})

// Create a minimal router for tests
export function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
}

// Helper to mount components with i18n and router pre-configured
export function mount(component: Component, options: ComponentMountingOptions<typeof component> = {}) {
  const router = createTestRouter()
  const globalOptions = {
    plugins: [router, testI18n],
    ...(options.global || {}),
  }
  return vueMount(component, { ...options, global: globalOptions })
}

export function shallowMount(component: Component, options: ComponentMountingOptions<typeof component> = {}) {
  const router = createTestRouter()
  const globalOptions = {
    plugins: [router, testI18n],
    ...(options.global || {}),
  }
  return vueShallowMount(component, { ...options, global: globalOptions })
}

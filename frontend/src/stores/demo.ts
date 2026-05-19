/**
 * Demo mode store — bypasses Firebase auth with sample data
 */
import { ref } from 'vue'

export const isDemoMode = ref(false)
export const demoUser = ref<any>(null)

export function enableDemoMode() {
  isDemoMode.value = true
  demoUser.value = {
    email: 'demo@cieuxouverts.bzh',
    displayName: 'Démo Cieux Ouverts',
    role: 'admin',
    getIdToken: async () => 'demo-token',
  }
  localStorage.setItem('demo-mode', 'true')
}

export function disableDemoMode() {
  isDemoMode.value = false
  demoUser.value = null
  localStorage.removeItem('demo-mode')
}

export function initDemoMode() {
  if (localStorage.getItem('demo-mode') === 'true') {
    enableDemoMode()
  }
}

/**
 * Demo mode store — bypasses Firebase auth, calls real API via x-demo-email
 * The backend auto-creates the demo user (admin role) on first request.
 */
import { ref } from 'vue'

export const isInteractiveView = ref(false)
export const interactiveUser = ref<any>(null)

const DEMO_EMAIL = 'admin@cieuxouverts.bzh'

export function enableInteractiveView() {
  isInteractiveView.value = true
  interactiveUser.value = {
    email: DEMO_EMAIL,
    displayName: 'Admin Cieux Ouverts',
    role: 'admin',
    getIdToken: async () => 'demo-token',
  }
  localStorage.setItem('interactive-view', 'true')
}

export function disableInteractiveView() {
  isInteractiveView.value = false
  interactiveUser.value = null
  localStorage.removeItem('interactive-view')
}

// Auto-enable demo mode on first visit when no Firebase auth
export function initInteractiveView() {
  if (localStorage.getItem('interactive-view') === 'true') {
    enableInteractiveView()
  }
}

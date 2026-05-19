/**
 * Demo mode store — bypasses Firebase auth with sample data
 */
import { ref } from 'vue'

export const isInteractiveView = ref(false)
export const interactiveUser = ref<any>(null)

export function enableInteractiveView() {
  isInteractiveView.value = true
  interactiveUser.value = {
    email: 'demo@cieuxouverts.bzh',
    displayName: 'Accueil Interactif Cieux Ouverts',
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

export function initInteractiveView() {
  if (localStorage.getItem('interactive-view') === 'true') {
    enableInteractiveView()
  }
}

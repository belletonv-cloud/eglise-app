import { reactive } from 'vue'

type Toast = { id: number; message: string; type?: 'success' | 'error' }

const state = reactive({ items: [] as Toast[] })
let nextId = 1

export function useToast() {
  function show(message: string, type: 'success' | 'error' = 'success', timeout = 4000) {
    const id = nextId++
    state.items.push({ id, message, type })
    setTimeout(() => dismiss(id), timeout)
  }
  function dismiss(id: number) {
    const idx = state.items.findIndex(t => t.id === id)
    if (idx >= 0) state.items.splice(idx, 1)
  }
  return { state, show, dismiss }
}

export default useToast
export const showToast = (message: string, type: 'success' | 'error' = 'success') => useToast().show(message, type)

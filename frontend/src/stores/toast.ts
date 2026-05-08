import { reactive } from 'vue'

export interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  key: number
}

const state = reactive<ToastState>({
  message: '',
  type: 'info',
  visible: false,
  key: 0,
})

let timer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  if (timer) clearTimeout(timer)
  state.message = message
  state.type = type
  state.visible = true
  state.key++
  timer = setTimeout(() => { state.visible = false }, duration)
}

export function hideToast() {
  state.visible = false
  if (timer) clearTimeout(timer)
}

export function toastState() {
  return state
}
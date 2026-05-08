import { reactive } from 'vue'

export interface ConfirmState {
  message: string
  visible: boolean
}

const state = reactive<ConfirmState>({
  message: '',
  visible: false,
})

let resolveFn: ((val: boolean) => void) | null = null

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    state.message = message
    state.visible = true
    resolveFn = resolve
  })
}

export function confirmResolve(value: boolean) {
  state.visible = false
  if (resolveFn) {
    resolveFn(value)
    resolveFn = null
  }
}

export function confirmState() {
  return state
}

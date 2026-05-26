import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('useToast returns state, show, and dismiss functions', async () => {
    const { useToast } = await import('../stores/toast')
    expect(useToast).toBeDefined()
    const toast = useToast()
    expect(toast.state).toBeDefined()
    expect(typeof toast.show).toBe('function')
    expect(typeof toast.dismiss).toBe('function')
  })

  it('show adds and dismiss removes a toast', async () => {
    const { useToast } = await import('../stores/toast')
    const before = useToast().state.items.length
    const toast = useToast()

    toast.show('Only toast', 'success', 10000)
    expect(toast.state.items.length).toBe(before + 1)
    const added = toast.state.items[toast.state.items.length - 1]
    expect(added.message).toBe('Only toast')
    expect(added.type).toBe('success')

    toast.dismiss(added.id)
    expect(toast.state.items.length).toBe(before)
  })
})

describe('confirm store', () => {
  it('confirmDialog and confirmResolve work together', async () => {
    const { confirmDialog, confirmResolve, confirmState } = await import('../stores/confirm')
    expect(confirmState).toBeDefined()
    expect(confirmState().visible).toBe(false)

    const promise = confirmDialog('Are you sure?')
    expect(confirmState().visible).toBe(true)
    expect(confirmState().message).toBe('Are you sure?')

    confirmResolve(true)
    const result = await promise
    expect(result).toBe(true)
    expect(confirmState().visible).toBe(false)
  })
})

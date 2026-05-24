let highlightEl: HTMLElement | null = null

export function useDemoHighlighter() {
  function highlight(selector: string) {
    clear()
    const target = document.querySelector(selector) as HTMLElement | null
    if (!target) return false

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const rect = target.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false

    const el = document.createElement('div')
    el.className = 'demo-highlight-ring'
    el.style.cssText = [
      'position: fixed',
      `top: ${rect.top - 4}px`,
      `left: ${rect.left - 4}px`,
      `width: ${rect.width + 8}px`,
      `height: ${rect.height + 8}px`,
      'z-index: 10000',
      'pointer-events: none',
      'border-radius: 6px',
      'transition: all 0.3s ease',
    ].join(';')
    document.body.appendChild(el)
    highlightEl = el

    setTimeout(() => {
      el.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.6)'
    }, 50)

    return true
  }

  function updatePosition() {
    if (!highlightEl) return
    const target = document.querySelector('.demo-highlight-target') as HTMLElement | null
    if (!target) { clear(); return }
    const rect = target.getBoundingClientRect()
    highlightEl.style.top = `${rect.top - 4}px`
    highlightEl.style.left = `${rect.left - 4}px`
    highlightEl.style.width = `${rect.width + 8}px`
    highlightEl.style.height = `${rect.height + 8}px`
  }

  function clear() {
    if (highlightEl) {
      highlightEl.remove()
      highlightEl = null
    }
  }

  return { highlight, updatePosition, clear }
}

import { ref, onUnmounted, type Ref } from 'vue'

export function useAutoScroll(bpm: Ref<number>, metronomePlaying: Ref<boolean>) {
  const autoScrollActive = ref(false)
  const currentScrollLine = ref(0)
  const chartContainer = ref<HTMLElement | null>(null)
  let autoScrollInterval: any = null

  function startAutoScroll() {
    stopAutoScroll()
    if (!bpm.value) return
    const intervalMs = (60 / bpm.value) * 1000
    const linesPerTick = 1
    autoScrollInterval = setInterval(() => {
      const container = chartContainer.value
      if (!container) return
      const lineHeight = parseInt(getComputedStyle(container).fontSize) * 1.6
      const scrollBy = lineHeight * linesPerTick
      container.scrollBy({ top: scrollBy, behavior: 'smooth' })
    }, intervalMs)
  }

  function stopAutoScroll() {
    if (autoScrollInterval !== null) {
      clearInterval(autoScrollInterval)
      autoScrollInterval = null
    }
  }

  function toggleAutoScroll() {
    autoScrollActive.value = !autoScrollActive.value
    if (autoScrollActive.value && metronomePlaying.value) {
      startAutoScroll()
    } else {
      stopAutoScroll()
    }
  }

  onUnmounted(() => {
    stopAutoScroll()
  })

  return { autoScrollActive, currentScrollLine, chartContainer, startAutoScroll, stopAutoScroll, toggleAutoScroll }
}

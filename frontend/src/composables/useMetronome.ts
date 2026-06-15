import { ref, watch, onUnmounted } from 'vue'

export function useMetronome(opts?: { onPlay?: () => void; onStop?: () => void }) {
  const metronomeVisible = ref(false)
  const metronomePlaying = ref(false)
  const bpm = ref(120)
  const meter = ref(4)
  const currentBeat = ref(0)
  const editBpm = ref(false)
  let metroInterval: any = null

  function toggleMetronome() {
    if (metronomeVisible.value) {
      metronomeVisible.value = false
      metronomePlaying.value = false
      clearInterval(metroInterval)
      metroInterval = null
    } else {
      metronomeVisible.value = true
    }
  }

  function setBpm(val: number) {
    if (val >= 30 && val <= 300) bpm.value = val
  }

  function setMeter(val: number) {
    meter.value = val
  }

  function startMetronome() {
    stopMetronome()
    const intervalMs = 60000 / bpm.value
    let beat = 0
    metroInterval = setInterval(() => {
      currentBeat.value = beat % meter.value
      beat++
    }, intervalMs)
  }

  function stopMetronome() {
    if (metroInterval !== null) {
      clearInterval(metroInterval)
      metroInterval = null
    }
    currentBeat.value = 0
  }

  watch(metronomePlaying, (playing) => {
    if (playing) {
      startMetronome()
      opts?.onPlay?.()
    } else {
      stopMetronome()
      opts?.onStop?.()
    }
  })

  watch(bpm, () => {
    if (metronomePlaying.value) {
      startMetronome()
    }
  })

  onUnmounted(() => {
    if (metroInterval !== null) {
      clearInterval(metroInterval)
    }
  })

  return {
    metronomeVisible,
    metronomePlaying,
    bpm,
    meter,
    currentBeat,
    editBpm,
    toggleMetronome,
    setBpm,
    setMeter,
  }
}

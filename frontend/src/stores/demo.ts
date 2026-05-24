import { ref } from 'vue'

export const isInteractiveView = ref(false)
export const interactiveUser = ref<any>(null)

export const isDemoTourActive = ref(false)
export const demoTourStep = ref(0)
export const isAutoPlaying = ref(false)
let autoPlayTimer: any = null

export interface TourStep {
  icon: string
  title: string
  desc: string
  hint: string
  route: string
  highlight?: string
  actionLabelKey?: string
  action?: string
}

export const tourSteps: TourStep[] = [
  {
    icon: '📊', title: 'demo_tour.step0_title', route: '/',
    desc: 'demo_tour.step0_desc',
    hint: 'demo_tour.step0_hint',
    highlight: '[data-testid="stat-members"], .stat-card:first-child',
  },
  {
    icon: '👥', title: 'demo_tour.step1_title', route: '/members',
    desc: 'demo_tour.step1_desc',
    hint: 'demo_tour.step1_hint',
    highlight: '.member-row:first-child, [class*="member"]:first-child',
    actionLabelKey: 'demo_tour.action_member',
    action: 'click:.member-row:first-child a',
  },
  {
    icon: '🎪', title: 'demo_tour.step2_title', route: '/teams',
    desc: 'demo_tour.step2_desc',
    hint: 'demo_tour.step2_hint',
    highlight: 'a[href*="/teams/"]',
  },
  {
    icon: '📋', title: 'demo_tour.step3_title', route: '/plans',
    desc: 'demo_tour.step3_desc',
    hint: 'demo_tour.step3_hint',
    highlight: 'a[href*="/plans/"]',
    actionLabelKey: 'demo_tour.action_plan',
    action: 'route:/plans/1001',
  },
  {
    icon: '🎵', title: 'demo_tour.step4_title', route: '/music-stand',
    desc: 'demo_tour.step4_desc',
    hint: 'demo_tour.step4_hint',
    highlight: '.browser-song:first-child',
    actionLabelKey: 'demo_tour.action_song',
    action: 'route:/music-stand/1/1',
  },
  {
    icon: '✅', title: 'demo_tour.step5_title', route: '/checkin',
    desc: 'demo_tour.step5_desc',
    hint: 'demo_tour.step5_hint',
    highlight: 'input[type="text"], input[placeholder*="chercher"]',
  },
  {
    icon: '🏠', title: 'demo_tour.step6_title', route: '/house-groups',
    desc: 'demo_tour.step6_desc',
    hint: 'demo_tour.step6_hint',
    highlight: 'a[href*="/house-groups/"]',
  },
  {
    icon: '📧', title: 'demo_tour.step7_title', route: '/email',
    desc: 'demo_tour.step7_desc',
    hint: 'demo_tour.step7_hint',
    highlight: 'a[href*="/email-templates"]',
  },
  {
    icon: '🚀', title: 'demo_tour.step8_title', route: '/dashboard',
    desc: 'demo_tour.step8_desc',
    hint: 'demo_tour.step8_hint',
    highlight: '[data-testid="stat-teams"], .stat-card:last-child',
  },
]

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
  isDemoTourActive.value = false
  interactiveUser.value = null
  localStorage.removeItem('interactive-view')
}

export function startDemoTour() {
  enableInteractiveView()
  isDemoTourActive.value = true
  demoTourStep.value = 0
}

export function stopDemoTour() {
  isDemoTourActive.value = false
  demoTourStep.value = 0
}

export function nextTourStep() {
  if (demoTourStep.value < tourSteps.length - 1) {
    demoTourStep.value++
  }
}

export function prevTourStep() {
  if (demoTourStep.value > 0) {
    demoTourStep.value--
  }
}

export function toggleAutoPlay() {
  if (isAutoPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

function startAutoPlay() {
  isAutoPlaying.value = true
  autoPlayTimer = setInterval(() => {
    if (demoTourStep.value >= tourSteps.length - 1) {
      stopAutoPlay()
      return
    }
    nextTourStep()
  }, 5000)
}

function stopAutoPlay() {
  isAutoPlaying.value = false
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

export function initInteractiveView() {
  if (localStorage.getItem('interactive-view') === 'true') {
    enableInteractiveView()
  }
}

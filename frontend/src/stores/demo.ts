import { ref } from 'vue'

export const isInteractiveView = ref(false)
export const interactiveUser = ref<any>(null)

export const isDemoTourActive = ref(false)
export const demoTourStep = ref(0)

export const tourSteps = [
  {
    icon: '📊', title: 'Dashboard', route: '/',
    desc: "Vue d'ensemble avec statistiques : membres actifs, services à venir, chants avec grilles.",
    hint: 'Regardez les indicateurs clés'
  },
  {
    icon: '👥', title: 'Membres', route: '/members',
    desc: 'Base de données complète des membres : profils, coordonnées, rôles et permissions.',
    hint: 'Cliquez sur un membre pour voir son profil'
  },
  {
    icon: '🎪', title: 'Équipes', route: '/teams',
    desc: 'Créez des équipes, assignez des positions, gérez les bénévoles.',
    hint: 'Explorez la liste des équipes'
  },
  {
    icon: '📋', title: 'Plans de service', route: '/plans',
    desc: 'Créez des plans avec ordre de culte, chants, annonces. Templates réutilisables.',
    hint: "Cliquez sur 'Nouveau plan' pour en créer un"
  },
  {
    icon: '🎵', title: 'Music Stand', route: '/music-stand',
    desc: 'Grilles ChordPro, transposition en temps réel, métronome, auto-scroll.',
    hint: 'Ouvrez une chanson pour voir le Music Stand'
  },
  {
    icon: '✅', title: 'Check-in', route: '/checkin',
    desc: 'QR code, check-in manuel, suivi des présences et statistiques.',
    hint: "Scannez ou cherchez un membre pour l'enregistrer"
  },
  {
    icon: '🏠', title: 'Groupes de maison', route: '/house-groups',
    desc: 'Gérez les groupes : leaders, réunions, membres. Parfait pour le suivi.',
    hint: 'Consultez la liste des groupes'
  },
  {
    icon: '📧', title: 'Emails & Communication', route: '/email',
    desc: 'Composez des emails, utilisez des templates, envoyez en masse.',
    hint: 'Les templates incluent des variables comme {{name}}'
  },
  {
    icon: '🚀', title: 'Félicitations !', route: '/dashboard',
    desc: "Vous avez vu l'essentiel. Explorez librement ou passez en mode sombre !",
    hint: 'Le mode démo reste actif, toutes les pages sont accessibles.'
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

export function initInteractiveView() {
  if (localStorage.getItem('interactive-view') === 'true') {
    enableInteractiveView()
  }
}

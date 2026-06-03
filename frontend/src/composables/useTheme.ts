import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Thème par défaut
const currentTheme = ref<'light' | 'dark'>('light')

// Routes qui utilisent le thème sombre (Music Stand)
const darkThemeRoutes = ['/music-stand', '/music-stand-app']

// Routes qui utilisent le thème clair (Planning/Services)
const lightThemeRoutes = ['/', '/calendar', '/plans', '/plan-templates', '/checkin', '/members', '/teams', '/songs', '/annonces', '/events', '/email', '/sondages', '/youtube', '/about', '/admin']

export function useTheme() {
  const route = useRoute()

  // Changer le thème
  const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  // Détecter le thème en fonction de la route
  const detectThemeFromRoute = () => {
    const path = route.path
    if (darkThemeRoutes.includes(path)) {
      setTheme('dark')
    } else if (lightThemeRoutes.some(r => path.startsWith(r))) {
      setTheme('light')
    }
  }

  // Observer les changements de route
  watch(route, detectThemeFromRoute)

  // Initialiser depuis localStorage ou route actuelle
  const initTheme = () => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
    } else {
      detectThemeFromRoute()
    }
  }

  return {
    currentTheme,
    setTheme,
    initTheme
  }
}

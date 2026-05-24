import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../stores/auth'
import { isInteractiveView } from '../stores/demo'
import HomePage from '../views/HomePage.vue'
import SongDetail from '../components/SongDetail.vue'
import PlansList from '../views/PlansList.vue'
import PlanDetail from '../views/PlanDetail.vue'
import MembersList from '../views/MembersList.vue'
import MemberDetail from '../views/MemberDetail.vue'
import TeamsList from '../views/TeamsList.vue'
import TeamDetail from '../views/TeamDetail.vue'
import CheckInView from '../views/CheckInView.vue'
import HouseGroupsList from '../views/HouseGroupsList.vue'
import HouseGroupDetail from '../views/HouseGroupDetail.vue'
import EmailCompose from '../views/EmailCompose.vue'
import EmailTemplatesList from '../views/EmailTemplatesList.vue'
import ConflictLogs from '../views/ConflictLogs.vue'
import PlanTemplatesList from '../views/PlanTemplatesList.vue'
import PlanTemplateDetail from '../views/PlanTemplateDetail.vue'
import SetlistView from '../views/SetlistView.vue'
import CalendarView from '../views/CalendarView.vue'
import MonCompte from '../views/MonCompte.vue'
import Dashboard from '../views/Dashboard.vue'
import Historique from '../views/Historique.vue'
import Annuaire from '../views/Annuaire.vue'
import InvitationAccept from '../views/InvitationAccept.vue'
import LogsView from '../views/LogsView.vue'
import SondagesList from '../views/SondagesList.vue'
import Annonces from '../views/Annonces.vue'
import MemberProfile from '../views/MemberProfile.vue'
import WebhooksView from '../views/WebhooksView.vue'
import MessagesView from '../views/MessagesView.vue'
import KioskView from '../views/KioskView.vue'
import ChurchEvents from '../views/ChurchEvents.vue'
import YoutubeView from '../views/YoutubeView.vue'
import PcoSyncView from '../views/PcoSyncView.vue'
import MusicStandView from '../views/MusicStandView.vue'
import MusicStandListView from '../views/MusicStandListView.vue'
import DemoTour from '../views/DemoTour.vue'

const publicRoutes = ['invitation', 'demo-tour', 'interactive']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/demo-tour',
      name: 'demo-tour',
      component: DemoTour,
    },
    {
      path: '/interactive',
      redirect: '/demo-tour',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView,
    },
    {
      path: '/',
      name: 'home',
      component: Dashboard,
    },
    {
      path: '/plans',
      name: 'plans',
      component: PlansList,
    },
    {
      path: '/songs',
      name: 'songs',
      component: HomePage,
    },
    {
      path: '/song/:id',
      name: 'song-detail',
      component: SongDetail,
      props: true,
    },
    {
      path: '/plans/:id',
      name: 'plan-detail',
      component: PlanDetail,
      props: true,
    },
    {
      path: '/plans/:id/setlist',
      name: 'setlist',
      component: SetlistView,
      props: true,
    },
    {
      path: '/plan-templates',
      name: 'plan-templates',
      component: PlanTemplatesList,
    },
    {
      path: '/plan-templates/:id',
      name: 'plan-template-detail',
      component: PlanTemplateDetail,
      props: true,
    },
    {
      path: '/members',
      name: 'members',
      component: MembersList,
    },
    {
      path: '/members/:id',
      name: 'member-detail',
      component: MemberDetail,
      props: true,
    },
    {
      path: '/teams',
      name: 'teams',
      component: TeamsList,
    },
    {
      path: '/teams/:id',
      name: 'team-detail',
      component: TeamDetail,
      props: true,
    },
    {
      path: '/checkin',
      name: 'checkin',
      component: CheckInView,
    },
    {
      path: '/house-groups',
      name: 'house-groups',
      component: HouseGroupsList,
    },
    {
      path: '/house-groups/:id',
      name: 'house-group-detail',
      component: HouseGroupDetail,
      props: true,
    },
    {
      path: '/email',
      name: 'email-compose',
      component: EmailCompose,
    },
    {
      path: '/email-templates',
      name: 'email-templates',
      component: EmailTemplatesList,
    },
    {
      path: '/conflicts',
      name: 'conflicts',
      component: ConflictLogs,
    },
    {
      path: '/admin/members',
      name: 'admin-members',
      component: () => import('../views/AdminMembers.vue')
    },
    {
      path: '/mon-compte',
      name: 'mon-compte',
      component: MonCompte,
    },
    {
      path: '/admin/oneclick',
      name: 'admin-oneclick',
      component: () => import('../views/AdminOneClick.vue')
    },
    {
      path: '/historique',
      name: 'historique',
      component: Historique,
    },
    {
      path: '/annuaire',
      name: 'annuaire',
      component: Annuaire,
    },
    {
      path: '/invitation',
      name: 'invitation',
      component: InvitationAccept,
    },
    {
      path: '/sondages',
      name: 'sondages',
      component: SondagesList,
    },
    {
      path: '/annonces',
      name: 'annonces',
      component: Annonces,
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
    },
    {
      path: '/webhooks',
      name: 'webhooks',
      component: WebhooksView,
    },
    {
      path: '/messages',
      name: 'messages',
      component: MessagesView,
    },
    {
      path: '/members/:id/profile',
      name: 'member-profile',
      component: MemberProfile,
      props: true,
    },
    {
      path: '/kiosk/:id',
      name: 'kiosk',
      component: KioskView,
    },
    {
      path: '/events',
      name: 'church-events',
      component: ChurchEvents,
    },
    {
      path: '/youtube',
      name: 'youtube',
      component: YoutubeView,
    },
    {
      path: '/pco-sync',
      name: 'pco-sync',
      component: PcoSyncView,
    },
    {
      path: '/music-stand',
      name: 'music-stand-list',
      component: MusicStandListView,
    },
    {
      path: '/music-stand/:songId/:arrangementId?',
      name: 'music-stand',
      component: MusicStandView,
      props: true,
    },
  ],
})

// Route guard: unauthenticated users see login via App.vue
// Public routes (invitation) are accessible without auth
router.beforeEach((to) => {
  if (publicRoutes.includes(to.name as string)) return true
  if (isAuthenticated.value || isInteractiveView.value) return true
  return true
})

export default router

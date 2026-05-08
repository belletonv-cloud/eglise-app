import { createRouter, createWebHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
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
  ],
})

export default router

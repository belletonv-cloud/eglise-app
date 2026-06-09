import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated, waitForAuthInitialized } from "../stores/auth";

export const publicRoutes: string[] = [
  "login",
  "invitation",
  "not-found",
  "checkin",
  "public-plan",
  "admin-oneclick",
];

const NotFound = {
  template:
    '<div class="flex items-center justify-center h-full"><div class="text-center"><h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1><p class="mt-2 text-gray-500 dark:text-gray-400">Page introuvable</p><router-link to="/" class="mt-4 inline-block text-blue-600 hover:underline">Retour à l\'accueil</router-link></div></div>',
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/Dashboard.vue"),
    },
    {
      path: "/calendar",
      name: "calendar",
      component: () => import("../views/CalendarView.vue"),
    },
    {
      path: "/",
      name: "home",
      component: () => import("../views/Dashboard.vue"),
    },
    {
      path: "/plans",
      name: "plans",
      component: () => import("../views/PlansList.vue"),
    },
    {
      path: "/songs",
      name: "songs",
      component: () => import("../views/SongsList.vue"),
    },
    {
      path: "/song/:id",
      name: "song-detail",
      component: () => import("../components/SongDetail.vue"),
      props: true,
    },
    {
      path: "/plans/:id",
      name: "plan-detail",
      component: () => import("../views/PlanDetail.vue"),
      props: true,
    },
    {
      path: "/plans/:id/setlist",
      name: "setlist",
      component: () => import("../views/SetlistView.vue"),
      props: true,
    },
    {
      path: "/plan-templates",
      name: "plan-templates",
      component: () => import("../views/PlanTemplatesList.vue"),
    },
    {
      path: "/plan-templates/:id",
      name: "plan-template-detail",
      component: () => import("../views/PlanTemplateDetail.vue"),
      props: true,
    },
    {
      path: "/members",
      name: "members",
      component: () => import("../views/MembersList.vue"),
    },
    {
      path: "/members/:id",
      name: "member-detail",
      component: () => import("../views/MemberDetail.vue"),
      props: true,
    },
    {
      path: "/teams",
      name: "teams",
      component: () => import("../views/TeamsDashboardView.vue"),
    },
    {
      path: "/teams/manage",
      name: "teams-manage",
      component: () => import("../views/TeamsList.vue"),
    },
    {
      path: "/teams/:id",
      name: "team-detail",
      component: () => import("../views/TeamDetail.vue"),
      props: true,
    },
    {
      path: "/checkin",
      name: "checkin",
      component: () => import("../views/CheckInView.vue"),
    },
    {
      path: "/house-groups",
      name: "house-groups",
      component: () => import("../views/HouseGroupsList.vue"),
    },
    {
      path: "/house-groups/:id",
      name: "house-group-detail",
      component: () => import("../views/HouseGroupDetail.vue"),
      props: true,
    },
    {
      path: "/email",
      name: "email-compose",
      component: () => import("../views/EmailCompose.vue"),
    },
    {
      path: "/email-templates",
      name: "email-templates",
      component: () => import("../views/EmailTemplatesList.vue"),
    },
    {
      path: "/conflicts",
      name: "conflicts",
      component: () => import("../views/ConflictLogs.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminHome.vue"),
    },
    {
      path: "/admin/members",
      name: "admin-members",
      component: () => import("../views/AdminMembers.vue"),
    },
    {
      path: "/mon-compte",
      name: "mon-compte",
      component: () => import("../views/MonCompte.vue"),
    },
    {
      path: "/admin/oneclick",
      name: "admin-oneclick",
      component: () => import("../views/AdminOneClick.vue"),
    },
    {
      path: "/historique",
      name: "historique",
      component: () => import("../views/Historique.vue"),
    },
    {
      path: "/annuaire",
      name: "annuaire",
      component: () => import("../views/Annuaire.vue"),
    },
    {
      path: "/invitation",
      name: "invitation",
      component: () => import("../views/InvitationAccept.vue"),
    },
    {
      path: "/sondages",
      name: "sondages",
      component: () => import("../views/SondagesList.vue"),
    },
    {
      path: "/annonces",
      name: "annonces",
      component: () => import("../views/Annonces.vue"),
    },
    {
      path: "/logs",
      name: "logs",
      component: () => import("../views/LogsView.vue"),
    },
    {
      path: "/webhooks",
      name: "webhooks",
      component: () => import("../views/WebhooksView.vue"),
    },
    {
      path: "/messages",
      name: "messages",
      component: () => import("../views/MessagesView.vue"),
    },
    {
      path: "/members/:id/profile",
      name: "member-profile",
      component: () => import("../views/MemberProfile.vue"),
      props: true,
    },
    {
      path: "/kiosk/:id",
      name: "kiosk",
      component: () => import("../views/KioskView.vue"),
    },
    {
      path: "/events",
      name: "church-events",
      component: () => import("../views/ChurchEvents.vue"),
    },
    {
      path: "/youtube",
      name: "youtube",
      component: () => import("../views/YoutubeView.vue"),
    },
    {
      path: "/pco-sync",
      name: "pco-sync",
      component: () => import("../views/PcoSyncView.vue"),
    },
    {
      path: "/music-stand",
      name: "music-stand-list",
      component: () => import("../views/MusicStandListView.vue"),
    },
    {
      path: "/music-stand/:songId/:arrangementId?",
      name: "music-stand",
      component: () => import("../views/MusicStandView.vue"),
      props: true,
    },
    {
      path: "/apps",
      name: "apps",
      component: () => import("../views/AppsLauncher.vue"),
    },
    {
      path: "/apps/compare",
      name: "apps-compare",
      component: () => import("../views/AppsCompare.vue"),
    },
    {
      path: "/services-center",
      name: "services-center",
      component: () => import("../views/ServicesCenterView.vue"),
    },
    {
      path: "/music-stand-app",
      name: "music-stand-app",
      component: () => import("../views/MusicStandAppView.vue"),
    },
    {
      path: "/compare",
      name: "feature-compare",
      component: () => import("../views/FeatureCompare.vue"),
    },
    {
      path: "/serving-schedule",
      name: "serving-schedule",
      component: () => import("../views/ServingScheduleView.vue"),
    },
    {
      path: "/teams-dashboard",
      redirect: "/teams",
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutPage.vue"),
    },
    {
      path: "/admin/content",
      name: "admin-content",
      component: () => import("../views/AdminContentEditor.vue"),
    },
    {
      path: "/admin/test-accounts",
      name: "admin-test-accounts",
      component: () => import("../views/TestAccountsPanel.vue"),
    },
    {
      path: "/admin/roles",
      redirect: "/admin/members",
    },
    {
      path: "/plan/public/:token",
      name: "public-plan",
      component: () => import("../views/PublicPlanView.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFound,
    },
  ],
});

// Guard global : authentification obligatoire sur toutes les routes sauf routes publiques
export let intendedRoute: string | null = null;
export function consumeIntendedRoute(): string | null {
  const r = intendedRoute;
  intendedRoute = null;
  return r;
}

router.beforeEach(async (to) => {
  if (to.name && publicRoutes.includes(to.name as string)) return true;

  await waitForAuthInitialized();

  if (!isAuthenticated.value) {
    if (to.path !== "/" && to.path !== "/login") {
      intendedRoute = to.fullPath;
    }
    return { name: "login", query: to.query };
  }

  return true;
});

export default router;

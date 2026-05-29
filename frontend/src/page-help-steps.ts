// Centralisation de tous les steps/tours d’aide des pages principales
// Usage : import { stepsByPage } from './page-help-steps'
// puis : <PageHelp :steps="stepsByPage['members']" />

import { useI18n } from 'vue-i18n'

export function stepsByPage(t: (key: string) => string) {
  return {
    plans: [
      {
        title: t('help.plans_step1_title') || 'Créer ou consulter un plan',
        desc: t('help.plans_step1_desc') || 'Cliquez sur un service pour voir son détail ou en créer un nouveau.',
        selector: '.plans-list-table',
      },
      {
        title: t('help.plans_step2_title') || 'Exporter/l’ordre du culte',
        desc: t('help.plans_step2_desc') || 'Utilisez le bouton "Télécharger" pour obtenir l’agenda PDF.',
        selector: '.plan-download-btn',
      },
    ],
    members: [
      {
        title: t('help.members_step1_title') || 'Filtrer les membres',
        desc: t('help.members_step1_desc') || 'Utilisez le menu "Équipe" pour filtrer les membres par ministère.',
        selector: '.members-filter-team',
      },
      {
        title: t('help.members_step2_title') || 'Ajouter un membre',
        desc: t('help.members_step2_desc') || 'Cliquez sur "Ajouter" pour créer un nouveau membre.',
        selector: '.add-member-btn',
      },
    ],
    calendar: [
      {
        title: t('help.calendar_step1_title') || 'Naviguez dans le calendrier',
        desc: t('help.calendar_step1_desc') || 'Vous pouvez passer de la vue "mois" à "agenda" ou "cartes".',
        selector: '.calendar',
      },
    ],
    teams: [
      {
        title: t('help.teams_step1_title') || 'Toutes les équipes',
        desc: t('help.teams_step1_desc') || 'Chaque carte correspond à une équipe. Cliquez pour les détails.',
        selector: '.teams-page',
      },
      {
        title: t('help.teams_step2_title') || 'Créer un ministère',
        desc: t('help.teams_step2_desc') || 'Cliquez sur "Ajouter" pour créer un nouveau ministère.',
        selector: '.add-btn',
      },
    ],
    checkin: [
      {
        title: t('help.checkin_step1_title') || 'Sélection de plan',
        desc: t('help.checkin_step1_desc') || 'Choisissez le service du jour pour commencer le pointage.',
        selector: '[data-testid="plan-item"]',
      },
      {
        title: t('help.checkin_step2_title') || 'QR Code',
        desc: t('help.checkin_step2_desc') || 'Scannez le code QR pour déclarer votre présence rapidement.',
        selector: '.qr-code',
      }
    ],
    housegroups: [
      {
        title: t('help.housegroups_step1_title') || 'Lister les groupes',
        desc: t('help.housegroups_step1_desc') || 'Cliquez sur un groupe pour voir les détails.',
        selector: '.house-groups-list',
      },
      {
        title: t('help.housegroups_step2_title') || 'Ajouter un groupe',
        desc: t('help.housegroups_step2_desc') || 'Cliquez sur "Ajouter" pour créer un groupe de maison.',
        selector: '.add-housegroup-btn',
      },
    ],
    home: [
      {
        title: t('help.home_step1_title') || 'Accueil',
        desc: t('help.home_step1_desc') || 'Bienvenue sur le tableau de bord de votre église.',
        selector: '.dashboard',
      },
    ],
    songs: [
      {
        title: t('help.songs_step1_title') || 'Parcourir les chants',
        desc: t('help.songs_step1_desc') || 'Recherchez et consultez les chants avec leurs arrangements.',
        selector: '.songs-list',
      },
    ],
    'song-detail': [
      {
        title: t('help.song-detail_step1_title') || 'Détail du chant',
        desc: t('help.song-detail_step1_desc') || 'Consultez les arrangements, transposez et gérez les médias.',
        selector: '.song-detail',
      },
    ],
    'plan-detail': [
      {
        title: t('help.plan-detail_step1_title') || 'Détail du plan',
        desc: t('help.plan-detail_step1_desc') || 'Organisez l\'ordre du culte, ajoutez des chants et gérez les bénévoles.',
        selector: '.plan-detail',
      },
    ],
    'plan-templates': [
      {
        title: t('help.plan-templates_step1_title') || 'Modèles de plans',
        desc: t('help.plan-templates_step1_desc') || 'Créez et gérez des templates pour vos services.',
        selector: '.plan-templates-list',
      },
    ],
    'plan-template-detail': [
      {
        title: t('help.plan-template-detail_step1_title') || 'Détail du modèle',
        desc: t('help.plan-template-detail_step1_desc') || 'Configurez les éléments du template.',
        selector: '.plan-template-detail',
      },
    ],
    'member-detail': [
      {
        title: t('help.member-detail_step1_title') || 'Détail du membre',
        desc: t('help.member-detail_step1_desc') || 'Consultez les informations, ministères et notifications du membre.',
        selector: '.member-detail',
      },
    ],
    'team-detail': [
      {
        title: t('help.team-detail_step1_title') || 'Détail de l\'équipe',
        desc: t('help.team-detail_step1_desc') || 'Gérez les membres et les rôles de cette équipe.',
        selector: '.team-detail',
      },
    ],
    'house-group-detail': [
      {
        title: t('help.house-group-detail_step1_title') || 'Détail du groupe',
        desc: t('help.house-group-detail_step1_desc') || 'Consultez les membres et les réunions du groupe de maison.',
        selector: '.house-group-detail',
      },
    ],
    'email-compose': [
      {
        title: t('help.email-compose_step1_title') || 'Composer un email',
        desc: t('help.email-compose_step1_desc') || 'Envoyez des emails aux membres, équipes ou participants d\'un service.',
        selector: '.email-compose',
      },
    ],
    'email-templates': [
      {
        title: t('help.email-templates_step1_title') || 'Modèles d\'email',
        desc: t('help.email-templates_step1_desc') || 'Créez et gérez vos modèles d\'emails réutilisables.',
        selector: '.email-templates-list',
      },
    ],
    conflicts: [
      {
        title: t('help.conflicts_step1_title') || 'Conflits planifiés',
        desc: t('help.conflicts_step1_desc') || 'Consultez les conflits d\'assignation des bénévoles.',
        selector: '.conflict-logs',
      },
    ],
    'admin-members': [
      {
        title: t('help.admin-members_step1_title') || 'Administration des membres',
        desc: t('help.admin-members_step1_desc') || 'Gérez les rôles et permissions des membres.',
        selector: '.admin-members',
      },
    ],
    'mon-compte': [
      {
        title: t('help.mon-compte_step1_title') || 'Mon compte',
        desc: t('help.mon-compte_step1_desc') || 'Modifiez vos informations personnelles et préférences.',
        selector: '.mon-compte',
      },
    ],
    'admin-oneclick': [
      {
        title: t('help.admin-oneclick_step1_title') || 'Action one-click',
        desc: t('help.admin-oneclick_step1_desc') || 'Effectuez des actions administratives rapides.',
        selector: '.admin-oneclick',
      },
    ],
    historique: [
      {
        title: t('help.historique_step1_title') || 'Historique des services',
        desc: t('help.historique_step1_desc') || 'Consultez les services passés.',
        selector: '.historique',
      },
    ],
    annuaire: [
      {
        title: t('help.annuaire_step1_title') || 'Annuaire',
        desc: t('help.annuaire_step1_desc') || 'Recherchez et explorez les membres de l\'église.',
        selector: '.annuaire',
      },
    ],
    invitation: [
      {
        title: t('help.invitation_step1_title') || 'Invitation',
        desc: t('help.invitation_step1_desc') || 'Acceptez votre invitation et créez votre compte.',
        selector: '.invitation',
      },
    ],
    sondages: [
      {
        title: t('help.sondages_step1_title') || 'Sondages',
        desc: t('help.sondages_step1_desc') || 'Créez et participez aux sondages de l\'église.',
        selector: '.sondages-list',
      },
    ],
    annonces: [
      {
        title: t('help.annonces_step1_title') || 'Annonces & Prières',
        desc: t('help.annonces_step1_desc') || 'Publiez des annonces et des points de prière.',
        selector: '.annonces',
      },
    ],
    logs: [
      {
        title: t('help.logs_step1_title') || 'Logs API',
        desc: t('help.logs_step1_desc') || 'Consultez les logs des requêtes API.',
        selector: '.logs-view',
      },
    ],
    webhooks: [
      {
        title: t('help.webhooks_step1_title') || 'Webhooks',
        desc: t('help.webhooks_step1_desc') || 'Configurez des webhooks pour recevoir des notifications.',
        selector: '.webhooks-view',
      },
    ],
    messages: [
      {
        title: t('help.messages_step1_title') || 'Messagerie',
        desc: t('help.messages_step1_desc') || 'Envoyez et recevez des messages internes.',
        selector: '.messages-view',
      },
    ],
    'member-profile': [
      {
        title: t('help.member-profile_step1_title') || 'Profil membre',
        desc: t('help.member-profile_step1_desc') || 'Profil public d\'un membre avec ses équipes.',
        selector: '.member-profile',
      },
    ],
    kiosk: [
      {
        title: t('help.kiosk_step1_title') || 'Mode kiosque',
        desc: t('help.kiosk_step1_desc') || 'Affichez les grilles d\'accords en plein écran pour le service.',
        selector: '.kiosk',
      },
    ],
    'church-events': [
      {
        title: t('help.church-events_step1_title') || 'Événements',
        desc: t('help.church-events_step1_desc') || 'Créez et gérez les événements de l\'église.',
        selector: '.church-events',
      },
    ],
    youtube: [
      {
        title: t('help.youtube_step1_title') || 'Prédications YouTube',
        desc: t('help.youtube_step1_desc') || 'Consultez les prédications archivées sur YouTube.',
        selector: '.youtube-view',
      },
    ],
    'pco-sync': [
      {
        title: t('help.pco-sync_step1_title') || 'Synchronisation PCO',
        desc: t('help.pco-sync_step1_desc') || 'Synchronisez vos données avec Planning Center Online.',
        selector: '.pco-sync-view',
      },
    ],
    'music-stand-list': [
      {
        title: t('help.music-stand-list_step1_title') || 'Music Stand',
        desc: t('help.music-stand-list_step1_desc') || 'Parcourez les grilles d\'accords disponibles.',
        selector: '.music-stand-list',
      },
    ],
    'music-stand': [
      {
        title: t('help.music-stand_step1_title') || 'Music Stand détails',
        desc: t('help.music-stand_step1_desc') || 'Consultez la grille d\'accords en plein écran.',
        selector: '.music-stand',
      },
    ],
    setlist: [
      {
        title: t('help.setlist_step1_title') || 'Setlist',
        desc: t('help.setlist_step1_desc') || 'Visualisez l\'ordre du culte pour ce service.',
        selector: '.setlist-view',
      },
    ],
    dashboard: [
      {
        title: t('help.dashboard_step1_title') || 'Tableau de bord',
        desc: t('help.dashboard_step1_desc') || 'Vue d\'ensemble de l\'activité de l\'église.',
        selector: '.dashboard',
      },
    ],
    'not-found': [
      {
        title: t('help.not-found_step1_title') || 'Page introuvable',
        desc: t('help.not-found_step1_desc') || 'La page demandée n\'existe pas.',
        selector: '.not-found',
      },
    ],
    about: [
      {
        title: t('help.about_step1_title') || 'À propos',
        desc: t('help.about_step1_desc') || 'Page de présentation de l\'application et de ses modules.',
        selector: '.about-page',
      },
    ],
    'admin-content': [
      {
        title: t('help.admin-content_step1_title') || 'Éditeur de contenu',
        desc: t('help.admin-content_step1_desc') || 'Éditez les textes de l\'interface et sauvegardez vos modifications localement.',
        selector: '.admin-content',
      },
    ],
    'admin-test-accounts': [
      {
        title: t('help.admin-test-accounts_step1_title') || 'Comptes de test',
        desc: t('help.admin-test-accounts_step1_desc') || 'Basculez entre différents personas pour tester l\'application.',
        selector: '.admin-test-accounts',
      },
    ],
  }
}

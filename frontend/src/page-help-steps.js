// Centralisation de tous les steps/tours d’aide des pages principales
// Usage : import { stepsByPage } from './page-help-steps'
// puis : <PageHelp :steps="stepsByPage['members']" />
export function stepsByPage(t) {
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
        // Ajoutez ici d’autres pages…
    };
}

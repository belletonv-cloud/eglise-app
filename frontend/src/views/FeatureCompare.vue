<template>
  <div class="max-w-6xl mx-auto p-4">
    <div class="mb-4">
      <router-link to="/about" class="text-sm text-blue-700 dark:text-blue-300 hover:underline">← {{ $t('about.title') }}</router-link>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Comparatif des fonctionnalités
      </h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Une vue "produit" (inspirée de l'ancienne page Accueil Interactif) pour situer Église App vs Planning Center et clarifier les modules standalone.
      </p>
    </div>

    <section class="mt-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Modules (standalone)</h2>
      <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="app in standaloneApps" :key="app.name" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <div class="text-2xl">{{ app.icon }}</div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 dark:text-gray-100">{{ app.name }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ app.desc }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Équivaut à : <span class="font-semibold">{{ app.equivalent }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Comparaison (Planning Center vs Église App)</h2>
      <div class="mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-300">Fonctionnalité</th>
                <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-300">Planning Center</th>
                <th class="text-left px-4 py-2 text-gray-600 dark:text-gray-300">Église App</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparison" :key="row.feature" class="border-t border-gray-100 dark:border-gray-700">
                <td class="px-4 py-2 text-gray-900 dark:text-gray-100">{{ row.feature }}</td>
                <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ row.pco }}</td>
                <td class="px-4 py-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                    :class="row.us === '✅'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : row.us === '⚠️'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'"
                  >
                    {{ row.us }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const comparison = [
  { feature: 'Base de membres', pco: '✅ People', us: '✅' },
  { feature: 'Planning de services', pco: '✅ Services', us: '✅' },
  { feature: 'Templates de service', pco: '✅', us: '✅' },
  { feature: 'Scheduling bénévoles', pco: '✅', us: '✅' },
  { feature: 'Auto-schedule', pco: '✅', us: '⚠️' },
  { feature: 'Disponibilités / blockout', pco: '✅', us: '⚠️' },
  { feature: 'Music Stand', pco: '✅ (add-on)', us: '✅' },
  { feature: 'Transposition', pco: '✅', us: '✅' },
  { feature: 'Métronome', pco: '✅', us: '✅' },
  { feature: 'Annotations', pco: '✅', us: '✅' },
  { feature: 'Check-in', pco: '✅ Check-Ins', us: '✅' },
  { feature: 'Groupes', pco: '✅ Groups', us: '✅' },
  { feature: 'Emails', pco: '✅', us: '✅' },
  { feature: 'Webhooks', pco: '⚠️ API', us: '✅' },
  { feature: 'Sondages', pco: '❌', us: '✅' },
  { feature: 'PWA Offline', pco: '❌', us: '✅' },
  { feature: 'i18n', pco: '❌ (EN only)', us: '✅ FR/EN' },
  { feature: 'Sync PCO', pco: 'N/A', us: '✅' },
  { feature: 'Prix', pco: '$25-250+/mois', us: 'Gratuit (Cloudflare)' },
]

const standaloneApps = [
  { icon: '👥', name: 'Members', desc: 'CRM complet : profils, rôles, permissions, annuaire', equivalent: 'PCO People' },
  { icon: '📅', name: 'Planning', desc: 'Plans, ordre du culte, templates', equivalent: 'PCO Services' },
  { icon: '🎵', name: 'Music Stand', desc: 'ChordPro, transposition, métronome, annotations', equivalent: 'PCO Music Stand / OnSong' },
  { icon: '✅', name: 'Check-in', desc: 'QR code, manuel, statistiques', equivalent: 'PCO Check-Ins' },
  { icon: '🏠', name: 'Groups', desc: 'Groupes, leaders, réunions, membres', equivalent: 'PCO Groups' },
  { icon: '📧', name: 'Emails', desc: 'Templates, envoi en masse, variables', equivalent: 'Mailchimp (church)' },
  { icon: '📊', name: 'Polls', desc: 'Sondages internes, expiration', equivalent: 'Doodle / StrawPoll' },
  { icon: '🔗', name: 'Webhooks', desc: 'Intégrations vers outils externes', equivalent: 'Zapier / Make' },
]
</script>

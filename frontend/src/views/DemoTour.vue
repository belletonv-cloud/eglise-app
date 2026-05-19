<template>
  <div class="demo-tour">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>🎸 Église App — Mode Démo</h1>
        <p class="hero-sub">
          Découvrez toutes les fonctionnalités de l'application de gestion d'église.
          <br />Inspiré de <strong>Planning Center</strong>, <strong>Music Stand</strong> et plus encore.
        </p>
        <button @click="startTour" class="btn-primary">
          ▶ Commencer la visite
        </button>
        <button @click="enterDemo" class="btn-secondary">
          🚀 Accéder directement au Dashboard
        </button>
      </div>
    </section>

    <!-- Feature Grid -->
    <section class="features" v-if="!tourActive">
      <h2>Tout ce que vous pouvez faire</h2>
      <div class="feature-grid">
        <div v-for="f in features" :key="f.title" class="feature-card" @click="goToFeature(f)">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
          <span class="feature-tag" :class="f.tagClass">{{ f.tag }}</span>
        </div>
      </div>
    </section>

    <!-- Tour Steps -->
    <section v-if="tourActive" class="tour-viewer">
      <div class="tour-header">
        <button @click="tourActive = false" class="btn-back">← Retour</button>
        <span class="tour-step">{{ currentStep + 1 }} / {{ tourSteps.length }}</span>
      </div>

      <div class="tour-content" v-if="currentTourStep">
        <div class="tour-icon">{{ currentTourStep.icon }}</div>
        <h2>{{ currentTourStep.title }}</h2>
        <p>{{ currentTourStep.desc }}</p>

        <div class="tour-actions">
          <button @click="prevStep" :disabled="currentStep === 0" class="btn-nav">← Précédent</button>
          <button v-if="currentStep < tourSteps.length - 1" @click="nextStep" class="btn-nav">Suivant →</button>
          <button v-else @click="enterDemo" class="btn-primary">🚀 Lancer la démo complète</button>
        </div>
      </div>

      <!-- Progress dots -->
      <div class="tour-dots">
        <span v-for="(_, i) in tourSteps" :key="i" class="dot" :class="{ active: i === currentStep }" @click="currentStep = i"></span>
      </div>
    </section>

    <!-- Comparison table -->
    <section class="comparison" v-if="!tourActive">
      <h2>Comparaison avec Planning Center</h2>
      <div class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Fonctionnalité</th>
              <th>Planning Center</th>
              <th>Église App</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparison" :key="row.feature">
              <td>{{ row.feature }}</td>
              <td>{{ row.pco }}</td>
              <td :class="row.us === '✅' ? 'yes' : row.us === '⚠️' ? 'partial' : 'no'">{{ row.us }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Standalone apps potential -->
    <section class="standalone" v-if="!tourActive">
      <h2>Chaque module = une app standalone potentielle</h2>
      <div class="app-grid">
        <div v-for="app in standaloneApps" :key="app.name" class="app-card">
          <div class="app-icon">{{ app.icon }}</div>
          <h3>{{ app.name }}</h3>
          <p class="app-desc">{{ app.desc }}</p>
          <p class="app-equiv">Équivaut à : <strong>{{ app.equivalent }}</strong></p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { enableDemoMode } from '../stores/demo'

const router = useRouter()
const tourActive = ref(false)
const currentStep = ref(0)

const currentTourStep = computed(() => tourSteps[currentStep.value] ?? tourSteps[0])

const features = [
  { icon: '📊', title: 'Dashboard', desc: 'Vue d\'ensemble : membres, services à venir, confirmations en attente', tag: 'Core', tagClass: 'tag-core' },
  { icon: '📅', title: 'Planning des services', desc: 'Créer des plans, ordres de culte, templates réutilisables', tag: 'Services', tagClass: 'tag-services' },
  { icon: '🎵', title: 'Music Stand', desc: 'Grilles ChordPro, transposition, métronome, auto-scroll, mode scène', tag: 'Music', tagClass: 'tag-music' },
  { icon: '👥', title: 'Gestion des membres', desc: 'CRUD, rôles, permissions RBAC, annuaire, profils', tag: 'People', tagClass: 'tag-people' },
  { icon: '🎪', title: 'Équipes & bénévolat', desc: 'Teams, positions, scheduling, détection de conflits', tag: 'Teams', tagClass: 'tag-teams' },
  { icon: '✅', title: 'Check-in', desc: 'QR code, check-in manuel, suivi des présences', tag: 'Check-in', tagClass: 'tag-checkin' },
  { icon: '🏠', title: 'Groupes de maison', desc: 'Groupes cellulaires, leaders, réunions, membres', tag: 'Groups', tagClass: 'tag-groups' },
  { icon: '📧', title: 'Emails', desc: 'Composer, templates, envoi en masse à équipes/services', tag: 'Comms', tagClass: 'tag-comms' },
  { icon: '📢', title: 'Annonces & prières', desc: 'Publier des annonces et points de prière', tag: 'Comms', tagClass: 'tag-comms' },
  { icon: '📊', title: 'Sondages', desc: 'Créer des sondages, votes multiples, expiration', tag: 'Engagement', tagClass: 'tag-engagement' },
  { icon: '🖥️', title: 'Mode Kiosque', desc: 'Affichage plein écran des grilles d\'accords pour la scène', tag: 'Music', tagClass: 'tag-music' },
  { icon: '🔄', title: 'Sync PCO', desc: 'Synchronisation Planning Center Online → D1', tag: 'Integration', tagClass: 'tag-integration' },
  { icon: '▶️', title: 'Prédications YouTube', desc: 'Intégration YouTube pour les prédications', tag: 'Media', tagClass: 'tag-media' },
  { icon: '🔗', title: 'Webhooks', desc: 'Intégrations externes, retry automatique', tag: 'Integration', tagClass: 'tag-integration' },
  { icon: '🌙', title: 'Mode sombre', desc: 'Interface dark mode complète', tag: 'UX', tagClass: 'tag-ux' },
  { icon: '🌍', title: 'i18n FR/EN', desc: 'Interface bilingue français/anglais', tag: 'UX', tagClass: 'tag-ux' },
]

const tourSteps = [
  { icon: '📊', title: 'Dashboard', desc: 'Vue d\'ensemble avec statistiques : membres actifs, services à venir, chants avec grilles, confirmations en attente. Navigation rapide vers les sections principales.' },
  { icon: '📅', title: 'Planning & Services', desc: 'Créez des plans de service avec ordre de culte détaillé. Utilisez des templates pour les services récurrents. Ajoutez chants, annonces, médias. Planifiez sur plusieurs semaines.' },
  { icon: '🎵', title: 'Music Stand', desc: 'Le cœur musical : grilles ChordPro avec transposition en temps réel (±12 demi-tons), métronome intégré, auto-scroll au BPM, mode scène sombre, navigation setlist, partage par URL (?key=G&bpm=72).' },
  { icon: '👥', title: 'Gestion des membres', desc: 'Base de données complète : profils, coordonnées, type de membre, notes. Permissions RBAC fines (admin, scheduler, editor, music_director, volunteer, viewer). Exceptions par ressource.' },
  { icon: '🎪', title: 'Équipes & Scheduling', desc: 'Créez des équipes (louange, son, lumières, accueil...). Assignez des positions. Détectez les conflits de scheduling automatiquement. Forcer avec traçage.' },
  { icon: '✅', title: 'Check-in & Présences', desc: 'QR code pour check-in rapide, saisie manuelle pour les invités. Suivi des présences par service. Statistiques d\'assiduité annuelles.' },
  { icon: '🏠', title: 'Groupes de maison', desc: 'Gérez les groupes cellulaires : leaders, jour/heure de réunion, lieu, membres, historique des réunions.' },
  { icon: '📧', title: 'Communication', desc: 'Emails individuels ou en masse (équipes, services planifiés). Templates avec variables. Annonces et points de prière. Sondages avec votes.' },
  { icon: '🖥️', title: 'Mode Kiosque', desc: 'Affichage plein écran pour la scène : grilles d\'accords lisibles de loin, navigation au clic/clavier, informations du service.' },
  { icon: '🚀', title: 'Prêt !', desc: 'Tout est fonctionnel, responsive, bilingue, avec PWA offline. Cliquez ci-dessous pour accéder au dashboard démo et explorer par vous-même.' },
]

const comparison = [
  { feature: 'Base de membres', pco: '✅ People', us: '✅' },
  { feature: 'Planning de services', pco: '✅ Services', us: '✅' },
  { feature: 'Templates de service', pco: '✅', us: '✅' },
  { feature: 'Scheduling bénévoles', pco: '✅', us: '✅' },
  { feature: 'Auto-schedule', pco: '✅', us: '⚠️' },
  { feature: 'Disponibilités / blockout', pco: '✅', us: '⚠️' },
  { feature: 'Music Stand', pco: '✅ (add-on $5/mois)', us: '✅' },
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
  { icon: '👥', name: 'Members', desc: 'CRM complet pour églises : profils, rôles, permissions, annuaire', equivalent: 'Breeze ChMS, Planning Center People' },
  { icon: '📅', name: 'Planning', desc: 'Orchestration de services : plans, templates, ordre de culte', equivalent: 'Planning Center Services' },
  { icon: '🎵', name: 'Music Stand', desc: 'Lecteur de partitions : ChordPro, transposition, métronome, annotations', equivalent: 'Planning Center Music Stand, OnSong' },
  { icon: '✅', name: 'Check-in', desc: 'Système de présence : QR code, manuel, statistiques', equivalent: 'Planning Center Check-Ins' },
  { icon: '🏠', name: 'Groups', desc: 'Gestion de groupes cellulaires : leaders, réunions, membres', equivalent: 'Planning Center Groups' },
  { icon: '📧', name: 'Emails', desc: 'Communication ciblée : templates, envoi en masse, variables', equivalent: 'Mailchimp pour églises' },
  { icon: '📊', name: 'Polls', desc: 'Sondages internes : votes multiples, expiration', equivalent: 'Doodle / StrawPoll' },
  { icon: '🔗', name: 'Webhooks', desc: 'Intégrations : connecteurs vers outils externes', equivalent: 'Zapier / Make' },
]

function startTour() {
  tourActive.value = true
  currentStep.value = 0
}

function nextStep() {
  if (currentStep.value < tourSteps.length - 1) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function goToFeature(f: any) {
  tourActive.value = true
  const idx = tourSteps.findIndex(s => s.title === f.title)
  currentStep.value = idx >= 0 ? idx : 0
}

function enterDemo() {
  enableDemoMode()
  router.push('/dashboard')
}
</script>

<style scoped>
.demo-tour {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.hero {
  text-align: center;
  padding: 80px 24px 60px;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%);
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-sub {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #94a3b8;
  margin-bottom: 32px;
  line-height: 1.6;
}

.btn-primary {
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin: 8px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  display: inline-block;
  padding: 14px 32px;
  background: transparent;
  color: #818cf8;
  border: 2px solid #6366f1;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin: 8px;
}

.btn-secondary:hover {
  background: rgba(99, 102, 241, 0.1);
}

.features {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.features h2 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: #f1f5f9;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.feature-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: #6366f1;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 6px;
}

.feature-card p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 10px;
  line-height: 1.4;
}

.feature-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tag-core { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.tag-services { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.tag-music { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.tag-people { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.tag-teams { background: rgba(236, 72, 153, 0.2); color: #f472b6; }
.tag-checkin { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.tag-groups { background: rgba(20, 184, 166, 0.2); color: #2dd4bf; }
.tag-comms { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.tag-engagement { background: rgba(251, 146, 60, 0.2); color: #fb923c; }
.tag-integration { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
.tag-media { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.tag-ux { background: rgba(168, 85, 247, 0.2); color: #c084fc; }

.tour-viewer {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.btn-back {
  background: none;
  border: none;
  color: #818cf8;
  font-size: 1rem;
  cursor: pointer;
}

.tour-step {
  color: #64748b;
  font-size: 0.9rem;
}

.tour-content {
  text-align: center;
}

.tour-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.tour-content h2 {
  font-size: 1.8rem;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.tour-content > p {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 32px;
}

.tour-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.btn-nav {
  padding: 10px 24px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.3);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tour-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  background: #6366f1;
  transform: scale(1.3);
}

.comparison {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 24px;
}

.comparison h2 {
  text-align: center;
  font-size: 1.8rem;
  color: #f1f5f9;
  margin-bottom: 32px;
}

.comparison-table {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

th {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  font-weight: 600;
  font-size: 0.9rem;
}

td {
  font-size: 0.9rem;
  color: #cbd5e1;
}

td.yes { color: #4ade80; }
td.partial { color: #fbbf24; }
td.no { color: #f87171; }

.standalone {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}

.standalone h2 {
  text-align: center;
  font-size: 1.8rem;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.standalone > p {
  text-align: center;
  color: #94a3b8;
  margin-bottom: 32px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.app-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  padding: 20px;
}

.app-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.app-card h3 {
  font-size: 1rem;
  color: #f1f5f9;
  margin: 0 0 6px;
}

.app-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 10px;
  line-height: 1.4;
}

.app-equiv {
  font-size: 0.75rem;
  color: #6366f1;
  margin: 0;
}

.app-equiv strong {
  color: #818cf8;
}

@media (max-width: 768px) {
  .hero { padding: 60px 16px 40px; }
  .hero h1 { font-size: 2rem; }
  .btn-primary, .btn-secondary { display: block; width: 100%; margin: 8px 0; }
  .feature-grid { grid-template-columns: 1fr; }
  .app-grid { grid-template-columns: 1fr; }
  .tour-actions { flex-direction: column; }
  .tour-actions .btn-nav { width: 100%; }
}
</style>

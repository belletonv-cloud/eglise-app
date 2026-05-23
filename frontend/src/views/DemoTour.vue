<template>
  <div class="demo-tour">
    <section class="hero">
      <div class="hero-content">
        <h1>🚀 Église App</h1>
        <p class="hero-sub">
          Découvrez toutes les fonctionnalités de l'application de gestion d'église.
          <br />Inspiré de <strong>Planning Center</strong>, <strong>Music Stand</strong> et plus encore.
        </p>
        <button @click="startTour" class="btn-primary">
          ▶ Commencer la visite guidée
        </button>
        <button @click="enterDemo" class="btn-secondary">
          🚀 Accéder directement au Dashboard
        </button>
      </div>
    </section>

    <section class="features">
      <h2>Tout ce que vous pouvez faire</h2>
      <div class="feature-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <section class="comparison">
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { startDemoTour, enableInteractiveView, tourSteps } from '../stores/demo'

const router = useRouter()

const features = [
  { icon: '📊', title: 'Dashboard', desc: "Vue d'ensemble : membres, services à venir, confirmations" },
  { icon: '📅', title: 'Planning des services', desc: 'Plans, ordres de culte, templates réutilisables' },
  { icon: '🎵', title: 'Music Stand', desc: 'ChordPro, transposition, métronome, auto-scroll' },
  { icon: '👥', title: 'Gestion des membres', desc: 'CRUD, rôles, permissions RBAC, annuaire' },
  { icon: '🎪', title: 'Équipes & bénévolat', desc: 'Teams, positions, scheduling, conflits' },
  { icon: '✅', title: 'Check-in', desc: 'QR code, check-in manuel, statistiques' },
  { icon: '🏠', title: 'Groupes de maison', desc: 'Groupes, leaders, réunions, membres' },
  { icon: '📧', title: 'Emails', desc: 'Templates, envoi en masse, variables' },
]

const comparison = [
  { feature: 'Base de membres', pco: '✅ People', us: '✅' },
  { feature: 'Planning de services', pco: '✅ Services', us: '✅' },
  { feature: 'Templates de service', pco: '✅', us: '✅' },
  { feature: 'Scheduling bénévoles', pco: '✅', us: '✅' },
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
  { feature: 'i18n', pco: '❌', us: '✅ FR/EN' },
  { feature: 'Sync PCO', pco: 'N/A', us: '✅' },
  { feature: 'Prix', pco: '$25-250+/mois', us: 'Gratuit' },
]

function startTour() {
  startDemoTour()
  router.push(tourSteps[0].route)
}

function enterDemo() {
  enableInteractiveView()
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
  margin: 0;
  line-height: 1.4;
}

.comparison {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 24px 80px;
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

@media (max-width: 768px) {
  .hero { padding: 60px 16px 40px; }
  .hero h1 { font-size: 2rem; }
  .btn-primary, .btn-secondary { display: block; width: 100%; margin: 8px 0; }
  .feature-grid { grid-template-columns: 1fr; }
}
</style>

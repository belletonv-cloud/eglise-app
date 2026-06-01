<template>
  <div class="wysiwyg-editor">
    <!-- Tabs -->
    <div class="editor-tabs">
      <button :class="['tab-btn', { active: mode === 'visual' }]" @click="mode = 'visual'">✏️ Éditeur visuel</button>
      <button :class="['tab-btn', { active: mode === 'raw' }]" @click="mode = 'raw'">🔤 ChordPro brut</button>
      <div class="tab-spacer"></div>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <!-- ===== Mode Visuel ===== -->
    <div v-if="mode === 'visual'" class="visual-mode">
      <div class="toolbar-row">
        <div class="chord-palette">
          <span class="palette-label">Accord à placer :</span>
          <input v-model="pendingChord" type="text" placeholder="Ex: Am7" maxlength="8" class="chord-input" @keydown.enter.prevent />
          <div class="chord-presets">
            <button v-for="c in commonChords" :key="c" @click="pendingChord = c"
              :class="['preset-btn', { selected: pendingChord === c }]">{{ c }}</button>
          </div>
        </div>
        <div class="mode-hints">
          <span v-if="pendingChord" class="hint active">Clique entre les syllabes pour placer [{{ pendingChord }}]</span>
          <span v-else class="hint">Sélectionne un accord ou tape le dans le champ</span>
        </div>
      </div>

      <div class="visual-sheet">
        <div v-for="(line, lineIdx) in visualLines" :key="lineIdx" class="vline">
          <!-- Section / directive headers -->
          <div v-if="line.type === 'header'" class="section-header">{{ line.text }}</div>

          <!-- Empty line -->
          <div v-else-if="line.type === 'empty'" class="empty-line"></div>

          <!-- Lyric + chord line -->
          <div v-else class="lyric-line">
            <span v-for="(seg, segIdx) in line.segments" :key="segIdx" class="seg-group">
              <!-- Insert zone BEFORE this segment -->
              <span
                :class="['insert-zone', { 'has-chord': !!seg.chord, 'active': pendingChord }]"
                @click="insertAt(lineIdx, segIdx)"
                :title="pendingChord ? `Placer [${pendingChord}] ici` : 'Sélectionne un accord d\'abord'"
              >
                <!-- Chord bubble above -->
                <span v-if="seg.chord" class="chord-bubble" @click.stop>
                  <span class="chord-text">{{ seg.chord }}</span>
                  <button class="chord-remove" @click.stop="removeChordAt(lineIdx, segIdx)" title="Supprimer cet accord">×</button>
                </span>
                <span v-else-if="pendingChord" class="insert-indicator">+</span>
              </span>
              <!-- Lyric text -->
              <span class="lyric-text">{{ seg.lyric }}</span>
            </span>
            <!-- Insert zone at end of line -->
            <span
              :class="['insert-zone end-zone', { 'active': pendingChord }]"
              @click="insertAt(lineIdx, line.segments.length)"
              title="Ajouter un accord en fin de ligne"
            >
              <span v-if="pendingChord" class="insert-indicator">+</span>
            </span>
          </div>
        </div>
        <div v-if="visualLines.length === 0" class="empty-sheet">
          <p>Aucune partition. Passe en mode "ChordPro brut" pour saisir les paroles.</p>
        </div>
      </div>
    </div>

    <!-- ===== Mode Raw ===== -->
    <div v-else class="raw-mode">
      <textarea
        v-model="localChart"
        rows="18"
        class="raw-textarea"
        placeholder="{title: Mon chant}
[C]Voici les pa[G]roles du chant
[Am]Et la suite [F]vient après"
        spellcheck="false"
      ></textarea>
      <p class="raw-hint">Syntaxe : <strong>[C]</strong> avant la syllabe correspondante · <code>{verse}</code> <code>{chorus}</code> pour les sections</p>
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <span v-if="message" :class="['footer-message', message.type]">{{ message.text }}</span>
      <div class="footer-actions">
        <button @click="$emit('close')" class="btn-cancel">Annuler</button>
        <button @click="save" :disabled="saving" class="btn-save">
          {{ saving ? 'Sauvegarde…' : '💾 Sauvegarder' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '../utils/api'

const props = defineProps<{
  arrangementId: number
  initialChart: string
}>()
const emit = defineEmits(['close', 'save'])

const mode = ref<'visual' | 'raw'>('visual')
const localChart = ref(props.initialChart || '')
const saving = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const pendingChord = ref('')

const commonChords = ['C', 'G', 'Am', 'F', 'D', 'E', 'Dm', 'Em', 'A', 'Bm', 'G7', 'C/E', 'F/A', 'Am7', 'Fmaj7', 'Gsus4']

// ===== Parsing =====
interface Segment { chord: string; lyric: string }
interface VisualLine {
  type: 'lyric' | 'header' | 'empty'
  rawLineIdx: number // index dans localChart.value.split('\n')
  text: string // for header lines
  segments: Segment[]
}

const visualLines = computed<VisualLine[]>(() => {
  const rawLines = localChart.value.split('\n')
  const result: VisualLine[] = []

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      result.push({ type: 'empty', rawLineIdx: i, text: '', segments: [] })
      continue
    }

    // Headers / directives
    if (trimmed.startsWith('{') || (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.slice(1, -1).match(/\s/))) {
      result.push({ type: 'header', rawLineIdx: i, text: trimmed, segments: [] })
      continue
    }

    // Parse inline ChordPro [Chord]lyric
    const segments: Segment[] = []
    let remaining = trimmed
    while (remaining.length > 0) {
      const chordStart = remaining.indexOf('[')
      const chordEnd = chordStart !== -1 ? remaining.indexOf(']', chordStart) : -1

      if (chordStart === -1 || chordEnd === -1) {
        if (remaining) segments.push({ chord: '', lyric: remaining })
        break
      }
      if (chordStart > 0) {
        segments.push({ chord: '', lyric: remaining.slice(0, chordStart) })
      }
      const chord = remaining.slice(chordStart + 1, chordEnd)
      const afterChord = remaining.slice(chordEnd + 1)
      const nextChord = afterChord.indexOf('[')
      const lyric = nextChord === -1 ? afterChord : afterChord.slice(0, nextChord)
      segments.push({ chord, lyric })
      remaining = nextChord === -1 ? '' : afterChord.slice(nextChord)
    }
    if (segments.length === 0) segments.push({ chord: '', lyric: trimmed })
    result.push({ type: 'lyric', rawLineIdx: i, text: trimmed, segments })
  }
  return result
})

// ===== Mutations =====
function segmentsToChordPro(segments: Segment[]): string {
  return segments.map(s => (s.chord ? `[${s.chord}]` : '') + s.lyric).join('')
}

function updateLine(rawLineIdx: number, segments: Segment[]) {
  const lines = localChart.value.split('\n')
  lines[rawLineIdx] = segmentsToChordPro(segments)
  localChart.value = lines.join('\n')
}

function insertAt(lineIdx: number, segIdx: number) {
  if (!pendingChord.value) return
  const vline = visualLines.value[lineIdx]
  if (!vline || vline.type !== 'lyric') return

  const segs: Segment[] = vline.segments.map(s => ({ chord: s.chord, lyric: s.lyric }))
  if (segIdx >= segs.length) {
    segs.push({ chord: pendingChord.value, lyric: '' })
  } else {
    segs[segIdx] = { chord: pendingChord.value, lyric: segs[segIdx]?.lyric ?? '' }
  }
  updateLine(vline.rawLineIdx, segs)
  message.value = null
}

function removeChordAt(lineIdx: number, segIdx: number) {
  const vline = visualLines.value[lineIdx]
  if (!vline || vline.type !== 'lyric') return
  const segs: Segment[] = vline.segments.map(s => ({ chord: s.chord, lyric: s.lyric }))
  const seg = segs[segIdx]
  if (seg) segs[segIdx] = { chord: '', lyric: seg.lyric }
  updateLine(vline.rawLineIdx, segs)
}

// ===== Save =====
async function save() {
  saving.value = true
  message.value = null
  try {
    await api.updateArrangement(props.arrangementId, { chord_chart: localChart.value })
    message.value = { type: 'success', text: 'Sauvegardé ✓' }
    emit('save', localChart.value)
    setTimeout(() => emit('close'), 800)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || 'Erreur de sauvegarde' }
  } finally {
    saving.value = false
  }
}

watch(() => props.initialChart, v => { localChart.value = v || '' })
</script>

<style scoped>
.wysiwyg-editor {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.editor-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 12px;
  gap: 4px;
  background: #f9fafb;
}
.tab-btn {
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }
.tab-btn:hover:not(.active) { color: #374151; }
.tab-spacer { flex: 1; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af; padding: 8px; }
.close-btn:hover { color: #374151; }

/* Visual mode */
.visual-mode { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.toolbar-row {
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: #fafbff;
}
.palette-label { font-size: 12px; font-weight: 600; color: #4b5563; }
.chord-input {
  width: 72px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  font-weight: 700;
  color: #2563eb;
  text-align: center;
}
.chord-presets { display: flex; flex-wrap: wrap; gap: 4px; }
.preset-btn {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 12px;
  font-family: monospace;
  cursor: pointer;
  color: #374151;
  transition: all 0.1s;
}
.preset-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.preset-btn.selected { background: #2563eb; color: white; border-color: #2563eb; }
.mode-hints .hint { font-size: 12px; color: #9ca3af; font-style: italic; }
.mode-hints .hint.active { color: #7c3aed; font-weight: 600; }

.visual-sheet {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  font-family: 'Courier New', monospace;
  background: white;
  line-height: 1.8;
}
.section-header {
  color: #6366f1;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 12px 0 4px;
  opacity: 0.8;
}
.empty-line { height: 14px; }

.lyric-line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 2px;
}

.seg-group {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-end;
}

.insert-zone {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 12px;
  height: 48px;
  cursor: default;
  position: relative;
  vertical-align: bottom;
}
.insert-zone.active { cursor: pointer; }
.insert-zone.active:hover .insert-indicator { opacity: 1; background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
.insert-zone.active:hover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 24px;
  background: #93c5fd;
  opacity: 0.6;
  border-radius: 1px;
}

.chord-bubble {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  padding: 0 4px;
  margin-bottom: 2px;
  cursor: default;
}
.chord-text {
  font-size: 13px;
  font-weight: 700;
  color: #1d4ed8;
  font-family: 'Courier New', monospace;
}
.chord-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #93c5fd;
  padding: 0 1px;
  line-height: 1;
}
.chord-remove:hover { color: #ef4444; }

.insert-indicator {
  font-size: 11px;
  font-weight: 700;
  color: #d1d5db;
  width: 14px;
  height: 14px;
  border: 1px dashed #d1d5db;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: all 0.1s;
  margin-bottom: 2px;
}

.lyric-text {
  font-size: 16px;
  color: #1f2937;
  display: inline;
  line-height: 1;
  align-self: flex-end;
  padding-bottom: 1px;
}

.end-zone { min-width: 16px; }

.empty-sheet { color: #9ca3af; font-style: italic; text-align: center; padding: 32px; font-family: sans-serif; font-size: 14px; }

/* Raw mode */
.raw-mode { flex: 1; display: flex; flex-direction: column; padding: 12px; gap: 8px; overflow: hidden; }
.raw-textarea {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: none;
  line-height: 1.6;
  outline: none;
}
.raw-textarea:focus { border-color: #6366f1; }
.raw-hint { font-size: 11px; color: #9ca3af; }
.raw-hint strong { color: #2563eb; }
.raw-hint code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }

/* Footer */
.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  gap: 8px;
}
.footer-message { font-size: 13px; }
.footer-message.success { color: #16a34a; }
.footer-message.error { color: #dc2626; }
.footer-actions { display: flex; gap: 8px; margin-left: auto; }
.btn-cancel { padding: 7px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 13px; color: #6b7280; }
.btn-cancel:hover { background: #f9fafb; }
.btn-save { padding: 7px 18px; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-save:hover { background: #1d4ed8; }
.btn-save:disabled { opacity: 0.5; cursor: default; }
</style>

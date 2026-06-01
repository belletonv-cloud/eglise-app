<template>
  <div
    ref="containerRef"
    class="ms-canvas-wrap"
    :class="{ 'is-active': active, 'is-readonly': readonly }"
    @click.stop
  >
    <!-- Own drawing canvas -->
    <canvas
      ref="ownCanvas"
      class="ms-canvas own"
      :style="{ pointerEvents: active && !readonly ? 'auto' : 'none', cursor: eraserCursor }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerLeave"
    />
    <!-- Other members' drawings (read-only overlays) -->
    <canvas
      v-for="d in visibleOtherDrawings"
      :key="d.member_id"
      :ref="el => setOtherCanvas(d.member_id, el as HTMLCanvasElement)"
      class="ms-canvas other"
    />

    <!-- Floating toolbar -->
    <div v-if="active" class="canvas-toolbar" @click.stop @pointerdown.stop>
      <!-- Tool selector -->
      <div class="tool-group">
        <button v-for="tool in tools" :key="tool.id"
          :class="['tool-btn', { active: currentTool === tool.id }]"
          @click="currentTool = tool.id"
          :title="tool.label">
          {{ tool.icon }}
        </button>
      </div>

      <div class="sep" />

      <!-- Color picker (pen/highlighter/text only) -->
      <div v-if="currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'text'" class="tool-group">
        <button v-for="c in colors" :key="c"
          :class="['color-dot', { active: currentColor === c }]"
          :style="{ background: c }"
          @click="currentColor = c"
          :title="c" />
      </div>

      <!-- Size slider (not for eraser) -->
      <div v-if="currentTool !== 'eraser'" class="tool-group">
        <input type="range" min="1" max="20" v-model.number="currentSize" class="size-slider" :title="`Épaisseur: ${currentSize}px`" />
        <span class="size-label">{{ currentSize }}px</span>
      </div>

      <!-- Eraser radius (eraser only) -->
      <div v-else class="tool-group">
        <input type="range" min="8" max="60" v-model.number="eraserRadius" class="size-slider" :title="`Rayon gomme: ${eraserRadius}px`" />
        <span class="size-label">{{ eraserRadius }}px</span>
      </div>

      <div class="sep" />

      <!-- Share toggle -->
      <label class="share-label" :title="isShared ? 'Partagé avec l\'équipe' : 'Privé'">
        <input type="checkbox" v-model="isShared" @change="saveDebounced()" />
        <span>{{ isShared ? '👥' : '🔒' }}</span>
      </label>

      <!-- Erase all -->
      <button class="tool-btn danger" @click="eraseAll" title="Effacer tout (mes annotations)">🗑</button>

      <!-- Member annotation selector -->
      <div class="selector-wrap" v-if="otherDrawings.length > 0">
        <button class="tool-btn" :class="{ active: showSelector }" @click="showSelector = !showSelector" title="Annotations des autres">👤</button>
        <div v-if="showSelector" class="selector-popup" @click.stop>
          <div v-for="d in otherDrawings" :key="d.member_id"
            :class="['selector-item', { checked: visibleMemberIds.has(d.member_id) }]"
            @click="toggleMember(d.member_id)">
            <span class="check">{{ visibleMemberIds.has(d.member_id) ? '✓' : '○' }}</span>
            <span class="name">{{ d.first_name }} {{ d.last_name }}</span>
            <span v-if="!d.is_shared" class="private-badge">privé</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { api } from '../../utils/api'
import { showToast } from '../../stores/toast'
import { member as currentMember } from '../../stores/member'

const props = defineProps<{
  arrangementId: number
  active: boolean
  readonly?: boolean
}>()

// ── Types ─────────────────────────────────────────────────────────────────────
type Tool = 'pen' | 'highlighter' | 'text' | 'eraser'

interface Point { x: number; y: number }
interface Stroke {
  tool: Tool
  color: string
  size: number
  opacity: number
  points: Point[]
  text?: string
  x?: number
  y?: number
}

// ── Refs ──────────────────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const ownCanvas    = ref<HTMLCanvasElement | null>(null)
const otherCanvasMap = new Map<number, HTMLCanvasElement>()
function setOtherCanvas(memberId: number, el: HTMLCanvasElement | null) {
  if (el) otherCanvasMap.set(memberId, el)
  else otherCanvasMap.delete(memberId)
}

// ── State ─────────────────────────────────────────────────────────────────────
const currentTool  = ref<Tool>('pen')
const currentColor = ref('#f59e0b')
const currentSize  = ref(3)
const eraserRadius = ref(20)
const isShared     = ref(false)
const strokes      = ref<Stroke[]>([])
const activeStroke = ref<Stroke | null>(null)
const isDrawing    = ref(false)
const allDrawings  = ref<any[]>([])
const visibleMemberIds = ref(new Set<number>())
const showSelector = ref(false)
const saveTimer    = ref<any>(null)

// Eraser hover preview (circle cursor)
const eraserPreview = ref<Point | null>(null)

const ownMemberId = computed(() => currentMember.value?.id ?? null)

const otherDrawings = computed(() =>
  allDrawings.value.filter(d => d.member_id !== ownMemberId.value)
)
const visibleOtherDrawings = computed(() =>
  otherDrawings.value.filter(d => visibleMemberIds.value.has(d.member_id))
)

const eraserCursor = computed(() =>
  currentTool.value === 'eraser' ? 'none' : 'crosshair'
)

const tools: { id: Tool; icon: string; label: string }[] = [
  { id: 'pen',         icon: '✏️', label: 'Stylo' },
  { id: 'highlighter', icon: '🖍',  label: 'Surligneur' },
  { id: 'text',        icon: 'T',   label: 'Texte' },
  { id: 'eraser',      icon: '⌫',   label: 'Gomme (supprime un trait)' },
]
const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#000000']

// ── Canvas helpers ─────────────────────────────────────────────────────────────
function resizeCanvas(canvas: HTMLCanvasElement) {
  if (!canvas || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width  = rect.width
    canvas.height = rect.height
  }
}

function getPos(e: PointerEvent): Point {
  const rect = ownCanvas.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.tool === 'text') {
    ctx.save()
    ctx.font = `${stroke.size * 5 + 10}px sans-serif`
    ctx.fillStyle = stroke.color
    ctx.globalAlpha = stroke.opacity ?? 1
    ctx.fillText(stroke.text || '', stroke.x ?? 0, stroke.y ?? 0)
    ctx.restore()
    return
  }
  if (stroke.points.length < 1) return
  ctx.save()
  ctx.strokeStyle = stroke.color
  ctx.lineWidth   = stroke.tool === 'highlighter' ? stroke.size * 5 : stroke.size
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : (stroke.opacity ?? 1)
  ctx.beginPath()
  ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y)
  }
  ctx.stroke()
  ctx.restore()
}

function renderStrokes(canvas: HTMLCanvasElement, strokeList: Stroke[], preview?: { eraserPos: Point; radius: number } | null) {
  resizeCanvas(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const s of strokeList) drawStroke(ctx, s)
  // Draw eraser circle preview
  if (preview) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(preview.eraserPos.x, preview.eraserPos.y, preview.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

function renderOwn(withPreview = false) {
  if (!ownCanvas.value) return
  renderStrokes(
    ownCanvas.value,
    strokes.value,
    withPreview && eraserPreview.value
      ? { eraserPos: eraserPreview.value, radius: eraserRadius.value }
      : null
  )
}

function renderOther(memberId: number, strokeList: Stroke[]) {
  const canvas = otherCanvasMap.get(memberId)
  if (canvas) renderStrokes(canvas, strokeList)
}

function renderOthers() {
  for (const d of visibleOtherDrawings.value) {
    const parsed: Stroke[] = typeof d.paths === 'string' ? JSON.parse(d.paths) : (d.paths ?? [])
    renderOther(d.member_id, parsed)
  }
}

// ── Eraser hit-test ────────────────────────────────────────────────────────
/** Returns true if the stroke passes within `radius` of `pos` */
function strokeHitsEraser(stroke: Stroke, pos: Point, radius: number): boolean {
  if (stroke.tool === 'text') {
    return Math.hypot((stroke.x ?? 0) - pos.x, (stroke.y ?? 0) - pos.y) < radius + 20
  }
  for (const p of stroke.points) {
    if (Math.hypot(p.x - pos.x, p.y - pos.y) < radius) return true
  }
  return false
}

// ── Pointer events ─────────────────────────────────────────────────────────
function onPointerDown(e: PointerEvent) {
  if (props.readonly) return
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  const pos = getPos(e)

  if (currentTool.value === 'text') {
    const text = prompt('Texte à ajouter :')
    if (!text) return
    strokes.value.push({ tool: 'text', color: currentColor.value, size: currentSize.value, opacity: 1, points: [], text, x: pos.x, y: pos.y })
    renderOwn()
    saveDebounced()
    return
  }

  if (currentTool.value === 'eraser') {
    isDrawing.value = true
    eraseAt(pos)
    return
  }

  activeStroke.value = { tool: currentTool.value, color: currentColor.value, size: currentSize.value, opacity: 1, points: [pos] }
  isDrawing.value = true
}

function onPointerMove(e: PointerEvent) {
  const pos = getPos(e)

  if (currentTool.value === 'eraser') {
    eraserPreview.value = pos
    if (isDrawing.value) eraseAt(pos)
    else renderOwn(true)  // show hover circle only
    return
  }

  if (!isDrawing.value || !activeStroke.value) return
  activeStroke.value.points.push(pos)

  // Live incremental draw (avoid full re-render on every point)
  const ctx = ownCanvas.value?.getContext('2d')
  const pts = activeStroke.value.points
  if (ctx && pts.length >= 2) {
    ctx.save()
    ctx.strokeStyle = activeStroke.value.color
    ctx.lineWidth   = activeStroke.value.tool === 'highlighter' ? activeStroke.value.size * 5 : activeStroke.value.size
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.globalAlpha = activeStroke.value.tool === 'highlighter' ? 0.35 : 1
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2]!.x, pts[pts.length - 2]!.y)
    ctx.lineTo(pts[pts.length - 1]!.x, pts[pts.length - 1]!.y)
    ctx.stroke()
    ctx.restore()
  }
}

function onPointerUp(e: PointerEvent) {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (activeStroke.value && activeStroke.value.points.length > 0) {
    strokes.value.push({ ...activeStroke.value })
    activeStroke.value = null
    renderOwn()
    saveDebounced()
  }
}

function onPointerLeave(e: PointerEvent) {
  onPointerUp(e)
  eraserPreview.value = null
  if (currentTool.value === 'eraser') renderOwn(false)
}

function eraseAt(pos: Point) {
  const before = strokes.value.length
  strokes.value = strokes.value.filter(s => !strokeHitsEraser(s, pos, eraserRadius.value))
  if (strokes.value.length !== before) {
    renderOwn(true)
    saveDebounced()
  } else {
    renderOwn(true)  // still redraw for eraser circle preview
  }
}

// ── Persistence ────────────────────────────────────────────────────────────
async function loadDrawings() {
  try {
    const all = await api.getArrangementDrawings(props.arrangementId)
    allDrawings.value = all

    const own = all.find((d: any) => d.member_id === ownMemberId.value)
    if (own) {
      strokes.value = typeof own.paths === 'string' ? JSON.parse(own.paths) : (own.paths ?? [])
      isShared.value = !!own.is_shared
    } else {
      strokes.value = []
      isShared.value = false
    }

    // Auto-show shared drawings
    const newVisible = new Set<number>()
    for (const d of all) {
      if (d.member_id !== ownMemberId.value && d.is_shared) newVisible.add(d.member_id)
    }
    visibleMemberIds.value = newVisible

    await nextTick()
    renderOwn()
    renderOthers()
  } catch (e: any) {
    console.error('Erreur chargement drawings', e)
  }
}

async function save() {
  try {
    await api.saveArrangementDrawing(props.arrangementId, {
      paths: JSON.stringify(strokes.value),
      is_shared: isShared.value,
    })
  } catch (e: any) {
    showToast(e.message || 'Erreur sauvegarde annotations', 'error')
  }
}

function saveDebounced() {
  clearTimeout(saveTimer.value)
  saveTimer.value = setTimeout(save, 1500)
}

function eraseAll() {
  if (!confirm('Effacer toutes vos annotations sur ce chant ?')) return
  strokes.value = []
  renderOwn()
  save()
}

function toggleMember(memberId: number) {
  const set = new Set(visibleMemberIds.value)
  if (set.has(memberId)) set.delete(memberId)
  else set.add(memberId)
  visibleMemberIds.value = set
  nextTick(renderOthers)
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(() => nextTick(() => { renderOwn(); renderOthers() }))
  if (containerRef.value) ro.observe(containerRef.value)
})
onUnmounted(() => {
  ro?.disconnect()
  clearTimeout(saveTimer.value)
})

watch(() => props.arrangementId, () => loadDrawings(), { immediate: true })
watch(visibleMemberIds, renderOthers, { deep: true })
</script>

<style scoped>
.ms-canvas-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
}
.ms-canvas-wrap.is-active { pointer-events: auto; }

.ms-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ms-canvas.own   { z-index: 2; }
.ms-canvas.other { z-index: 1; opacity: 0.65; }

/* Toolbar */
.canvas-toolbar {
  position: fixed;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 40, 0.96);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(12px);
  z-index: 300;
  flex-wrap: wrap;
  max-width: 90vw;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sep {
  width: 1px;
  height: 22px;
  background: rgba(255,255,255,0.15);
  margin: 0 2px;
}

.tool-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.tool-btn:hover  { background: rgba(255,255,255,0.1); color: white; }
.tool-btn.active { background: rgba(99,102,241,0.3);  color: #a5b4fc; }
.tool-btn.danger:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}
.color-dot.active { border-color: white; transform: scale(1.2); }

.size-slider {
  width: 60px;
  accent-color: #6366f1;
}
.size-label {
  font-size: 11px;
  color: #9ca3af;
  min-width: 28px;
}

.share-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  color: #9ca3af;
}
.share-label input { display: none; }

.selector-wrap { position: relative; }
.selector-popup {
  position: absolute;
  bottom: 44px;
  right: 0;
  background: rgba(20,20,40,0.98);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 6px 0;
  min-width: 180px;
  z-index: 400;
}
.selector-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #d1d5db;
}
.selector-item:hover   { background: rgba(255,255,255,0.07); }
.selector-item.checked { color: #a5b4fc; }
.check { font-size: 12px; width: 14px; }
.private-badge {
  margin-left: auto;
  font-size: 10px;
  color: #6b7280;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  padding: 1px 5px;
}
</style>

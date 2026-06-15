<template>
    <div
        class="music-stand"
        :class="{ 'stage-mode': stageMode }"
        @click="toggleToolbar"
        @keydown="onKeydown"
        tabindex="0"
    >
        <!-- Toolbar (toggles on tap) -->
        <MusicStandToolbar
            v-if="showToolbar"
            :songTitle="song?.title ?? ''"
            :arrangement="arrangement"
            :currentKey="currentKey"
            :prevSongId="prevSongId"
            :nextSongId="nextSongId"
            :setlistSongs="setlistSongs"
            :showSetlist="showSetlist"
            :metronomePlaying="metronomePlaying"
            :autoScrollActive="autoScrollActive"
            :stageMode="stageMode"
            :showNotes="showNotes"
            :canvasActive="canvasActive"
            @back="goBack"
            @open-song-browser="openSongBrowser"
            @toggle-key-picker="showKeyPicker = !showKeyPicker"
            @go-prev="goToPrev"
            @go-next="goToNext"
            @transpose="transpose"
            @toggle-setlist="showSetlist = !showSetlist"
            @toggle-metronome="toggleMetronome"
            @toggle-auto-scroll="toggleAutoScroll"
            @toggle-stage-mode="toggleStageMode"
            @toggle-notes="showNotes = !showNotes"
            @toggle-canvas="canvasActive = !canvasActive"
            @toggle-settings="showSettings = !showSettings"
        />

        <!-- Song Browser -->
        <MusicStandSongBrowser
            :visible="showSongBrowser"
            :songs="songs"
            :currentSongId="currentSongId"
            @select-song="selectSong"
            @close="showSongBrowser = false"
        />

        <!-- Setlist Sidebar (refacto component) -->
        <MusicStandSetlist
            :visible="showSetlist"
            :planItems="planItems"
            :currentSongId="currentSongId"
            :title="$t('setlist.back_to_plan')"
            :emptyLabel="$t('setlist.empty')"
            @close="showSetlist = false"
            @select-item="selectPlanItem"
        />

        <!-- Key picker dropdown -->
        <div v-if="showKeyPicker" class="key-picker" @click.stop>
            <button
                v-for="k in keyOptions"
                :key="k"
                @click="setKey(k)"
                class="key-option"
                :class="{ active: k === currentKey }"
            >
                {{ k }}
            </button>
        </div>

        <!-- Metronome -->
        <MusicStandMetronome
            :visible="metronomeVisible"
            :playing="metronomePlaying"
            :bpm="bpm"
            :meter="meter"
            :editBpm="editBpm"
            :autoScrollActive="autoScrollActive"
            :currentBeat="currentBeat"
            @close="
                () => {
                    metronomeVisible = false;
                    metronomePlaying = false;
                }
            "
            @toggle-play="metronomePlaying = !metronomePlaying"
            @toggle-edit-bpm="editBpm = !editBpm"
            @change-meter="(val) => (meter = val)"
            @toggle-auto-scroll="toggleAutoScroll()"
            @bpm-change="
                (val) => {
                    if (val >= 30 && val <= 300) bpm = val;
                }
            "
        />

        <!-- Settings panel -->
        <MusicStandSettings
            :visible="showSettings"
            :showChords="showChords"
            :showLyrics="showLyrics"
            :showSections="showSections"
            :fontSize="fontSize"
            @update:showChords="(v: boolean) => showChords = v"
            @update:showLyrics="(v: boolean) => showLyrics = v"
            @update:showSections="(v: boolean) => showSections = v"
            @update:fontSize="(v: number) => fontSize = v"
            @close="showSettings = false"
        />

        <!-- Chart Viewer Component (refacto) -->
        <div style="position: relative">
            <MusicStandChartViewer :lines="parsedLines" :font-size="fontSize" />
            <MusicStandCanvas
                v-if="arrangement"
                :arrangement-id="arrangement.id"
                :active="canvasActive"
            />
        </div>

        <!-- No chart state -->
        <div
            v-if="!loading && song && arrangement && !arrangement.chord_chart"
            class="no-chart"
            style="color: #6b7280; font-size: 14px"
        >
            <div style="font-size: 32px; margin-bottom: 8px">🎵</div>
            <div>{{ song.title }}</div>
            <div style="margin-top: 4px; font-size: 12px">
                Aucune grille disponible pour cet arrangement
            </div>
        </div>

        <div
            v-if="!loading && !song"
            class="no-chart"
            style="color: #6b7280; font-size: 14px"
        >
            Chant introuvable
        </div>

        <!-- Notes / Annotations Panel -->
        <MusicStandNotes
            :visible="showNotes && !!arrangement"
            :arrangementId="arrangement?.id ?? null"
            :currentMemberId="currentMemberId"
            @close="showNotes = false"
        />

        <!-- Bottom song nav -->
        <div
            v-if="prevSongId || nextSongId"
            class="song-nav-bottom"
            @click.stop
        >
            <button v-if="prevSongId" @click="goToPrev" class="song-nav-btn">
                ← {{ prevSongTitle }}
            </button>
            <div v-else></div>
            <button v-if="nextSongId" @click="goToNext" class="song-nav-btn">
                {{ nextSongTitle }} →
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import MusicStandMetronome from "../components/musicstand/MusicStandMetronome.vue";
import MusicStandSetlist from "../components/musicstand/MusicStandSetlist.vue";
import MusicStandChartViewer from "../components/musicstand/MusicStandChartViewer.vue";
import MusicStandCanvas from "../components/musicstand/MusicStandCanvas.vue";
import MusicStandToolbar from "../components/musicstand/MusicStandToolbar.vue";
import MusicStandSongBrowser from "../components/musicstand/MusicStandSongBrowser.vue";
import MusicStandSettings from "../components/musicstand/MusicStandSettings.vue";
import MusicStandNotes from "../components/musicstand/MusicStandNotes.vue";
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../utils/api";
import { showToast } from "../stores/toast";
import { member as currentMemberRef } from "../stores/member";
import { useTransposition } from "../composables/useTransposition";
import { useChordParser } from "../composables/useChordParser";
import { useMetronome } from "../composables/useMetronome";
import { useAutoScroll } from "../composables/useAutoScroll";

const route = useRoute();
const router = useRouter();
const currentMemberId = computed(() => {
  const id = currentMemberRef.value?.id;
  return typeof id === 'number' ? id : null;
});

const song = ref<any>(null);
const arrangement = ref<any>(null);
const loading = ref(true);
const showToolbar = ref(true);
const showKeyPicker = ref(false);
const showSettings = ref(false);
const showChords = ref(true);
const showLyrics = ref(true);
const showSections = ref(true);
const fontSize = ref(22);
const stageMode = ref(false);
const { currentKey, semitones, originalKey, transpose, transposeChord, keyOptions } = useTransposition()

const showSongBrowser = ref(false);

const planId = ref<number | null>(null);
const planItems = ref<any[]>([]);
const showSetlist = ref(false);

const showNotes = ref(false);
const canvasActive = ref(false);

const songs = ref<any[]>([]);

const { metronomeVisible, metronomePlaying, bpm, meter, currentBeat, editBpm, toggleMetronome } = useMetronome()
const { autoScrollActive, currentScrollLine, chartContainer, startAutoScroll, stopAutoScroll, toggleAutoScroll } = useAutoScroll(bpm, metronomePlaying)

// Song browser / setlist navigation
const currentSongId = ref<number | null>(null);
const setlistSongs = ref<any[]>([]);

const prevSongId = computed(() => {
    if (!currentSongId.value) return null;
    const idx = setlistSongs.value.findIndex(
        (s) => s.id === currentSongId.value,
    );
    return idx > 0 ? setlistSongs.value[idx - 1].id : null;
});

const nextSongId = computed(() => {
    if (!currentSongId.value) return null;
    const idx = setlistSongs.value.findIndex(
        (s) => s.id === currentSongId.value,
    );
    return idx < setlistSongs.value.length - 1
        ? setlistSongs.value[idx + 1].id
        : null;
});

const prevSongTitle = computed(() => {
    if (!prevSongId.value) return "";
    const s = setlistSongs.value.find((s) => s.id === prevSongId.value);
    return s?.title?.slice(0, 20) || "";
});

const nextSongTitle = computed(() => {
    if (!nextSongId.value) return "";
    const s = setlistSongs.value.find((s) => s.id === nextSongId.value);
    return s?.title?.slice(0, 20) || "";
});

function openSongBrowser() {
    showSongBrowser.value = true;
}

function selectSong(s: any) {
    showSongBrowser.value = false;
    currentPage.value = 0;
    router.replace({
        params: {
            songId: String(s.id),
            // arrangements[] absent du endpoint list — arrangementId resolved by loadSongData
            arrangementId: String(s.arrangements?.[0]?.id || ""),
        },
        query: route.query,
    });
}

function goToPrev() {
    if (prevSongId.value) {
        const s = setlistSongs.value.find((s) => s.id === prevSongId.value);
        if (s) selectSong(s);
    }
}

function goToNext() {
    if (nextSongId.value) {
        const s = setlistSongs.value.find((s) => s.id === nextSongId.value);
        if (s) selectSong(s);
    }
}

function selectPlanItem(item: any) {
    if (item.type !== "song" || !item.arrangement_id) return;
    showSetlist.value = false;
    currentPage.value = 0;
    router.replace({
        params: {
            songId: String(item.song_id),
            arrangementId: String(item.arrangement_id),
        },
        query: route.query,
    });
}

async function loadSetlist() {
    planId.value = parseInt(route.query.plan as string, 10);
    if (!planId.value) return;
    try {
        const items = await api.getPlanItems(planId.value);
        planItems.value = items;
        const songs = items
            .filter((i: any) => i.type === "song" && i.arrangement_id)
            .map((i: any) => ({
                id: i.song_id,
                title: i.song_title || i.title,
                arrangements: [
                    {
                        id: i.arrangement_id,
                        key: i.arrangement_key || i.transposed_key || "C",
                        tempo: i.tempo || 120,
                        chord_chart: null,
                    },
                ],
            }));
        setlistSongs.value = songs;
    } catch (e: any) {
        showToast(e.message || "Erreur chargement plan", "error");
        planItems.value = [];
        setlistSongs.value = [];
    }
}



const chordChart = computed(() => arrangement.value?.chord_chart ?? null)
const { parsedLines } = useChordParser(chordChart, semitones, showChords, showLyrics, showSections)

// Pagination (split into pages by line count)
const currentPage = ref(0);
// Scroll par page : avance / recule d'une hauteur d'écran dans le chart
function nextPage() {
    const container = document.querySelector(
        ".chart-container",
    ) as HTMLElement | null;
    if (container)
        container.scrollBy({
            top: container.clientHeight * 0.85,
            behavior: "smooth",
        });
}
function prevPage() {
    const container = document.querySelector(
        ".chart-container",
    ) as HTMLElement | null;
    if (container)
        container.scrollBy({
            top: -container.clientHeight * 0.85,
            behavior: "smooth",
        });
}

function setKey(k: string) {
    const origIdx = keyOptions.indexOf(originalKey.value)
    const targetIdx = keyOptions.indexOf(k)
    if (origIdx !== -1 && targetIdx !== -1) {
        semitones.value = (targetIdx - origIdx + 12) % 12
    }
    showKeyPicker.value = false
}



function toggleToolbar() {
    showToolbar.value = !showToolbar.value;
    if (!showToolbar.value) {
        showKeyPicker.value = false;
        showSettings.value = false;
    }
}

function toggleStageMode() {
    stageMode.value = !stageMode.value;
    document.documentElement.classList.toggle("dark", stageMode.value);
}



watch(metronomePlaying, (playing) => {
    if (playing) {
        if (autoScrollActive.value) startAutoScroll()
    } else {
        stopAutoScroll()
    }
})

watch(bpm, () => {
    if (metronomePlaying.value && autoScrollActive.value) {
        startAutoScroll()
    }
})

// Navigation
function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === " ") {
        nextPage();
        e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
        prevPage();
        e.preventDefault();
    }
    if (e.key === "Escape") {
        toggleToolbar();
    }
    if (e.key === "ArrowUp") {
        transpose(1);
        e.preventDefault();
    }
    if (e.key === "ArrowDown") {
        transpose(-1);
        e.preventDefault();
    }
}

function goBack() {
    router.back();
}

async function loadSongData(songId: number, arrId: number | null) {
    song.value = null;
    arrangement.value = null;
    currentSongId.value = songId;

    if (!songId) return;
    try {
        song.value = await api.getSong(songId);
        if (!song.value) return;

        if (arrId) {
            arrangement.value = song.value.arrangements?.find(
                (a: any) => a.id === arrId,
            );
        } else {
            // Find arrangement with non-empty chord_chart, or fallback to first arrangement
            arrangement.value =
                song.value.arrangements?.find(
                    (a: any) =>
                        a.chord_chart && a.chord_chart.trim().length > 0,
                ) || song.value.arrangements?.[0];
        }
        if (arrangement.value?.key) {
            originalKey.value = arrangement.value.key;
            semitones.value = 0;
        }
        if (arrangement.value?.tempo) {
            bpm.value = arrangement.value.tempo;
        }
        // Apply shareable URL query params (?key=X&bpm=Y)
        const targetKey = route.query.key as string;
        if (targetKey && arrangement.value?.key) {
            const origIdx = keyOptions.indexOf(arrangement.value.key);
            const targetIdx = keyOptions.indexOf(targetKey);
            if (origIdx !== -1 && targetIdx !== -1) {
                semitones.value = (targetIdx - origIdx + 12) % 12;
            }
        }
        const targetBpm = parseInt(route.query.bpm as string, 10);
        if (targetBpm && targetBpm >= 30 && targetBpm <= 300) {
            bpm.value = targetBpm;
        }
    } catch (e: any) {
        showToast(e.message || "Erreur", "error");
    }
}

// Load song data
onMounted(async () => {
    loading.value = true;
    try {
        const songId = parseInt(route.params.songId as string, 10);
        const arrId = route.params.arrangementId
            ? parseInt(route.params.arrangementId as string, 10)
            : null;

        // Load setlist from plan if ?plan= query param
        await loadSetlist();

        // Load browser songs for Song Browser
        // NOTE: GET /api/songs returns arrangement_count + has_chord_chart (1/0)
        // Only show songs that have at least one arrangement WITH a chord chart
        try {
            const all = await api.getSongs();
            songs.value = ((all?.data ?? all) || []).filter(
                (s: any) =>
                    s.has_chord_chart === 1 || s.has_chord_chart === true,
            );
        } catch (e) {
            console.error("Erreur chargement songs pour Song Browser", e);
            songs.value = [];
        }
        await loadSongData(songId, arrId);
    } catch (e) {
        showToast(
            e instanceof Error ? e.message : "Erreur chargement",
            "error",
        );
    } finally {
        loading.value = false;
    }
});

// Reload song data when navigating between songs (route params change)
watch(
    () => [route.params.songId, route.params.arrangementId],
    async ([newSongId, newArrId]) => {
        if (newSongId) {
            loading.value = true;
            const sid = parseInt(newSongId as string, 10);
            const aid = newArrId ? parseInt(newArrId as string, 10) : null;
            await loadSongData(sid, aid);
            loading.value = false;
        }
    },
);

</script>

<style scoped>
.music-stand {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: #1a1a2e;
    color: #e0e0e0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    font-family: "Courier New", monospace;
    user-select: none;
    -webkit-user-select: none;
}

.music-stand.stage-mode {
    background: #000;
    color: #fff;
}

.key-picker {
    position: fixed;
    top: 56px;
    left: 50%;
    transform: translateX(-50%);
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    padding: 12px;
    background: rgba(30, 30, 50, 0.98);
    border-radius: 12px;
    z-index: 101;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.key-option {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e0e0e0;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
}

.key-option:hover {
    background: rgba(99, 102, 241, 0.3);
}

.key-option.active {
    background: #6366f1;
    color: white;
    border-color: #6366f1;
}

.chart-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.no-chart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.page-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px;
    background: rgba(30, 30, 50, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-arrow {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #e0e0e0;
    font-size: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.nav-arrow:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
}

.page-num {
    color: #a0a0b0;
    font-size: 14px;
    min-width: 60px;
    text-align: center;
}

.metronome {
    position: fixed;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(30, 30, 50, 0.98);
    border-radius: 16px;
    padding: 16px 24px;
    z-index: 99;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.3);
}

.metronome-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.metro-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #e0e0e0;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    flex-shrink: 0;
}

.metro-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.bpm-display {
    font-size: 20px;
    font-weight: bold;
    color: #6366f1;
    cursor: pointer;
    min-width: 80px;
    text-align: center;
}

.bpm-input {
    width: 60px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 18px;
    text-align: center;
}

.beat-indicators {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.beat-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.1s;
}

.beat-dot.active {
    background: #6366f1;
    box-shadow: 0 0 12px #6366f1;
    transform: scale(1.3);
}

/* Bottom song nav bar */
.song-nav-bottom {
    position: fixed;
    bottom: 70px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    background: rgba(30, 30, 50, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 98;
}

.song-nav-btn {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.song-nav-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    color: white;
}

/* Auto-scroll toggle in metronome */
.auto-scroll-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #a0a0b0;
    cursor: pointer;
    white-space: nowrap;
}

/* Setlist Sidebar */
.setlist-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 200;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
}

.setlist-panel {
    width: 100%;
    max-width: 380px;
    height: 100%;
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.setlist-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.setlist-title-heading {
    font-size: 16px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0;
}

.setlist-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.setlist-close:hover {
    background: rgba(255, 255, 255, 0.2);
}

.setlist-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.setlist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 2px;
}

.setlist-item:hover {
    background: rgba(99, 102, 241, 0.15);
}

.setlist-item.current {
    background: rgba(99, 102, 241, 0.25);
    border: 1px solid rgba(99, 102, 241, 0.3);
}

.setlist-item.non-song {
    cursor: default;
    opacity: 0.6;
}

.setlist-item.non-song:hover {
    background: transparent;
}

.setlist-num {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    font-size: 11px;
    color: #a0a0b0;
    flex-shrink: 0;
}

.setlist-item.current .setlist-num {
    background: #6366f1;
    color: white;
}

.setlist-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.setlist-title {
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.setlist-detail {
    font-size: 11px;
    color: #818cf8;
    margin-top: 2px;
}

.setlist-type {
    font-size: 12px;
    color: #a0a0b0;
    font-style: italic;
}

.setlist-play {
    color: #818cf8;
    font-size: 12px;
    flex-shrink: 0;
}

.setlist-empty {
    text-align: center;
    color: #6b7280;
    padding: 24px;
    font-size: 14px;
}

@media (max-width: 768px) {
    .chart-container {
        padding: 60px 12px 70px;
    }
    .key-picker {
        grid-template-columns: repeat(4, 1fr);
        left: 12px;
        right: 12px;
        transform: none;
    }
    .song-nav-bottom {
        bottom: 80px;
    }
    .setlist-panel {
        max-width: 100%;
    }
}


</style>

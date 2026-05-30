<template>
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
        style="display: none"
    />
    <div
        class="music-stand"
        :class="{ 'stage-mode': stageMode }"
        @click="toggleToolbar"
        @keydown="onKeydown"
        tabindex="0"
    >
        <!-- Toolbar (toggles on tap) -->
        <div v-if="showToolbar" class="toolbar" @click.stop>
            <button
                @click="goBack"
                class="toolbar-btn"
                :title="$t('musicStand.back')"
            >
                ←
            </button>

            <div class="toolbar-center">
                <span class="song-title" @click="openSongBrowser">{{
                    song?.title
                }}</span>
                <span
                    v-if="arrangement"
                    class="key-badge"
                    @click.stop="showKeyPicker = !showKeyPicker"
                    >{{ currentKey }}</span
                >
            </div>

            <div class="toolbar-right">
                <button
                    v-if="prevSongId"
                    @click.stop="goToPrev"
                    class="toolbar-btn"
                    title="Chant précédent"
                >
                    ⏮
                </button>
                <button
                    v-if="nextSongId"
                    @click.stop="goToNext"
                    class="toolbar-btn"
                    title="Chant suivant"
                >
                    ⏭
                </button>
                <button
                    @click.stop="transpose(-1)"
                    class="toolbar-btn sm:px-1 sm:text-sm"
                    title="-1 demi-ton"
                >
                    −
                </button>
                <button
                    @click.stop="transpose(1)"
                    class="toolbar-btn sm:px-1 sm:text-sm"
                    title="+1 demi-ton"
                >
                    +
                </button>
                <button
                    v-if="setlistSongs.length > 0"
                    @click.stop="showSetlist = !showSetlist"
                    class="toolbar-btn"
                    :class="{ active: showSetlist }"
                    :title="$t('setlist.back_to_plan')"
                >
                    ☰
                </button>
                <button
                    @click.stop="toggleMetronome"
                    class="toolbar-btn"
                    :class="{ active: metronomePlaying }"
                    title="Métronome"
                >
                    ♩
                </button>
                <button
                    @click.stop="toggleAutoScroll"
                    class="toolbar-btn"
                    :class="{ active: autoScrollActive }"
                    :title="
                        autoScrollActive ? 'Auto-scroll ON' : 'Auto-scroll OFF'
                    "
                >
                    ⟳
                </button>
                <button
                    @click.stop="toggleStageMode"
                    class="toolbar-btn"
                    :class="{ active: stageMode }"
                    title="Mode scène"
                >
                    🌙
                </button>
                <button
                    @click.stop="showSettings = !showSettings"
                    class="toolbar-btn"
                    :title="$t('pdfExport.title')"
                >
                    ⚙
                </button>
            </div>
        </div>

        <!-- Song Browser -->
        <div
            v-if="showSongBrowser"
            class="song-browser-overlay"
            @click="showSongBrowser = false"
        >
            <div class="song-browser" @click.stop>
                <div class="browser-header">
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="$t('musicStand.search')"
                        class="browser-search"
                        autofocus
                    />
                    <button
                        @click="showSongBrowser = false"
                        class="browser-close"
                    >
                        ✕
                    </button>
                </div>
                <div class="browser-list">
                    <div
                        v-for="s in filteredSongs"
                        :key="s.id"
                        class="browser-song"
                        :class="{ active: s.id === currentSongId }"
                        @click="selectSong(s)"
                    >
                        <span class="browser-song-title">{{ s.title }}</span>
                        <span class="browser-song-arr"
                            >{{ s.arrangements[0]?.key || "" }} ·
                            {{ s.arrangements[0]?.tempo || "" }} BPM</span
                        >
                    </div>
                    <div
                        v-if="filteredSongs.length === 0"
                        class="browser-empty"
                    >
                        {{ $t("musicStand.no_songs") }}
                    </div>
                </div>
            </div>
        </div>

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
        <div v-if="showSettings" class="settings-panel" @click.stop>
            <h4 class="text-sm font-bold mb-2 text-gray-300">
                {{ $t("pdfExport.title") }}
            </h4>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <input type="checkbox" v-model="showChords" class="rounded" />
                Accords
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <input type="checkbox" v-model="showLyrics" class="rounded" />
                Paroles
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <input type="checkbox" v-model="showSections" class="rounded" />
                Sections
            </label>
            <div class="text-sm text-gray-300 mb-2">
                <span>Taille du texte</span>
                <input
                    type="range"
                    v-model.number="fontSize"
                    min="14"
                    max="48"
                    class="w-full mt-1"
                />
                <span>{{ fontSize }}px</span>
            </div>
        </div>

        <!-- Chart Viewer Component (refacto) -->
        <MusicStandChartViewer :lines="parsedLines" />

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
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../utils/api";
import { showToast } from "../stores/toast";

const route = useRoute();
const router = useRouter();

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
const currentKey = ref("C");
const semitones = ref(0);

const showSongBrowser = ref(false);
const searchQuery = ref("");

const planId = ref<number | null>(null);
const planItems = ref<any[]>([]);
const showSetlist = ref(false);

const songs = ref<any[]>([]);
const filteredSongs = computed(() => {
    if (!searchQuery.value) return songs.value;

    const q = searchQuery.value.toLowerCase();
    return songs.value.filter((s) => s.title.toLowerCase().includes(q));
});

// Metronome
const metronomeVisible = ref(false);
const metronomePlaying = ref(false);
const bpm = ref(120);
const meter = ref(4);
const currentBeat = ref(0);
const editBpm = ref(false);
let metroInterval: any = null;

// Auto-scroll
const autoScrollActive = ref(false);
const autoScrollInterval = ref<any>(null);
const chartContainer = ref<HTMLElement | null>(null);
const currentScrollLine = ref(0);

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
    searchQuery.value = "";
}

function selectSong(s: any) {
    showSongBrowser.value = false;
    currentPage.value = 0;
    router.replace({
        params: {
            songId: String(s.id),
            arrangementId: String(s.arrangements[0]?.id || ""),
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

function toggleAutoScroll() {
    autoScrollActive.value = !autoScrollActive.value;
    if (autoScrollActive.value && metronomePlaying.value) {
        startAutoScroll();
    } else {
        stopAutoScroll();
    }
}

function startAutoScroll() {
    stopAutoScroll();
    if (!bpm.value) return;
    const intervalMs = (60 / bpm.value) * 1000;
    const linesPerTick = 1;
    autoScrollInterval.value = setInterval(() => {
        const container = chartContainer.value;
        if (!container) return;
        const lineHeight = parseInt(getComputedStyle(container).fontSize) * 1.6;
        const scrollBy = lineHeight * linesPerTick;
        container.scrollBy({ top: scrollBy, behavior: "smooth" });
    }, intervalMs);
}

function stopAutoScroll() {
    if (autoScrollInterval.value) {
        clearInterval(autoScrollInterval.value);
        autoScrollInterval.value = null;
    }
}

const keyOptions = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];

import type { ParsedLine } from "../types/ParsedLine";

// Détecte si une ligne ne contient que des accords (format 2 lignes ChordPro)
const CHORD_TOKEN_RE =
    /^[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(\/[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?$/;
const CHORD_INLINE_RE =
    /([A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(?:\/[A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?)/g;

function isChordOnlyLine(line: string): boolean {
    if (!line.trim()) return false;
    const tokens = line.trim().split(/\s+/);
    if (tokens.length === 0) return false;
    return tokens.every((t) => CHORD_TOKEN_RE.test(t));
}

function buildTwoLineParts(
    chordLine: string,
    lyricLine: string,
): { chord: string; lyric: string }[] {
    const chords: { chord: string; pos: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = CHORD_INLINE_RE.exec(chordLine)) !== null) {
        chords.push({
            chord: showChords.value ? transposeChord(m[0]) : "",
            pos: m.index,
        });
    }
    if (chords.length === 0) {
        return [
            {
                chord: "",
                lyric: showLyrics.value ? transposeText(lyricLine) : "",
            },
        ];
    }
    const parts: { chord: string; lyric: string }[] = [];
    for (let i = 0; i < chords.length; i++) {
        const { chord, pos } = chords[i]!;
        const nextPos =
            i < chords.length - 1
                ? chords[i + 1]!.pos
                : Math.max(chordLine.length, lyricLine.length);
        const lyric = lyricLine.slice(pos, nextPos).trim();
        parts.push({
            chord,
            lyric: showLyrics.value ? transposeText(lyric) : "",
        });
    }
    return parts;
}

const parsedLines = computed<ParsedLine[]>(() => {
    if (!arrangement.value?.chord_chart) return [];
    const chart = arrangement.value.chord_chart;
    const lines = chart.split("\n");
    const result: ParsedLine[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        i++;
        if (!trimmed) continue;

        // Section header: {section: Verse} or {chorus}, {verse}, etc.
        const sectionMatch = trimmed.match(/^\{([^}]+)\}/);
        if (sectionMatch && showSections.value) {
            let label = sectionMatch[1].replace(/\s{2,}/g, " ").trim();
            result.push({ type: "section", label });
            continue;
        }

        // Comment/directive: skip or show as plain
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            if (showSections.value) {
                let label = trimmed
                    .slice(1, -1)
                    .replace(/\s{2,}/g, " ")
                    .trim();
                result.push({ type: "section", label });
            }
            continue;
        }

        // ChordPro line with chords: text[Chord]text
        if (/\[.*?\]/.test(trimmed)) {
            if (!showChords.value && !showLyrics.value) {
                continue;
            }
            const parts: { chord: string; lyric: string }[] = [];
            let remaining = trimmed;
            while (remaining.length > 0) {
                const chordIdx = remaining.indexOf("[");
                const closeIdx =
                    chordIdx !== -1 ? remaining.indexOf("]", chordIdx) : -1;

                if (chordIdx === -1 || closeIdx === -1) {
                    if (remaining) {
                        parts.push({
                            chord: "",
                            lyric: showLyrics.value
                                ? transposeText(remaining)
                                : "",
                        });
                    }
                    break;
                }

                if (chordIdx > 0) {
                    const lyric = remaining.slice(0, chordIdx);
                    if (lyric)
                        parts.push({
                            chord: "",
                            lyric: showLyrics.value ? transposeText(lyric) : "",
                        });
                }
                const chord = remaining.slice(chordIdx + 1, closeIdx);
                const transposedChord = transposeChord(chord);
                let afterChord = remaining.slice(closeIdx + 1);
                let nextChordIdx = afterChord.indexOf("[");
                let lyric =
                    nextChordIdx === -1
                        ? afterChord
                        : afterChord.slice(0, nextChordIdx);
                parts.push({
                    chord: showChords.value ? transposedChord : "",
                    lyric: showLyrics.value ? transposeText(lyric) : "",
                });
                remaining =
                    nextChordIdx === -1 ? "" : afterChord.slice(nextChordIdx);
            }
            if (parts.length > 0) {
                let MAX_PARTS = 100;
                result.push({
                    type: "chord-lyric",
                    parts: parts.slice(0, MAX_PARTS),
                });
            }
            continue;
        }

        // Two-line ChordPro: chord-only line followed by lyrics
        if (isChordOnlyLine(trimmed)) {
            if (!showChords.value && !showLyrics.value) continue;
            // Cherche la prochaine ligne non-vide qui n'est pas un en-tête / directive
            let lyricLine = "";
            let skipIdx = -1;
            for (let j = i; j < lines.length; j++) {
                const l = lines[j].trim();
                if (!l) continue;
                if (
                    /^\{/.test(l) ||
                    (l.startsWith("[") && l.endsWith("]")) ||
                    isChordOnlyLine(l)
                )
                    break;
                lyricLine = l;
                skipIdx = j;
                break;
            }
            if (lyricLine) {
                const parts = buildTwoLineParts(line, lyricLine);
                if (parts.length > 0)
                    result.push({ type: "chord-lyric", parts });
                i = skipIdx + 1;
            } else {
                result.push({ type: "plain", text: trimmed });
            }
            continue;
        }

        // Plain text (lyrics only)
        result.push({ type: "plain", text: trimmed });
    }

    return result;
});

// Pagination (split into pages by line count)
const currentPage = ref(0);
// Pagination and slicing handled by ChartViewer now
function nextPage() {}
function prevPage() {}
// TODO: implement nextPage/prevPage if pagination is re-added elsewhere

function transposeChord(chord: string): string {
    if (semitones.value === 0) return chord;
    const rootMatch = chord.match(/^([A-G][#b]?)(.*)/);
    if (!rootMatch || !rootMatch[1]) return chord;
    const root = rootMatch[1];
    const suffix = rootMatch[2] || "";
    const idx = keyOptions.indexOf(root);
    if (idx === -1) return chord;
    const newIdx = (idx + semitones.value + 12) % 12;
    return keyOptions[newIdx] + suffix;
}

function transposeText(text: string): string {
    return text; // lyrics don't change
}

function transpose(delta: number) {
    semitones.value = (semitones.value + delta + 12) % 12;
    const origIdx = keyOptions.indexOf(arrangement.value?.key || "C");
    if (origIdx !== -1) {
        currentKey.value =
            keyOptions[(origIdx + semitones.value + 12) % 12] ||
            currentKey.value;
    } else {
        currentKey.value = (arrangement.value?.key || "C") as string;
    }
}

function setKey(k: string) {
    const origIdx = keyOptions.indexOf(arrangement.value?.key || "C");
    const targetIdx = keyOptions.indexOf(k);
    if (origIdx !== -1 && targetIdx !== -1) {
        semitones.value = (targetIdx - origIdx + 12) % 12;
    }
    currentKey.value = k;
    showKeyPicker.value = false;
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

// Metronome
function toggleMetronome() {
    if (metronomeVisible.value) {
        metronomeVisible.value = false;
        metronomePlaying.value = false;
        clearInterval(metroInterval);
    } else {
        metronomeVisible.value = true;
    }
}

watch(metronomePlaying, (playing) => {
    if (playing) {
        const intervalMs = 60000 / bpm.value;
        let beat = 0;
        metroInterval = setInterval(() => {
            currentBeat.value = beat % meter.value;
            beat++;
        }, intervalMs);
        if (autoScrollActive.value) startAutoScroll();
    } else {
        clearInterval(metroInterval);
        currentBeat.value = 0;
        stopAutoScroll();
    }
});

watch(bpm, () => {
    if (metronomePlaying.value) {
        metronomePlaying.value = false;
        metronomePlaying.value = true;
    }
});

// Navigation
// Pagination now handled by ChartViewer
// function prevPage() { ... }
// function nextPage() { ... }

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
            currentKey.value = arrangement.value.key;
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
                currentKey.value = targetKey;
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

        // Load browser songs (all songs with charts) for Song Browser
        try {
            const all = await api.getSongs();
            songs.value = all.filter(
                (s: any) =>
                    s.arrangements &&
                    s.arrangements.some(
                        (a: any) =>
                            a.chord_chart && a.chord_chart.trim().length > 0,
                    ),
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

onUnmounted(() => {
    clearInterval(metroInterval);
    stopAutoScroll();
});
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
    overflow: hidden;
    font-family: "Courier New", monospace;
    user-select: none;
    -webkit-user-select: none;
}

.music-stand.stage-mode {
    background: #000;
    color: #fff;
}

.toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(30, 30, 50, 0.95);
    backdrop-filter: blur(10px);
    z-index: 100;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-center {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    justify-content: center;
}

.song-title {
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.key-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #6366f1;
    color: white;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
}

.key-badge:hover {
    background: #4f46e5;
}

.toolbar-btn {
    background: none;
    border: none;
    color: #a0a0b0;
    font-size: 20px;
    padding: 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.toolbar-btn.active {
    color: #6366f1;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
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

.chart-container {
    flex: 1;
    overflow-y: auto;
    padding: 70px 20px 80px;
    line-height: 1.6;
}

.chart-line {
    margin-bottom: 4px;
    white-space: pre-wrap;
}

.chart-line.section {
    margin-top: 16px;
    margin-bottom: 8px;
}

.section-label {
    display: inline-block;
    padding: 2px 10px;
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.chord-lyric-block {
    display: inline-block;
    vertical-align: top;
    text-align: center;
}

.chord {
    display: block;
    color: #f59e0b;
    font-weight: bold;
    font-size: 0.85em;
    line-height: 1.2;
    margin-bottom: -0.15em;
}

.lyric {
    display: block;
    color: #e0e0e0;
}

.plain-text {
    color: #a0a0b0;
    font-style: italic;
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

.settings-panel {
    position: fixed;
    top: 56px;
    right: 12px;
    background: rgba(30, 30, 50, 0.98);
    border-radius: 12px;
    padding: 16px;
    z-index: 101;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    min-width: 200px;
}

/* Song Browser Overlay */
.song-browser-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.song-browser {
    width: 100%;
    max-width: 500px;
    max-height: 70vh;
    background: #1a1a2e;
    border-radius: 16px 16px 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.browser-header {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.browser-search {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 14px;
}

.browser-search::placeholder {
    color: rgba(255, 255, 255, 0.4);
}

.browser-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}

.browser-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.browser-song {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.browser-song:hover {
    background: rgba(99, 102, 241, 0.2);
}

.browser-song.active {
    background: rgba(99, 102, 241, 0.3);
}

.browser-song-title {
    color: #e0e0e0;
    font-weight: 600;
    font-size: 14px;
}

.browser-song-arr {
    color: #818cf8;
    font-size: 12px;
    margin-top: 2px;
}

.browser-empty {
    text-align: center;
    color: #6b7280;
    padding: 24px;
    font-size: 14px;
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
    .song-browser {
        max-width: 100%;
    }
    .setlist-panel {
        max-width: 100%;
    }
}
</style>

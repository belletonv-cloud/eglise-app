import MusicStandMetronome from '../components/musicstand/MusicStandMetronome.vue';
import MusicStandSetlist from '../components/musicstand/MusicStandSetlist.vue';
import MusicStandChartViewer from '../components/musicstand/MusicStandChartViewer.vue';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../utils/api';
import { showToast } from '../stores/toast';
const route = useRoute();
const router = useRouter();
const song = ref(null);
const arrangement = ref(null);
const loading = ref(true);
const showToolbar = ref(true);
const showKeyPicker = ref(false);
const showSettings = ref(false);
const showChords = ref(true);
const showLyrics = ref(true);
const showSections = ref(true);
const fontSize = ref(22);
const stageMode = ref(false);
const currentKey = ref('C');
const semitones = ref(0);
const showSongBrowser = ref(false);
const searchQuery = ref('');
const planId = ref(null);
const planItems = ref([]);
const showSetlist = ref(false);
const songs = ref([]);
const filteredSongs = computed(() => {
    if (!searchQuery.value)
        return songs.value;
    const q = searchQuery.value.toLowerCase();
    return songs.value.filter(s => s.title.toLowerCase().includes(q));
});
// Metronome
const metronomeVisible = ref(false);
const metronomePlaying = ref(false);
const bpm = ref(120);
const meter = ref(4);
const currentBeat = ref(0);
const editBpm = ref(false);
let metroInterval = null;
// Auto-scroll
const autoScrollActive = ref(false);
const autoScrollInterval = ref(null);
const chartContainer = ref(null);
const currentScrollLine = ref(0);
// Song browser / setlist navigation
const currentSongId = ref(null);
const setlistSongs = ref([]);
const prevSongId = computed(() => {
    if (!currentSongId.value)
        return null;
    const idx = setlistSongs.value.findIndex(s => s.id === currentSongId.value);
    return idx > 0 ? setlistSongs.value[idx - 1].id : null;
});
const nextSongId = computed(() => {
    if (!currentSongId.value)
        return null;
    const idx = setlistSongs.value.findIndex(s => s.id === currentSongId.value);
    return idx < setlistSongs.value.length - 1 ? setlistSongs.value[idx + 1].id : null;
});
const prevSongTitle = computed(() => {
    if (!prevSongId.value)
        return '';
    const s = setlistSongs.value.find(s => s.id === prevSongId.value);
    return s?.title?.slice(0, 20) || '';
});
const nextSongTitle = computed(() => {
    if (!nextSongId.value)
        return '';
    const s = setlistSongs.value.find(s => s.id === nextSongId.value);
    return s?.title?.slice(0, 20) || '';
});
function openSongBrowser() {
    showSongBrowser.value = true;
    searchQuery.value = '';
}
function selectSong(s) {
    showSongBrowser.value = false;
    currentPage.value = 0;
    router.replace({
        params: { songId: String(s.id), arrangementId: String(s.arrangements[0]?.id || '') },
        query: route.query,
    });
}
function goToPrev() {
    if (prevSongId.value) {
        const s = setlistSongs.value.find(s => s.id === prevSongId.value);
        if (s)
            selectSong(s);
    }
}
function goToNext() {
    if (nextSongId.value) {
        const s = setlistSongs.value.find(s => s.id === nextSongId.value);
        if (s)
            selectSong(s);
    }
}
function selectPlanItem(item) {
    if (item.type !== 'song' || !item.arrangement_id)
        return;
    showSetlist.value = false;
    currentPage.value = 0;
    router.replace({
        params: { songId: String(item.song_id), arrangementId: String(item.arrangement_id) },
        query: route.query,
    });
}
async function loadSetlist() {
    planId.value = parseInt(route.query.plan, 10);
    if (!planId.value)
        return;
    try {
        const items = await api.getPlanItems(planId.value);
        planItems.value = items;
        const songs = items
            .filter((i) => i.type === 'song' && i.arrangement_id)
            .map((i) => ({
            id: i.song_id,
            title: i.song_title || i.title,
            arrangements: [{
                    id: i.arrangement_id,
                    key: i.arrangement_key || i.transposed_key || 'C',
                    tempo: i.tempo || 120,
                    chord_chart: null,
                }]
        }));
        setlistSongs.value = songs;
    }
    catch (e) {
        showToast(e.message || 'Erreur chargement plan', 'error');
        planItems.value = [];
        setlistSongs.value = [];
    }
}
function toggleAutoScroll() {
    autoScrollActive.value = !autoScrollActive.value;
    if (autoScrollActive.value && metronomePlaying.value) {
        startAutoScroll();
    }
    else {
        stopAutoScroll();
    }
}
function startAutoScroll() {
    stopAutoScroll();
    if (!bpm.value)
        return;
    const intervalMs = (60 / bpm.value) * 1000;
    const linesPerTick = 1;
    autoScrollInterval.value = setInterval(() => {
        const container = chartContainer.value;
        if (!container)
            return;
        const lineHeight = parseInt(getComputedStyle(container).fontSize) * 1.6;
        const scrollBy = lineHeight * linesPerTick;
        container.scrollBy({ top: scrollBy, behavior: 'smooth' });
    }, intervalMs);
}
function stopAutoScroll() {
    if (autoScrollInterval.value) {
        clearInterval(autoScrollInterval.value);
        autoScrollInterval.value = null;
    }
}
const keyOptions = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Détecte si une ligne ne contient que des accords (format 2 lignes ChordPro)
const CHORD_TOKEN_RE = /^[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(\/[A-G][#b]?(m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?$/;
const CHORD_INLINE_RE = /([A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?(?:\/[A-G][#b]?(?:m|dim|aug|sus[24]?|maj[79]?|[2679]|add[249]?)?)?)/g;
function isChordOnlyLine(line) {
    if (!line.trim())
        return false;
    const tokens = line.trim().split(/\s+/);
    if (tokens.length === 0)
        return false;
    return tokens.every(t => CHORD_TOKEN_RE.test(t));
}
function buildTwoLineParts(chordLine, lyricLine) {
    const chords = [];
    let m;
    while ((m = CHORD_INLINE_RE.exec(chordLine)) !== null) {
        chords.push({ chord: showChords.value ? transposeChord(m[0]) : '', pos: m.index });
    }
    if (chords.length === 0) {
        return [{ chord: '', lyric: showLyrics.value ? transposeText(lyricLine) : '' }];
    }
    const parts = [];
    for (let i = 0; i < chords.length; i++) {
        const { chord, pos } = chords[i];
        const nextPos = i < chords.length - 1 ? chords[i + 1].pos : Math.max(chordLine.length, lyricLine.length);
        const lyric = lyricLine.slice(pos, nextPos).trim();
        parts.push({ chord, lyric: showLyrics.value ? transposeText(lyric) : '' });
    }
    return parts;
}
const parsedLines = computed(() => {
    if (!arrangement.value?.chord_chart)
        return [];
    const chart = arrangement.value.chord_chart;
    const lines = chart.split('\n');
    const result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        i++;
        if (!trimmed)
            continue;
        // Section header: {section: Verse} or {chorus}, {verse}, etc.
        const sectionMatch = trimmed.match(/^\{([^}]+)\}/);
        if (sectionMatch && showSections.value) {
            let label = sectionMatch[1].replace(/\s{2,}/g, ' ').trim();
            result.push({ type: 'section', label });
            continue;
        }
        // Comment/directive: skip or show as plain
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            if (showSections.value) {
                let label = trimmed.slice(1, -1).replace(/\s{2,}/g, ' ').trim();
                result.push({ type: 'section', label });
            }
            continue;
        }
        // ChordPro line with chords: text[Chord]text
        if (/\[.*?\]/.test(trimmed)) {
            if (!showChords.value && !showLyrics.value) {
                continue;
            }
            const parts = [];
            let remaining = trimmed;
            while (remaining.length > 0) {
                const chordIdx = remaining.indexOf('[');
                const closeIdx = chordIdx !== -1 ? remaining.indexOf(']', chordIdx) : -1;
                if (chordIdx === -1 || closeIdx === -1) {
                    if (remaining) {
                        parts.push({ chord: '', lyric: showLyrics.value ? transposeText(remaining) : '' });
                    }
                    break;
                }
                if (chordIdx > 0) {
                    const lyric = remaining.slice(0, chordIdx);
                    if (lyric)
                        parts.push({ chord: '', lyric: showLyrics.value ? transposeText(lyric) : '' });
                }
                const chord = remaining.slice(chordIdx + 1, closeIdx);
                const transposedChord = transposeChord(chord);
                let afterChord = remaining.slice(closeIdx + 1);
                let nextChordIdx = afterChord.indexOf('[');
                let lyric = nextChordIdx === -1 ? afterChord : afterChord.slice(0, nextChordIdx);
                parts.push({ chord: showChords.value ? transposedChord : '', lyric: showLyrics.value ? transposeText(lyric) : '' });
                remaining = nextChordIdx === -1 ? '' : afterChord.slice(nextChordIdx);
            }
            if (parts.length > 0) {
                let MAX_PARTS = 100;
                result.push({ type: 'chord-lyric', parts: parts.slice(0, MAX_PARTS) });
            }
            continue;
        }
        // Two-line ChordPro: chord-only line followed by lyrics
        if (isChordOnlyLine(trimmed)) {
            if (!showChords.value && !showLyrics.value)
                continue;
            // Cherche la prochaine ligne non-vide qui n'est pas un en-tête / directive
            let lyricLine = '';
            let skipIdx = -1;
            for (let j = i; j < lines.length; j++) {
                const l = lines[j].trim();
                if (!l)
                    continue;
                if (/^\{/.test(l) || (l.startsWith('[') && l.endsWith(']')) || isChordOnlyLine(l))
                    break;
                lyricLine = l;
                skipIdx = j;
                break;
            }
            if (lyricLine) {
                const parts = buildTwoLineParts(line, lyricLine);
                if (parts.length > 0)
                    result.push({ type: 'chord-lyric', parts });
                i = skipIdx + 1;
            }
            else {
                result.push({ type: 'plain', text: trimmed });
            }
            continue;
        }
        // Plain text (lyrics only)
        result.push({ type: 'plain', text: trimmed });
    }
    return result;
});
// Pagination (split into pages by line count)
const currentPage = ref(0);
// Pagination and slicing handled by ChartViewer now
function nextPage() { }
function prevPage() { }
// TODO: implement nextPage/prevPage if pagination is re-added elsewhere
function transposeChord(chord) {
    if (semitones.value === 0)
        return chord;
    const rootMatch = chord.match(/^([A-G][#b]?)(.*)/);
    if (!rootMatch || !rootMatch[1])
        return chord;
    const root = rootMatch[1];
    const suffix = rootMatch[2] || '';
    const idx = keyOptions.indexOf(root);
    if (idx === -1)
        return chord;
    const newIdx = (idx + semitones.value + 12) % 12;
    return keyOptions[newIdx] + suffix;
}
function transposeText(text) {
    return text; // lyrics don't change
}
function transpose(delta) {
    semitones.value = (semitones.value + delta + 12) % 12;
    const origIdx = keyOptions.indexOf(arrangement.value?.key || 'C');
    if (origIdx !== -1) {
        currentKey.value = keyOptions[(origIdx + semitones.value + 12) % 12] || currentKey.value;
    }
    else {
        currentKey.value = (arrangement.value?.key || 'C');
    }
}
function setKey(k) {
    const origIdx = keyOptions.indexOf(arrangement.value?.key || 'C');
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
    document.documentElement.classList.toggle('dark', stageMode.value);
}
// Metronome
function toggleMetronome() {
    if (metronomeVisible.value) {
        metronomeVisible.value = false;
        metronomePlaying.value = false;
        clearInterval(metroInterval);
    }
    else {
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
        if (autoScrollActive.value)
            startAutoScroll();
    }
    else {
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
function onKeydown(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        nextPage();
        e.preventDefault();
    }
    if (e.key === 'ArrowLeft') {
        prevPage();
        e.preventDefault();
    }
    if (e.key === 'Escape') {
        toggleToolbar();
    }
    if (e.key === 'ArrowUp') {
        transpose(1);
        e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
        transpose(-1);
        e.preventDefault();
    }
}
function goBack() {
    router.back();
}
async function loadSongData(songId, arrId) {
    song.value = null;
    arrangement.value = null;
    currentSongId.value = songId;
    if (!songId)
        return;
    try {
        song.value = await api.getSong(songId);
        if (!song.value)
            return;
        if (arrId) {
            arrangement.value = song.value.arrangements?.find((a) => a.id === arrId);
        }
        else {
            arrangement.value = song.value.arrangements?.find((a) => a.chord_chart) || song.value.arrangements?.[0];
        }
        if (arrangement.value?.key) {
            currentKey.value = arrangement.value.key;
        }
        if (arrangement.value?.tempo) {
            bpm.value = arrangement.value.tempo;
        }
        // Apply shareable URL query params (?key=X&bpm=Y)
        const targetKey = route.query.key;
        if (targetKey && arrangement.value?.key) {
            const origIdx = keyOptions.indexOf(arrangement.value.key);
            const targetIdx = keyOptions.indexOf(targetKey);
            if (origIdx !== -1 && targetIdx !== -1) {
                semitones.value = (targetIdx - origIdx + 12) % 12;
                currentKey.value = targetKey;
            }
        }
        const targetBpm = parseInt(route.query.bpm, 10);
        if (targetBpm && targetBpm >= 30 && targetBpm <= 300) {
            bpm.value = targetBpm;
        }
    }
    catch (e) {
        showToast(e.message || 'Erreur', 'error');
    }
}
// Load song data
onMounted(async () => {
    loading.value = true;
    try {
        const songId = parseInt(route.params.songId, 10);
        const arrId = route.params.arrangementId ? parseInt(route.params.arrangementId, 10) : null;
        // Load setlist from plan if ?plan= query param
        await loadSetlist();
        // Load browser songs (all songs with charts) for Song Browser
        try {
            const all = await api.getSongs();
            songs.value = all.filter((s) => (s.arrangements && s.arrangements.some((a) => a.chord_chart)));
        }
        catch (e) {
            console.error('Erreur chargement songs pour Song Browser', e);
            songs.value = [];
        }
        await loadSongData(songId, arrId);
    }
    catch (e) {
        showToast(e instanceof Error ? e.message : 'Erreur chargement', 'error');
    }
    finally {
        loading.value = false;
    }
});
// Reload song data when navigating between songs (route params change)
watch(() => [route.params.songId, route.params.arrangementId], async ([newSongId, newArrId]) => {
    if (newSongId) {
        loading.value = true;
        const sid = parseInt(newSongId, 10);
        const aid = newArrId ? parseInt(newArrId, 10) : null;
        await loadSongData(sid, aid);
        loading.value = false;
    }
});
onUnmounted(() => {
    clearInterval(metroInterval);
    stopAutoScroll();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['music-stand']} */ ;
/** @type {__VLS_StyleScopedClasses['key-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['key-option']} */ ;
/** @type {__VLS_StyleScopedClasses['key-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-line']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['metro-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['beat-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['browser-search']} */ ;
/** @type {__VLS_StyleScopedClasses['browser-song']} */ ;
/** @type {__VLS_StyleScopedClasses['browser-song']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['song-nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-close']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
/** @type {__VLS_StyleScopedClasses['non-song']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
/** @type {__VLS_StyleScopedClasses['current']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-num']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['key-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['song-nav-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['song-browser']} */ ;
/** @type {__VLS_StyleScopedClasses['setlist-panel']} */ ;
const __VLS_0 = MusicStandMetronome;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    ...{ 'onTogglePlay': {} },
    ...{ 'onToggleEditBpm': {} },
    ...{ 'onChangeMeter': {} },
    ...{ 'onToggleAutoScroll': {} },
    ...{ 'onBpmChange': {} },
    visible: (__VLS_ctx.metronomeVisible),
    playing: (__VLS_ctx.metronomePlaying),
    bpm: (__VLS_ctx.bpm),
    meter: (__VLS_ctx.meter),
    editBpm: (__VLS_ctx.editBpm),
    autoScrollActive: (__VLS_ctx.autoScrollActive),
    currentBeat: (__VLS_ctx.currentBeat),
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    ...{ 'onTogglePlay': {} },
    ...{ 'onToggleEditBpm': {} },
    ...{ 'onChangeMeter': {} },
    ...{ 'onToggleAutoScroll': {} },
    ...{ 'onBpmChange': {} },
    visible: (__VLS_ctx.metronomeVisible),
    playing: (__VLS_ctx.metronomePlaying),
    bpm: (__VLS_ctx.bpm),
    meter: (__VLS_ctx.meter),
    editBpm: (__VLS_ctx.editBpm),
    autoScrollActive: (__VLS_ctx.autoScrollActive),
    currentBeat: (__VLS_ctx.currentBeat),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ close: {} },
    { onClose: (() => { __VLS_ctx.metronomeVisible = false; __VLS_ctx.metronomePlaying = false; }) });
const __VLS_7 = ({ togglePlay: {} },
    { onTogglePlay: (...[$event]) => {
            __VLS_ctx.metronomePlaying = !__VLS_ctx.metronomePlaying;
            // @ts-ignore
            [metronomeVisible, metronomeVisible, metronomePlaying, metronomePlaying, metronomePlaying, metronomePlaying, bpm, meter, editBpm, autoScrollActive, currentBeat,];
        } });
const __VLS_8 = ({ toggleEditBpm: {} },
    { onToggleEditBpm: (...[$event]) => {
            __VLS_ctx.editBpm = !__VLS_ctx.editBpm;
            // @ts-ignore
            [editBpm, editBpm,];
        } });
const __VLS_9 = ({ changeMeter: {} },
    { onChangeMeter: (val => __VLS_ctx.meter = val) });
const __VLS_10 = ({ toggleAutoScroll: {} },
    { onToggleAutoScroll: (...[$event]) => {
            __VLS_ctx.toggleAutoScroll();
            // @ts-ignore
            [meter, toggleAutoScroll,];
        } });
const __VLS_11 = ({ bpmChange: {} },
    { onBpmChange: (val => { if (val >= 30 && val <= 300)
            __VLS_ctx.bpm = val; }) });
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.toggleToolbar) },
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    ...{ class: "music-stand" },
    ...{ class: ({ 'stage-mode': __VLS_ctx.stageMode }) },
    tabindex: "0",
});
/** @type {__VLS_StyleScopedClasses['music-stand']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-mode']} */ ;
if (__VLS_ctx.showToolbar) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "toolbar-btn" },
        title: (__VLS_ctx.$t('musicStand.back')),
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-center" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (__VLS_ctx.openSongBrowser) },
        ...{ class: "song-title" },
    });
    /** @type {__VLS_StyleScopedClasses['song-title']} */ ;
    (__VLS_ctx.song?.title);
    if (__VLS_ctx.arrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showToolbar))
                        return;
                    if (!(__VLS_ctx.arrangement))
                        return;
                    __VLS_ctx.showKeyPicker = !__VLS_ctx.showKeyPicker;
                    // @ts-ignore
                    [bpm, toggleToolbar, onKeydown, stageMode, showToolbar, goBack, $t, openSongBrowser, song, arrangement, showKeyPicker, showKeyPicker,];
                } },
            ...{ class: "key-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['key-badge']} */ ;
        (__VLS_ctx.currentKey);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-right" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-right']} */ ;
    if (__VLS_ctx.prevSongId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToPrev) },
            ...{ class: "toolbar-btn" },
            title: "Chant précédent",
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    }
    if (__VLS_ctx.nextSongId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToNext) },
            ...{ class: "toolbar-btn" },
            title: "Chant suivant",
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.transpose(-1);
                // @ts-ignore
                [currentKey, prevSongId, goToPrev, nextSongId, goToNext, transpose,];
            } },
        ...{ class: "toolbar-btn sm:px-1 sm:text-sm" },
        title: "-1 demi-ton",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.transpose(1);
                // @ts-ignore
                [transpose,];
            } },
        ...{ class: "toolbar-btn sm:px-1 sm:text-sm" },
        title: "+1 demi-ton",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
    if (__VLS_ctx.setlistSongs.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showToolbar))
                        return;
                    if (!(__VLS_ctx.setlistSongs.length > 0))
                        return;
                    __VLS_ctx.showSetlist = !__VLS_ctx.showSetlist;
                    // @ts-ignore
                    [setlistSongs, showSetlist, showSetlist,];
                } },
            ...{ class: "toolbar-btn" },
            ...{ class: ({ active: __VLS_ctx.showSetlist }) },
            title: (__VLS_ctx.$t('setlist.back_to_plan')),
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleMetronome) },
        ...{ class: "toolbar-btn" },
        ...{ class: ({ active: __VLS_ctx.metronomePlaying }) },
        title: "Métronome",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleAutoScroll) },
        ...{ class: "toolbar-btn" },
        ...{ class: ({ active: __VLS_ctx.autoScrollActive }) },
        title: (__VLS_ctx.autoScrollActive ? 'Auto-scroll ON' : 'Auto-scroll OFF'),
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleStageMode) },
        ...{ class: "toolbar-btn" },
        ...{ class: ({ active: __VLS_ctx.stageMode }) },
        title: "Mode scène",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.showSettings = !__VLS_ctx.showSettings;
                // @ts-ignore
                [metronomePlaying, autoScrollActive, autoScrollActive, toggleAutoScroll, stageMode, $t, showSetlist, toggleMetronome, toggleStageMode, showSettings, showSettings,];
            } },
        ...{ class: "toolbar-btn" },
        title: (__VLS_ctx.$t('pdfExport.title')),
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
}
if (__VLS_ctx.showSongBrowser) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSongBrowser))
                    return;
                __VLS_ctx.showSongBrowser = false;
                // @ts-ignore
                [$t, showSongBrowser, showSongBrowser,];
            } },
        ...{ class: "song-browser-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['song-browser-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "song-browser" },
    });
    /** @type {__VLS_StyleScopedClasses['song-browser']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "browser-header" },
    });
    /** @type {__VLS_StyleScopedClasses['browser-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.searchQuery),
        type: "text",
        placeholder: (__VLS_ctx.$t('musicStand.search')),
        ...{ class: "browser-search" },
        autofocus: true,
    });
    /** @type {__VLS_StyleScopedClasses['browser-search']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSongBrowser))
                    return;
                __VLS_ctx.showSongBrowser = false;
                // @ts-ignore
                [$t, showSongBrowser, searchQuery,];
            } },
        ...{ class: "browser-close" },
    });
    /** @type {__VLS_StyleScopedClasses['browser-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "browser-list" },
    });
    /** @type {__VLS_StyleScopedClasses['browser-list']} */ ;
    for (const [s] of __VLS_vFor((__VLS_ctx.filteredSongs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showSongBrowser))
                        return;
                    __VLS_ctx.selectSong(s);
                    // @ts-ignore
                    [filteredSongs, selectSong,];
                } },
            key: (s.id),
            ...{ class: "browser-song" },
            ...{ class: ({ active: s.id === __VLS_ctx.currentSongId }) },
        });
        /** @type {__VLS_StyleScopedClasses['browser-song']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "browser-song-title" },
        });
        /** @type {__VLS_StyleScopedClasses['browser-song-title']} */ ;
        (s.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "browser-song-arr" },
        });
        /** @type {__VLS_StyleScopedClasses['browser-song-arr']} */ ;
        (s.arrangements[0]?.key || '');
        (s.arrangements[0]?.tempo || '');
        // @ts-ignore
        [currentSongId,];
    }
    if (__VLS_ctx.filteredSongs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "browser-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['browser-empty']} */ ;
        (__VLS_ctx.$t('musicStand.no_songs'));
    }
}
const __VLS_12 = MusicStandSetlist;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onClose': {} },
    ...{ 'onSelectItem': {} },
    visible: (__VLS_ctx.showSetlist),
    planItems: (__VLS_ctx.planItems),
    currentSongId: (__VLS_ctx.currentSongId),
    title: (__VLS_ctx.$t('setlist.back_to_plan')),
    emptyLabel: (__VLS_ctx.$t('setlist.empty')),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClose': {} },
    ...{ 'onSelectItem': {} },
    visible: (__VLS_ctx.showSetlist),
    planItems: (__VLS_ctx.planItems),
    currentSongId: (__VLS_ctx.currentSongId),
    title: (__VLS_ctx.$t('setlist.back_to_plan')),
    emptyLabel: (__VLS_ctx.$t('setlist.empty')),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ close: {} },
    { onClose: (...[$event]) => {
            __VLS_ctx.showSetlist = false;
            // @ts-ignore
            [$t, $t, $t, showSetlist, showSetlist, filteredSongs, currentSongId, planItems,];
        } });
const __VLS_19 = ({ selectItem: {} },
    { onSelectItem: (__VLS_ctx.selectPlanItem) });
var __VLS_15;
var __VLS_16;
if (__VLS_ctx.showKeyPicker) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "key-picker" },
    });
    /** @type {__VLS_StyleScopedClasses['key-picker']} */ ;
    for (const [k] of __VLS_vFor((__VLS_ctx.keyOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showKeyPicker))
                        return;
                    __VLS_ctx.setKey(k);
                    // @ts-ignore
                    [showKeyPicker, selectPlanItem, keyOptions, setKey,];
                } },
            key: (k),
            ...{ class: "key-option" },
            ...{ class: ({ active: k === __VLS_ctx.currentKey }) },
        });
        /** @type {__VLS_StyleScopedClasses['key-option']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        (k);
        // @ts-ignore
        [currentKey,];
    }
}
const __VLS_20 = MusicStandMetronome;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    ...{ 'onClose': {} },
    ...{ 'onTogglePlay': {} },
    ...{ 'onToggleEditBpm': {} },
    ...{ 'onChangeMeter': {} },
    ...{ 'onToggleAutoScroll': {} },
    ...{ 'onBpmChange': {} },
    visible: (__VLS_ctx.metronomeVisible),
    playing: (__VLS_ctx.metronomePlaying),
    bpm: (__VLS_ctx.bpm),
    meter: (__VLS_ctx.meter),
    editBpm: (__VLS_ctx.editBpm),
    autoScrollActive: (__VLS_ctx.autoScrollActive),
    currentBeat: (__VLS_ctx.currentBeat),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClose': {} },
    ...{ 'onTogglePlay': {} },
    ...{ 'onToggleEditBpm': {} },
    ...{ 'onChangeMeter': {} },
    ...{ 'onToggleAutoScroll': {} },
    ...{ 'onBpmChange': {} },
    visible: (__VLS_ctx.metronomeVisible),
    playing: (__VLS_ctx.metronomePlaying),
    bpm: (__VLS_ctx.bpm),
    meter: (__VLS_ctx.meter),
    editBpm: (__VLS_ctx.editBpm),
    autoScrollActive: (__VLS_ctx.autoScrollActive),
    currentBeat: (__VLS_ctx.currentBeat),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_25;
const __VLS_26 = ({ close: {} },
    { onClose: (() => { __VLS_ctx.metronomeVisible = false; __VLS_ctx.metronomePlaying = false; }) });
const __VLS_27 = ({ togglePlay: {} },
    { onTogglePlay: (...[$event]) => {
            __VLS_ctx.metronomePlaying = !__VLS_ctx.metronomePlaying;
            // @ts-ignore
            [metronomeVisible, metronomeVisible, metronomePlaying, metronomePlaying, metronomePlaying, metronomePlaying, bpm, meter, editBpm, autoScrollActive, currentBeat,];
        } });
const __VLS_28 = ({ toggleEditBpm: {} },
    { onToggleEditBpm: (...[$event]) => {
            __VLS_ctx.editBpm = !__VLS_ctx.editBpm;
            // @ts-ignore
            [editBpm, editBpm,];
        } });
const __VLS_29 = ({ changeMeter: {} },
    { onChangeMeter: (val => __VLS_ctx.meter = val) });
const __VLS_30 = ({ toggleAutoScroll: {} },
    { onToggleAutoScroll: (...[$event]) => {
            __VLS_ctx.toggleAutoScroll();
            // @ts-ignore
            [meter, toggleAutoScroll,];
        } });
const __VLS_31 = ({ bpmChange: {} },
    { onBpmChange: (val => { if (val >= 30 && val <= 300)
            __VLS_ctx.bpm = val; }) });
var __VLS_23;
var __VLS_24;
if (__VLS_ctx.showSettings) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "settings-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['settings-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
        ...{ class: "text-sm font-bold mb-2 text-gray-300" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    (__VLS_ctx.$t('pdfExport.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-gray-300 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.showChords);
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-gray-300 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.showLyrics);
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-gray-300 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.showSections);
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-gray-300 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "range",
        min: "14",
        max: "48",
        ...{ class: "w-full mt-1" },
    });
    (__VLS_ctx.fontSize);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.fontSize);
}
const __VLS_32 = MusicStandChartViewer;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    lines: (__VLS_ctx.parsedLines),
}));
const __VLS_34 = __VLS_33({
    lines: (__VLS_ctx.parsedLines),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
if (__VLS_ctx.prevSongId || __VLS_ctx.nextSongId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "song-nav-bottom" },
    });
    /** @type {__VLS_StyleScopedClasses['song-nav-bottom']} */ ;
    if (__VLS_ctx.prevSongId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToPrev) },
            ...{ class: "song-nav-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['song-nav-btn']} */ ;
        (__VLS_ctx.prevSongTitle);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    }
    if (__VLS_ctx.nextSongId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goToNext) },
            ...{ class: "song-nav-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['song-nav-btn']} */ ;
        (__VLS_ctx.nextSongTitle);
    }
}
// @ts-ignore
[bpm, $t, prevSongId, prevSongId, goToPrev, nextSongId, nextSongId, goToNext, showSettings, showChords, showLyrics, showSections, fontSize, fontSize, parsedLines, prevSongTitle, nextSongTitle,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

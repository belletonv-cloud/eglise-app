import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { transposeChordChart, getKeyOptions, getSemitonesFromC } from '../utils/transpose';
import { saveSongOffline, isSongOffline } from '../utils/offlineDb';
import { api } from '../utils/api';
import { parseChordPro } from '../utils/chordpro';
import { showToast } from '../stores/toast';
import { confirmDialog } from '../stores/confirm';
import ChordProEditor from './ChordProEditor.vue';
import MediaUpload from './MediaUpload.vue';
import ArrangementAnnotations from './ArrangementAnnotations.vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const song = ref(null);
const loading = ref(true);
const error = ref('');
const selectedArrangementId = ref(null);
const currentArrangement = ref(null);
const originalKey = ref('C');
const targetKey = ref('C');
const semitones = ref(0);
const keyOptions = getKeyOptions();
const showEditor = ref(false);
const isOffline = ref(false);
const downloading = ref(false);
const showMediaUpload = ref(false);
const mediaItems = ref([]);
const exportingPdf = ref(false);
function getMediaIcon(type) {
    const icons = { audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄' };
    return icons[type] || '📎';
}
async function loadMedia() {
    if (!currentArrangement.value?.id)
        return;
    try {
        mediaItems.value = await api.getArrangementMedia(currentArrangement.value.id);
    }
    catch {
        mediaItems.value = [];
    }
}
function onMediaUploaded(media) {
    loadMedia();
    showMediaUpload.value = false;
}
async function exportPDF() {
    if (!currentArrangement.value?.chord_chart)
        return;
    exportingPdf.value = true;
    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const chart = currentArrangement.value.chord_chart;
        const lines = chart.split('\n');
        const title = song.value?.title || 'Chant';
        const arrName = currentArrangement.value.name || '';
        const keyLabel = currentArrangement.value.key || '';
        doc.setFont('courier', 'bold');
        doc.setFontSize(16);
        doc.text(title, 10, 15);
        doc.setFontSize(10);
        doc.setFont('courier', 'normal');
        doc.text(`${arrName}${keyLabel ? ' — Ton: ' + keyLabel : ''}`, 10, 22);
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        let y = 30;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        for (const line of lines) {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            const text = line.replace(/\[.*?\]/g, (match) => {
                doc.setFont('courier', 'bold');
                const result = match;
                doc.setFont('courier', 'normal');
                return result;
            });
            const isDirective = line.startsWith('[') || line.startsWith('{');
            if (isDirective) {
                doc.setFont('courier', 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text(text.slice(0, 80), margin, y);
                doc.setTextColor(0, 0, 0);
                doc.setFont('courier', 'normal');
            }
            else {
                const hasChords = /\[.*?\]/.test(line);
                if (hasChords) {
                    doc.setFont('courier', 'bold');
                    doc.text(text.slice(0, 80), margin, y);
                    doc.setFont('courier', 'normal');
                }
                else {
                    doc.text(text.slice(0, 80), margin, y);
                }
            }
            y += 5;
        }
        doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}_${arrName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        showToast(t('pdfExport.exported'));
    }
    catch (e) {
        showToast(`${t('pdfExport.error')}: ${e.message}`, 'error');
    }
    finally {
        exportingPdf.value = false;
    }
}
async function deleteMedia(id) {
    if (!await confirmDialog(t('song.confirm_media_delete')))
        return;
    try {
        await api.deleteAttachment(id);
        mediaItems.value = mediaItems.value.filter((m) => m.id !== id);
    }
    catch (e) {
        showToast(t('song.general_error') + e.message, 'error');
    }
}
async function checkOfflineStatus() {
    if (song.value?.id) {
        isOffline.value = await isSongOffline(song.value.id);
    }
}
async function downloadForOffline() {
    if (!song.value)
        return;
    downloading.value = true;
    try {
        await saveSongOffline(song.value);
        isOffline.value = true;
    }
    catch (e) {
        showToast(t('song.download_error') + e.message, 'error');
    }
    finally {
        downloading.value = false;
    }
}
function onChartSaved(newChart) {
    if (currentArrangement.value) {
        currentArrangement.value.chord_chart = newChart;
    }
}
// Recharger quand l'ID change dans la route
const currentId = ref(route.params.id);
router.afterEach(() => {
    if (route.name === 'song-detail' && route.params.id !== currentId.value) {
        currentId.value = route.params.id;
        resetState();
        loadSong();
    }
});
const displayedChart = computed(() => {
    if (!currentArrangement.value?.chord_chart)
        return '';
    let chart = currentArrangement.value.chord_chart;
    if (chart === null || chart === undefined)
        return '';
    // Normaliser les retours à la ligne Windows (CRLF -> LF)
    chart = chart.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Transposer si nécessaire
    if (semitones.value !== 0) {
        chart = transposeChordChart(chart, originalKey.value, targetKey.value);
    }
    return chart;
});
const chordLines = computed(() => parseChordPro(displayedChart.value));
const resetState = () => {
    song.value = null;
    loading.value = true;
    error.value = '';
    selectedArrangementId.value = null;
    currentArrangement.value = null;
    originalKey.value = 'C';
    targetKey.value = 'C';
    semitones.value = 0;
};
const loadSong = async () => {
    try {
        loading.value = true;
        const id = Number(route.params.id);
        if (isNaN(id))
            throw new Error(t('app.invalid_id'));
        song.value = await api.getSong(id);
        // Sélectionner le premier arrangement par défaut
        if (song.value.arrangements && song.value.arrangements.length > 0) {
            selectedArrangementId.value = song.value.arrangements[0].id;
            loadArrangement();
        }
        // Vérifier si disponible offline
        await checkOfflineStatus();
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
};
const loadArrangement = () => {
    if (!selectedArrangementId.value || !song.value?.arrangements)
        return;
    const arr = song.value.arrangements.find((a) => a.id === selectedArrangementId.value);
    if (arr) {
        currentArrangement.value = arr;
        originalKey.value = arr.key || 'C';
        targetKey.value = arr.key || 'C';
        semitones.value = 0;
        loadMedia();
    }
};
const transpose = () => {
    semitones.value = getSemitonesFromC(targetKey.value) - getSemitonesFromC(originalKey.value);
    // Ajustement pour garder entre -6 et +6
    if (semitones.value > 6)
        semitones.value -= 12;
    if (semitones.value < -6)
        semitones.value += 12;
};
const transposeUp = () => {
    const currentIndex = keyOptions.indexOf(targetKey.value);
    if (currentIndex >= 0 && currentIndex < keyOptions.length - 1) {
        const nextKey = keyOptions[currentIndex + 1];
        if (nextKey !== undefined) {
            targetKey.value = nextKey;
            transpose();
        }
    }
};
const transposeDown = () => {
    const currentIndex = keyOptions.indexOf(targetKey.value);
    if (currentIndex > 0) {
        const prevKey = keyOptions[currentIndex - 1];
        if (prevKey !== undefined) {
            targetKey.value = prevKey;
            transpose();
        }
    }
};
const resetTransposition = () => {
    targetKey.value = originalKey.value;
    transpose();
};
const onOriginalKeyChange = () => {
    // Recalculer la transposition
    transpose();
};
const goBack = () => {
    router.back();
};
onMounted(() => {
    loadSong();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['arrangements']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['arrangement-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-chart-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pdf-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pdf-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['offline-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['media-section']} */ ;
/** @type {__VLS_StyleScopedClasses['media-link']} */ ;
/** @type {__VLS_StyleScopedClasses['add-media-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['media-delete-btn']} */ ;
if (__VLS_ctx.song) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "song-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['song-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header" },
    });
    /** @type {__VLS_StyleScopedClasses['header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "back-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
    (__VLS_ctx.t('song.back'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.song.title);
    if (__VLS_ctx.song.author) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "author" },
        });
        /** @type {__VLS_StyleScopedClasses['author']} */ ;
        (__VLS_ctx.song.author);
    }
    if (__VLS_ctx.song.ccli_number) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "ccli" },
        });
        /** @type {__VLS_StyleScopedClasses['ccli']} */ ;
        (__VLS_ctx.t('song.ccli'));
        (__VLS_ctx.song.ccli_number);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "song-info" },
    });
    /** @type {__VLS_StyleScopedClasses['song-info']} */ ;
    if (__VLS_ctx.song.themes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.t('song.themes'));
        (__VLS_ctx.song.themes);
    }
    if (__VLS_ctx.song.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.t('song.notes'));
        (__VLS_ctx.song.notes);
    }
    if (__VLS_ctx.song.arrangements && __VLS_ctx.song.arrangements.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "arrangements" },
        });
        /** @type {__VLS_StyleScopedClasses['arrangements']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.t('song.arrangements'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "arrangement-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['arrangement-controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.loadArrangement) },
            value: (__VLS_ctx.selectedArrangementId),
        });
        for (const [arr] of __VLS_vFor((__VLS_ctx.song.arrangements))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (arr.id),
                value: (arr.id),
            });
            (arr.name);
            (arr.key);
            // @ts-ignore
            [song, song, song, song, song, song, song, song, song, song, song, song, song, goBack, t, t, t, t, t, loadArrangement, selectedArrangementId,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.song.arrangements && __VLS_ctx.song.arrangements.length > 0))
                        return;
                    __VLS_ctx.showEditor = true;
                    // @ts-ignore
                    [showEditor,];
                } },
            ...{ class: "edit-chart-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['edit-chart-btn']} */ ;
        (__VLS_ctx.t('song.edit'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.exportPDF) },
            ...{ class: "pdf-btn" },
            disabled: (!__VLS_ctx.currentArrangement?.chord_chart),
        });
        /** @type {__VLS_StyleScopedClasses['pdf-btn']} */ ;
        (__VLS_ctx.exportingPdf ? __VLS_ctx.t('pdfExport.exporting') : __VLS_ctx.t('pdfExport.export'));
        if (!__VLS_ctx.isOffline) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.downloadForOffline) },
                ...{ class: "offline-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['offline-btn']} */ ;
            (__VLS_ctx.downloading ? __VLS_ctx.t('song.downloading') : __VLS_ctx.t('song.offline'));
        }
        if (__VLS_ctx.isOffline) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "offline-indicator" },
            });
            /** @type {__VLS_StyleScopedClasses['offline-indicator']} */ ;
            (__VLS_ctx.t('song.available_offline'));
        }
    }
    else if (__VLS_ctx.song.arrangements && __VLS_ctx.song.arrangements.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-arrangements" },
        });
        /** @type {__VLS_StyleScopedClasses['no-arrangements']} */ ;
        (__VLS_ctx.t('song.no_arrangement'));
    }
    if (__VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "transpose-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['transpose-controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.t('song.transposition'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "controls" },
        });
        /** @type {__VLS_StyleScopedClasses['controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('song.transpose.original'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.onOriginalKeyChange) },
            value: (__VLS_ctx.originalKey),
        });
        for (const [key] of __VLS_vFor((__VLS_ctx.keyOptions))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (key),
                value: (key),
            });
            (key);
            // @ts-ignore
            [song, song, t, t, t, t, t, t, t, t, t, exportPDF, currentArrangement, currentArrangement, exportingPdf, isOffline, isOffline, downloadForOffline, downloading, onOriginalKeyChange, originalKey, keyOptions,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('song.transpose.target'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (__VLS_ctx.transpose) },
            value: (__VLS_ctx.targetKey),
        });
        for (const [key] of __VLS_vFor((__VLS_ctx.keyOptions))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (key),
                value: (key),
            });
            (key);
            // @ts-ignore
            [t, keyOptions, transpose, targetKey,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "semitones" },
        });
        /** @type {__VLS_StyleScopedClasses['semitones']} */ ;
        (__VLS_ctx.t('song.transpose.semitones'));
        (__VLS_ctx.semitones);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "actions" },
        });
        /** @type {__VLS_StyleScopedClasses['actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.transposeUp) },
        });
        (__VLS_ctx.t('song.transpose.up'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.transposeDown) },
        });
        (__VLS_ctx.t('song.transpose.down'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resetTransposition) },
        });
        (__VLS_ctx.t('song.transpose.reset'));
    }
    if (!__VLS_ctx.displayedChart && __VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-chart-message p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['no-chart-message']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-yellow-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-yellow-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.t('song.no_chart'));
        (__VLS_ctx.currentArrangement.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (__VLS_ctx.t('song.no_chart_explain'));
    }
    else if (__VLS_ctx.displayedChart) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chord-chart" },
        });
        /** @type {__VLS_StyleScopedClasses['chord-chart']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chart-content" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-content']} */ ;
        for (const [line, idx] of __VLS_vFor((__VLS_ctx.chordLines))) {
            __VLS_asFunctionalElement(__VLS_intrinsics.template)({
                key: (idx),
            });
            if (line.type === 'empty') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "chordpro-empty" },
                });
                /** @type {__VLS_StyleScopedClasses['chordpro-empty']} */ ;
            }
            else if (line.type === 'standalone') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "standalone-chord-row" },
                });
                /** @type {__VLS_StyleScopedClasses['standalone-chord-row']} */ ;
                (line.chordRow);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "chordpro-block" },
                });
                /** @type {__VLS_StyleScopedClasses['chordpro-block']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "chord-row" },
                });
                /** @type {__VLS_StyleScopedClasses['chord-row']} */ ;
                (line.chordRow);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "lyric-row" },
                });
                /** @type {__VLS_StyleScopedClasses['lyric-row']} */ ;
                (line.lyrics);
            }
            // @ts-ignore
            [t, t, t, t, t, t, currentArrangement, currentArrangement, semitones, transposeUp, transposeDown, resetTransposition, displayedChart, displayedChart, chordLines,];
        }
    }
    if (__VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "media-section" },
        });
        /** @type {__VLS_StyleScopedClasses['media-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.t('song.media'));
        if (__VLS_ctx.mediaItems.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "count" },
            });
            /** @type {__VLS_StyleScopedClasses['count']} */ ;
            (__VLS_ctx.mediaItems.length);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "media-list" },
        });
        /** @type {__VLS_StyleScopedClasses['media-list']} */ ;
        if (!__VLS_ctx.mediaItems.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "no-media" },
            });
            /** @type {__VLS_StyleScopedClasses['no-media']} */ ;
            (__VLS_ctx.t('song.no_media'));
        }
        for (const [media] of __VLS_vFor((__VLS_ctx.mediaItems))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (media.id),
                ...{ class: "media-item" },
            });
            /** @type {__VLS_StyleScopedClasses['media-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "media-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['media-icon']} */ ;
            (__VLS_ctx.getMediaIcon(media.file_type));
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                href: (media.file_url),
                target: "_blank",
                ...{ class: "media-link" },
            });
            /** @type {__VLS_StyleScopedClasses['media-link']} */ ;
            (media.filename);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "media-type-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['media-type-badge']} */ ;
            (media.file_type || __VLS_ctx.t('song.file'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.song))
                            return;
                        if (!(__VLS_ctx.currentArrangement))
                            return;
                        __VLS_ctx.deleteMedia(media.id);
                        // @ts-ignore
                        [t, t, t, currentArrangement, mediaItems, mediaItems, mediaItems, mediaItems, getMediaIcon, deleteMedia,];
                    } },
                ...{ class: "media-delete-btn" },
                title: (__VLS_ctx.t('song.delete_media')),
            });
            /** @type {__VLS_StyleScopedClasses['media-delete-btn']} */ ;
            // @ts-ignore
            [t,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.currentArrangement))
                        return;
                    __VLS_ctx.showMediaUpload = true;
                    // @ts-ignore
                    [showMediaUpload,];
                } },
            ...{ class: "add-media-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['add-media-btn']} */ ;
        (__VLS_ctx.t('song.add_media'));
    }
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading" },
        });
        /** @type {__VLS_StyleScopedClasses['loading']} */ ;
        (__VLS_ctx.t('song.loading'));
    }
    if (__VLS_ctx.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error" },
        });
        /** @type {__VLS_StyleScopedClasses['error']} */ ;
        (__VLS_ctx.error);
    }
    if (__VLS_ctx.showEditor && __VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.showEditor && __VLS_ctx.currentArrangement))
                        return;
                    __VLS_ctx.showEditor = false;
                    // @ts-ignore
                    [t, t, showEditor, showEditor, currentArrangement, loading, error, error,];
                } },
            ...{ class: "modal-overlay" },
        });
        /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
        const __VLS_0 = ChordProEditor;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            ...{ 'onClose': {} },
            ...{ 'onSave': {} },
            arrangementId: (__VLS_ctx.currentArrangement.id),
            initialChart: (__VLS_ctx.currentArrangement.chord_chart || ''),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onClose': {} },
            ...{ 'onSave': {} },
            arrangementId: (__VLS_ctx.currentArrangement.id),
            initialChart: (__VLS_ctx.currentArrangement.chord_chart || ''),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_5;
        const __VLS_6 = ({ close: {} },
            { onClose: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.showEditor && __VLS_ctx.currentArrangement))
                        return;
                    __VLS_ctx.showEditor = false;
                    // @ts-ignore
                    [showEditor, currentArrangement, currentArrangement,];
                } });
        const __VLS_7 = ({ save: {} },
            { onSave: (__VLS_ctx.onChartSaved) });
        var __VLS_3;
        var __VLS_4;
    }
    if (__VLS_ctx.showMediaUpload && __VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.showMediaUpload && __VLS_ctx.currentArrangement))
                        return;
                    __VLS_ctx.showMediaUpload = false;
                    // @ts-ignore
                    [currentArrangement, showMediaUpload, showMediaUpload, onChartSaved,];
                } },
            ...{ class: "modal-overlay" },
        });
        /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
        const __VLS_8 = MediaUpload;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            ...{ 'onClose': {} },
            ...{ 'onUploaded': {} },
            arrangementId: (__VLS_ctx.currentArrangement.id),
        }));
        const __VLS_10 = __VLS_9({
            ...{ 'onClose': {} },
            ...{ 'onUploaded': {} },
            arrangementId: (__VLS_ctx.currentArrangement.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        let __VLS_13;
        const __VLS_14 = ({ close: {} },
            { onClose: (...[$event]) => {
                    if (!(__VLS_ctx.song))
                        return;
                    if (!(__VLS_ctx.showMediaUpload && __VLS_ctx.currentArrangement))
                        return;
                    __VLS_ctx.showMediaUpload = false;
                    // @ts-ignore
                    [currentArrangement, showMediaUpload,];
                } });
        const __VLS_15 = ({ uploaded: {} },
            { onUploaded: (__VLS_ctx.onMediaUploaded) });
        var __VLS_11;
        var __VLS_12;
    }
    if (__VLS_ctx.currentArrangement) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-8" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
        const __VLS_16 = ArrangementAnnotations;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
            arrangementId: (__VLS_ctx.currentArrangement.id),
            key: ('ann-' + __VLS_ctx.currentArrangement.id),
        }));
        const __VLS_18 = __VLS_17({
            arrangementId: (__VLS_ctx.currentArrangement.id),
            key: ('ann-' + __VLS_ctx.currentArrangement.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    }
}
// @ts-ignore
[currentArrangement, currentArrangement, currentArrangement, onMediaUploaded,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

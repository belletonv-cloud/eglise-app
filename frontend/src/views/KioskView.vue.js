import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { parseChordPro } from '../utils/chordpro';
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const kioskEl = ref(null);
const plan = ref(null);
const songs = ref([]);
const songIndex = ref(0);
const loading = ref(true);
const error = ref('');
const currentSong = computed(() => songs.value[songIndex.value]);
const parsedLines = computed(() => {
    if (!currentSong.value?.chord_chart)
        return [];
    return parseChordPro(currentSong.value.chord_chart);
});
function formatDate(d) {
    if (!d)
        return '';
    return new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
}
function nextSong() {
    if (songIndex.value < songs.value.length - 1) {
        songIndex.value++;
    }
}
function prevSong() {
    if (songIndex.value > 0) {
        songIndex.value--;
    }
}
function onKeydown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextSong();
    }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSong();
    }
    else if (e.key === 'Escape') {
        exitKiosk();
    }
}
function exitKiosk() {
    const planId = route.params.id;
    router.push(`/plans/${planId}`);
}
function enterFullscreen() {
    if (kioskEl.value?.requestFullscreen) {
        kioskEl.value.requestFullscreen().catch(() => { });
    }
}
onMounted(async () => {
    const id = parseInt(route.params.id);
    if (isNaN(id)) {
        error.value = t('app.invalid_id');
        loading.value = false;
        return;
    }
    try {
        const [planData, items] = await Promise.all([
            api.getPlan(id),
            api.getPlanItems(id),
        ]);
        plan.value = planData;
        const songItems = items.filter((i) => i.type === 'song');
        const loadedSongs = await Promise.all(songItems.map(async (item) => {
            let song = null;
            let arrangement = null;
            if (item.arrangement_id) {
                const songsList = await api.getSongs();
                for (const s of songsList) {
                    const a = (s.arrangements || []).find((arr) => arr.id === item.arrangement_id);
                    if (a) {
                        song = s;
                        arrangement = a;
                        break;
                    }
                }
            }
            return {
                plan_item_id: item.id,
                position: item.position,
                song_title: item.song_title || item.title,
                arrangement_name: arrangement?.name || null,
                key: arrangement?.key || null,
                transposed_key: item.transposed_key || null,
                chord_chart: arrangement?.chord_chart || null,
            };
        }));
        songs.value = loadedSongs;
        if (loadedSongs.length === 0)
            error.value = t('kiosk.no_songs');
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
    await nextTick();
    enterFullscreen();
    window.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (__VLS_ctx.nextSong) },
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    ...{ class: "kiosk" },
    tabindex: "0",
    ref: "kioskEl",
});
/** @type {__VLS_StyleScopedClasses['kiosk']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-full" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-full']} */ ;
    (__VLS_ctx.$t('kiosk.loading'));
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-full text-red-500" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
    (__VLS_ctx.error);
}
else if (__VLS_ctx.currentSong) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-header" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-info" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "kiosk-service" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-service']} */ ;
    (__VLS_ctx.plan?.service_type_name || __VLS_ctx.$t('kiosk.default_service'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "kiosk-date" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-date']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.plan?.date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-song-count" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-song-count']} */ ;
    (__VLS_ctx.songIndex + 1);
    (__VLS_ctx.songs.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-body" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-song-title" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-song-title']} */ ;
    (__VLS_ctx.currentSong.song_title);
    if (__VLS_ctx.currentSong.transposed_key) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kiosk-song-key" },
        });
        /** @type {__VLS_StyleScopedClasses['kiosk-song-key']} */ ;
        (__VLS_ctx.$t('arrangement.original_key'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.currentSong.transposed_key);
        if (__VLS_ctx.currentSong.arrangement_name) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.currentSong.arrangement_name);
        }
    }
    if (__VLS_ctx.currentSong.chord_chart) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kiosk-chart" },
        });
        /** @type {__VLS_StyleScopedClasses['kiosk-chart']} */ ;
        for (const [line, idx] of __VLS_vFor((__VLS_ctx.parsedLines))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: (line.type === 'empty' ? 'chart-empty' : 'chart-block') },
            });
            if (line.type !== 'empty') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "chart-chord" },
                });
                /** @type {__VLS_StyleScopedClasses['chart-chord']} */ ;
                (line.chordRow);
            }
            if (line.type === 'normal') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "chart-lyric" },
                });
                /** @type {__VLS_StyleScopedClasses['chart-lyric']} */ ;
                (line.lyrics);
            }
            // @ts-ignore
            [nextSong, onKeydown, loading, $t, $t, $t, error, error, currentSong, currentSong, currentSong, currentSong, currentSong, currentSong, currentSong, plan, plan, formatDate, songIndex, songs, parsedLines,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "kiosk-no-chart" },
        });
        /** @type {__VLS_StyleScopedClasses['kiosk-no-chart']} */ ;
        (__VLS_ctx.$t('kiosk.no_chart'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kiosk-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.prevSong) },
        ...{ class: "kiosk-nav-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-nav-btn']} */ ;
    (__VLS_ctx.$t('kiosk.prev'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exitKiosk) },
        ...{ class: "kiosk-exit-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-exit-btn']} */ ;
    (__VLS_ctx.$t('kiosk.exit'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.nextSong) },
        ...{ class: "kiosk-nav-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['kiosk-nav-btn']} */ ;
    (__VLS_ctx.$t('kiosk.next'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-full" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-full']} */ ;
    (__VLS_ctx.$t('kiosk.no_songs'));
}
// @ts-ignore
[nextSong, $t, $t, $t, $t, $t, prevSong, exitKiosk,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

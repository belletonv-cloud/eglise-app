import { ref, computed, watch } from 'vue';
const props = defineProps();
const emit = defineEmits(['select-song', 'close']);
const searchQuery = ref('');
const filteredSongs = computed(() => {
    if (!searchQuery.value)
        return props.songs;
    const q = searchQuery.value.toLowerCase();
    return props.songs.filter(s => s.title.toLowerCase().includes(q));
});
function selectSong(s) {
    emit('select-song', s);
    searchQuery.value = '';
}
watch(() => props.visible, v => { if (!v)
    searchQuery.value = ''; });
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.emit('close');
                // @ts-ignore
                [visible, emit,];
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
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.emit('close');
                // @ts-ignore
                [emit, searchQuery, $t,];
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
                    if (!(__VLS_ctx.visible))
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
// @ts-ignore
[$t, filteredSongs,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};

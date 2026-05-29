const props = defineProps();
const emit = defineEmits([
    'back',
    'open-song-browser',
    'toggle-key-picker',
    'go-prev',
    'go-next',
    'transpose',
    'toggle-setlist',
    'toggle-metronome',
    'toggle-auto-scroll',
    'toggle-stage-mode',
    'toggle-settings',
]);
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: () => { } },
    ...{ class: "toolbar" },
});
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('back');
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "toolbar-btn" },
    title: (__VLS_ctx.$t('musicStand.back')),
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toolbar-center" },
});
/** @type {__VLS_StyleScopedClasses['toolbar-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('open-song-browser');
            // @ts-ignore
            [emit, $t,];
        } },
    ...{ class: "song-title" },
});
/** @type {__VLS_StyleScopedClasses['song-title']} */ ;
(__VLS_ctx.songTitle);
if (__VLS_ctx.arrangement) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.arrangement))
                    return;
                __VLS_ctx.emit('toggle-key-picker');
                // @ts-ignore
                [emit, songTitle, arrangement,];
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
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.prevSongId))
                    return;
                __VLS_ctx.emit('go-prev');
                // @ts-ignore
                [emit, currentKey, prevSongId,];
            } },
        ...{ class: "toolbar-btn" },
        title: "Chant précédent",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
}
if (__VLS_ctx.nextSongId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.nextSongId))
                    return;
                __VLS_ctx.emit('go-next');
                // @ts-ignore
                [emit, nextSongId,];
            } },
        ...{ class: "toolbar-btn" },
        title: "Chant suivant",
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('transpose', -1);
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "toolbar-btn sm:px-1 sm:text-sm" },
    title: "-1 demi-ton",
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('transpose', 1);
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "toolbar-btn sm:px-1 sm:text-sm" },
    title: "+1 demi-ton",
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-sm']} */ ;
if (__VLS_ctx.setlistSongs && __VLS_ctx.setlistSongs.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.setlistSongs && __VLS_ctx.setlistSongs.length > 0))
                    return;
                __VLS_ctx.emit('toggle-setlist');
                // @ts-ignore
                [emit, setlistSongs, setlistSongs,];
            } },
        ...{ class: "toolbar-btn" },
        ...{ class: ({ active: __VLS_ctx.showSetlist }) },
        title: (__VLS_ctx.$t('setlist.back_to_plan')),
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle-metronome');
            // @ts-ignore
            [emit, $t, showSetlist,];
        } },
    ...{ class: "toolbar-btn" },
    ...{ class: ({ active: __VLS_ctx.metronomePlaying }) },
    title: "Métronome",
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle-auto-scroll');
            // @ts-ignore
            [emit, metronomePlaying,];
        } },
    ...{ class: "toolbar-btn" },
    ...{ class: ({ active: __VLS_ctx.autoScrollActive }) },
    title: (__VLS_ctx.autoScrollActive ? 'Auto-scroll ON' : 'Auto-scroll OFF'),
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle-stage-mode');
            // @ts-ignore
            [emit, autoScrollActive, autoScrollActive,];
        } },
    ...{ class: "toolbar-btn" },
    ...{ class: ({ active: __VLS_ctx.stageMode }) },
    title: "Mode scène",
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle-settings');
            // @ts-ignore
            [emit, stageMode,];
        } },
    ...{ class: "toolbar-btn" },
    title: (__VLS_ctx.$t('pdfExport.title')),
});
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};

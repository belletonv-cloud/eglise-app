const props = defineProps();
const emit = defineEmits();
function emitClose() {
    emit('close');
}
function handleSelect(item) {
    if (item.type === 'song' && item.arrangement_id) {
        emit('select-item', item);
    }
}
const itemClass = (item, idx) => ({
    current: item.type === 'song' && item.arrangement_id && item.song_id === props.currentSongId,
    'song-item': item.type === 'song',
    'non-song': item.type !== 'song',
});
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
        ...{ onClick: (__VLS_ctx.emitClose) },
        ...{ class: "setlist-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "setlist-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "setlist-header" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "setlist-title-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-title-heading']} */ ;
    (__VLS_ctx.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.emitClose) },
        ...{ class: "setlist-close" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "setlist-list" },
    });
    /** @type {__VLS_StyleScopedClasses['setlist-list']} */ ;
    for (const [item, idx] of __VLS_vFor((__VLS_ctx.planItems))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.visible))
                        return;
                    __VLS_ctx.handleSelect(item);
                    // @ts-ignore
                    [visible, emitClose, emitClose, title, planItems, handleSelect,];
                } },
            key: (item.id),
            ...{ class: "setlist-item" },
            ...{ class: (__VLS_ctx.itemClass(item, idx)) },
        });
        /** @type {__VLS_StyleScopedClasses['setlist-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "setlist-num" },
        });
        /** @type {__VLS_StyleScopedClasses['setlist-num']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "setlist-info" },
        });
        /** @type {__VLS_StyleScopedClasses['setlist-info']} */ ;
        if (item.type !== 'song') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "setlist-type" },
            });
            /** @type {__VLS_StyleScopedClasses['setlist-type']} */ ;
            (item.title);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "setlist-title" },
            });
            /** @type {__VLS_StyleScopedClasses['setlist-title']} */ ;
            (item.song_title || item.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "setlist-detail" },
            });
            /** @type {__VLS_StyleScopedClasses['setlist-detail']} */ ;
            (item.arrangement_key || item.transposed_key || '');
            if (item.tempo) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (item.tempo);
            }
        }
        if (item.type === 'song' && item.arrangement_id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "setlist-play" },
            });
            /** @type {__VLS_StyleScopedClasses['setlist-play']} */ ;
        }
        // @ts-ignore
        [itemClass,];
    }
    if (__VLS_ctx.planItems.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "setlist-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['setlist-empty']} */ ;
        (__VLS_ctx.emptyLabel);
    }
}
// @ts-ignore
[planItems, emptyLabel,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

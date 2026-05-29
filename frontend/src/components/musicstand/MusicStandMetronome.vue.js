import { ref, watch } from 'vue';
const props = defineProps();
const emits = defineEmits();
// Local copy of BPM to allow direct edit
const innerBpm = ref(props.bpm);
watch(() => props.bpm, (val) => { innerBpm.value = val; });
watch(innerBpm, (val) => { emits('bpm-change', val); });
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
        ...{ onClick: () => { } },
        ...{ class: "metronome" },
    });
    /** @type {__VLS_StyleScopedClasses['metronome']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metronome-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['metronome-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.$emit('toggle-play');
                // @ts-ignore
                [visible, $emit,];
            } },
        ...{ class: "metro-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['metro-btn']} */ ;
    (__VLS_ctx.playing ? '⏸' : '▶');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.$emit('toggle-edit-bpm');
                // @ts-ignore
                [$emit, playing,];
            } },
        ...{ class: "bpm-display" },
    });
    /** @type {__VLS_StyleScopedClasses['bpm-display']} */ ;
    if (__VLS_ctx.editBpm) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onBlur: (...[$event]) => {
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.editBpm))
                        return;
                    __VLS_ctx.$emit('toggle-edit-bpm');
                    // @ts-ignore
                    [$emit, editBpm,];
                } },
            ...{ onKeyup: (...[$event]) => {
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.editBpm))
                        return;
                    __VLS_ctx.$emit('toggle-edit-bpm');
                    // @ts-ignore
                    [$emit,];
                } },
            type: "number",
            ...{ class: "bpm-input" },
            min: "30",
            max: "300",
        });
        (__VLS_ctx.innerBpm);
        /** @type {__VLS_StyleScopedClasses['bpm-input']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.bpm);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.$emit('change-meter', __VLS_ctx.meter === 4 ? 3 : 4);
                // @ts-ignore
                [$emit, innerBpm, bpm, meter,];
            } },
        ...{ class: "metro-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['metro-btn']} */ ;
    (__VLS_ctx.meter);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "metro-btn auto-scroll-toggle" },
    });
    /** @type {__VLS_StyleScopedClasses['metro-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['auto-scroll-toggle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.$emit('toggle-auto-scroll');
                // @ts-ignore
                [$emit, meter,];
            } },
        ...{ onClick: () => { } },
        type: "checkbox",
        checked: (__VLS_ctx.autoScrollActive),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.$emit('close');
                // @ts-ignore
                [$emit, autoScrollActive,];
            } },
        ...{ class: "metro-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['metro-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "beat-indicators" },
    });
    /** @type {__VLS_StyleScopedClasses['beat-indicators']} */ ;
    for (const [i] of __VLS_vFor((__VLS_ctx.meter))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "beat-dot" },
            ...{ class: ({ active: __VLS_ctx.currentBeat === i - 1 && __VLS_ctx.playing }) },
        });
        /** @type {__VLS_StyleScopedClasses['beat-dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        // @ts-ignore
        [playing, meter, currentBeat,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

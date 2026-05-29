const props = defineProps({
    lines: {
        type: Array,
        required: true
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "chart-container" },
});
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
if (__VLS_ctx.lines && __VLS_ctx.lines.length > 0) {
    for (const [line, idx] of __VLS_vFor((__VLS_ctx.lines))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (idx),
            ...{ class: "chart-line" },
        });
        /** @type {__VLS_StyleScopedClasses['chart-line']} */ ;
        if (line.type === 'section') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "section-label" },
            });
            /** @type {__VLS_StyleScopedClasses['section-label']} */ ;
            (line.label);
        }
        else if (line.type === 'plain') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "plain-text" },
            });
            /** @type {__VLS_StyleScopedClasses['plain-text']} */ ;
            (line.text);
        }
        else if (line.type === 'chord-lyric') {
            for (const [part, j] of __VLS_vFor((line.parts))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    key: (j),
                    ...{ class: "chord-lyric-block" },
                });
                /** @type {__VLS_StyleScopedClasses['chord-lyric-block']} */ ;
                if (part.chord) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "chord" },
                    });
                    /** @type {__VLS_StyleScopedClasses['chord']} */ ;
                    (part.chord);
                }
                if (part.lyric) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "lyric" },
                    });
                    /** @type {__VLS_StyleScopedClasses['lyric']} */ ;
                    (part.lyric);
                }
                // @ts-ignore
                [lines, lines, lines,];
            }
        }
        // @ts-ignore
        [];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "no-chart" },
    });
    /** @type {__VLS_StyleScopedClasses['no-chart']} */ ;
    var __VLS_0 = {};
}
// @ts-ignore
var __VLS_1 = __VLS_0;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    props: {
        lines: {
            type: Array,
            required: true
        }
    },
});
const __VLS_export = {};
export default {};

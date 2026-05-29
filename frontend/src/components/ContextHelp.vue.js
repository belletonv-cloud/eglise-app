import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps({
    text: { type: String, default: '' },
});
const { t } = useI18n();
const show = ref(false);
function close() { show.value = false; }
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "relative inline-block align-middle" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['align-middle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.show = !__VLS_ctx.show;
            // @ts-ignore
            [show, show,];
        } },
    type: "button",
    'aria-label': (__VLS_ctx.t('common.help')),
    ...{ class: "px-2 py-1 hover:bg-blue-50 rounded-full text-blue-600 dark:text-blue-400 text-xl focus:outline-none focus-visible:ring" },
    tabindex: "0",
});
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-blue-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:ring']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "inline w-5 h-5 align-middle" },
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
});
/** @type {__VLS_StyleScopedClasses['inline']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['align-middle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M8.228 9.2a4 4 0 117.542 2.4c-.346.547-.829.981-1.44 1.243-.645.28-1.226.729-1.314 1.513M12 17h.01",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
    cx: "12",
    cy: "12",
    r: "9",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
if (__VLS_ctx.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "absolute z-40 left-1/2 -translate-x-1/2 mt-2 w-60 max-w-xs px-3 py-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm text-left" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-60']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    var __VLS_0 = {};
    (__VLS_ctx.text);
}
// @ts-ignore
var __VLS_1 = __VLS_0;
// @ts-ignore
[show, t, close, text,];
const __VLS_base = (await import('vue')).defineComponent({
    props: {
        text: { type: String, default: '' },
    },
});
const __VLS_export = {};
export default {};

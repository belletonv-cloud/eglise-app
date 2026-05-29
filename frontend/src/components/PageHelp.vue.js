import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
const props = defineProps({
    page: { type: String, required: true },
    steps: { type: Array, default: () => [] },
    helpText: { type: String, default: '' },
});
const visible = ref(false);
const stepIndex = ref(0);
const steps = computed(() => props.steps || []);
const btnRef = ref(null);
const modalContentRef = ref(null);
let lastActiveElement = null;
// Highlight state for current selector
const highlightedEl = ref(null);
function applyHighlight() {
    // Remove old highlight
    if (highlightedEl.value)
        highlightedEl.value.classList.remove('page-help-step-highlight');
    highlightedEl.value = null;
    const s = steps.value[stepIndex.value]?.selector;
    if (s) {
        const el = document.querySelector(s);
        if (el) {
            el.classList.add('page-help-step-highlight');
            highlightedEl.value = el;
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
}
function cleanupHighlight() {
    if (highlightedEl.value)
        highlightedEl.value.classList.remove('page-help-step-highlight');
    highlightedEl.value = null;
}
function openModal() {
    visible.value = true;
    stepIndex.value = 0;
    lastActiveElement = document.activeElement;
    nextTick(() => {
        modalContentRef.value?.focus();
        applyHighlight();
    });
}
function closeModal() {
    visible.value = false;
    cleanupHighlight();
    nextTick(() => {
        if (lastActiveElement)
            lastActiveElement.focus?.();
    });
}
function nextStep() {
    if (stepIndex.value < steps.value.length - 1) {
        stepIndex.value++;
        nextTick(applyHighlight);
    }
}
function prevStep() {
    if (stepIndex.value > 0) {
        stepIndex.value--;
        nextTick(applyHighlight);
    }
}
// Gestes clavier (modal ouverte uniquement)
function onKeydown(e) {
    if (!visible.value)
        return;
    if (e.key === 'Escape') {
        closeModal();
    }
    else if (e.key === 'ArrowRight') {
        nextStep();
    }
    else if (e.key === 'ArrowLeft') {
        prevStep();
    }
}
onMounted(() => {
    window.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    cleanupHighlight();
});
watch(visible, (v) => {
    if (!v)
        cleanupHighlight();
});
watch(stepIndex, () => {
    if (visible.value)
        nextTick(applyHighlight);
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-help-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-help-root" },
});
/** @type {__VLS_StyleScopedClasses['page-help-root']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openModal) },
    ...{ class: "page-help-btn" },
    'aria-label': "Aide/explications de la page",
    title: "Aide/explications de la page",
    ref: "btnRef",
});
/** @type {__VLS_StyleScopedClasses['page-help-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-help-modal fixed inset-0 z-50 flex items-center justify-center bg-black/40" },
    });
    /** @type {__VLS_StyleScopedClasses['page-help-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-black/40']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-help-content bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-lg w-full relative" },
        ref: "modalContentRef",
        tabindex: "0",
    });
    /** @type {__VLS_StyleScopedClasses['page-help-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "absolute top-4 right-6 text-gray-500 hover:text-blue-600" },
        'aria-label': "Fermer",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-600']} */ ;
    if (__VLS_ctx.steps.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        var __VLS_6 = {};
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.helpText);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "font-semibold text-xl mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        (__VLS_ctx.steps[__VLS_ctx.stepIndex]?.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-6" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
        (__VLS_ctx.steps[__VLS_ctx.stepIndex]?.desc);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center gap-5 justify-between mt-8" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
        if (__VLS_ctx.stepIndex > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.prevStep) },
                ...{ class: "text-blue-500 hover:underline" },
            });
            /** @type {__VLS_StyleScopedClasses['text-blue-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            (__VLS_ctx.$t('help.prev') || 'Précédent');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex-1 text-center text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.stepIndex + 1);
        (__VLS_ctx.steps.length);
        if (__VLS_ctx.stepIndex < __VLS_ctx.steps.length - 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.nextStep) },
                ...{ class: "text-blue-500 hover:underline" },
            });
            /** @type {__VLS_StyleScopedClasses['text-blue-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            (__VLS_ctx.$t('help.next') || 'Suivant');
        }
        if (__VLS_ctx.stepIndex === __VLS_ctx.steps.length - 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.closeModal) },
                ...{ class: "text-green-600 font-semibold ml-auto" },
            });
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
            (__VLS_ctx.$t('help.done') || 'Terminé');
        }
    }
}
// @ts-ignore
[openModal, visible, closeModal, closeModal, steps, steps, steps, steps, steps, steps, helpText, stepIndex, stepIndex, stepIndex, stepIndex, stepIndex, stepIndex, prevStep, $t, $t, $t, nextStep,];
var __VLS_3;
// @ts-ignore
var __VLS_7 = __VLS_6;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    props: {
        page: { type: String, required: true },
        steps: { type: Array, default: () => [] },
        helpText: { type: String, default: '' },
    },
});
const __VLS_export = {};
export default {};

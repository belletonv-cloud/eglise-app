import { Teleport, ref, computed, onMounted, onUnmounted, watch } from 'vue';
const props = defineProps({
    event: { type: Object, required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    visible: { type: Boolean, default: false },
    onClose: { type: Function, required: true },
});
const popoverEl = ref(null);
const popoverStyle = computed(() => ({
    position: 'fixed',
    left: props.x + 'px',
    top: props.y + 'px',
    zIndex: 9999,
    minWidth: '270px',
    maxWidth: '95vw',
}));
function handleKeydown(e) {
    if (e.key === 'Escape')
        props.onClose();
}
onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});
watch(() => props.visible, val => {
    if (val)
        popoverEl.value?.focus();
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
/** @type {__VLS_StyleScopedClasses['popover-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['popover-btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['event-popover']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onMousedown: (__VLS_ctx.onClose) },
        ...{ class: "event-popover-backdrop" },
    });
    /** @type {__VLS_StyleScopedClasses['event-popover-backdrop']} */ ;
}
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "event-popover" },
        ...{ style: (__VLS_ctx.popoverStyle) },
        ref: "popoverEl",
        tabindex: "-1",
    });
    /** @type {__VLS_StyleScopedClasses['event-popover']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.onClose) },
        ...{ class: "popover-close" },
        'aria-label': "Fermer",
    });
    /** @type {__VLS_StyleScopedClasses['popover-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "popover-header" },
    });
    /** @type {__VLS_StyleScopedClasses['popover-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "popover-emoji" },
    });
    /** @type {__VLS_StyleScopedClasses['popover-emoji']} */ ;
    (__VLS_ctx.event.emoji || '📌');
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "popover-title" },
    });
    /** @type {__VLS_StyleScopedClasses['popover-title']} */ ;
    (__VLS_ctx.event.title || __VLS_ctx.event.titre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "popover-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['popover-meta']} */ ;
    if (__VLS_ctx.event.date || __VLS_ctx.event.start_date) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.event.date || __VLS_ctx.event.start_date);
    }
    if (__VLS_ctx.event.time || __VLS_ctx.event.heure) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.event.time || __VLS_ctx.event.heure);
    }
    if (__VLS_ctx.event.location || __VLS_ctx.event.lieu) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.event.location || __VLS_ctx.event.lieu);
    }
    if (__VLS_ctx.event.description || __VLS_ctx.event.description) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "popover-desc" },
        });
        /** @type {__VLS_StyleScopedClasses['popover-desc']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.event.description);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "popover-links" },
    });
    /** @type {__VLS_StyleScopedClasses['popover-links']} */ ;
    if (__VLS_ctx.event.link || __VLS_ctx.event.lien) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.event.link || __VLS_ctx.event.lien),
            ...{ class: "popover-btn" },
            target: "_blank",
        });
        /** @type {__VLS_StyleScopedClasses['popover-btn']} */ ;
    }
    if (__VLS_ctx.event.ticketUrl || __VLS_ctx.event.billetterie) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
            href: (__VLS_ctx.event.ticketUrl || __VLS_ctx.event.billetterie),
            target: "_blank",
            ...{ class: "popover-btn popover-btn-outline" },
        });
        /** @type {__VLS_StyleScopedClasses['popover-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['popover-btn-outline']} */ ;
    }
}
// @ts-ignore
[visible, visible, onClose, onClose, popoverStyle, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event, event,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    props: {
        event: { type: Object, required: true },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        visible: { type: Boolean, default: false },
        onClose: { type: Function, required: true },
    },
});
export default {};

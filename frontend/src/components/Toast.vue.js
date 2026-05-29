import { ref, watch } from 'vue';
const props = withDefaults(defineProps(), {
    type: 'info',
    visible: false,
    duration: 3000,
});
const emit = defineEmits();
const visible = ref(props.visible);
let timer = null;
watch(() => props.visible, (val) => {
    visible.value = val;
    if (val) {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => { visible.value = false; emit('closed'); }, props.duration);
    }
});
function close() {
    visible.value = false;
    emit('closed');
}
const __VLS_defaults = {
    type: 'info',
    visible: false,
    duration: 3000,
};
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
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (['toast', __VLS_ctx.type]) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "toast-text" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-text']} */ ;
    (__VLS_ctx.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "toast-close" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
}
// @ts-ignore
[visible, type, message, close,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};

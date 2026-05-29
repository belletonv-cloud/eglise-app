import { confirmState, confirmResolve } from '../stores/confirm';
const state = confirmState();
function confirm() {
    confirmResolve(true);
}
function cancel() {
    confirmResolve(false);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
if (__VLS_ctx.state.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.cancel) },
        ...{ class: "confirm-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-dialog" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-dialog']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirm-message" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-message']} */ ;
    (__VLS_ctx.state.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancel) },
        ...{ class: "btn-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirm) },
        ...{ class: "btn-confirm" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-confirm']} */ ;
}
// @ts-ignore
[state, state, cancel, cancel, confirm,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../utils/api';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const token = ref(null);
const loading = ref(false);
const error = ref(null);
const result = ref(null);
onMounted(() => {
    token.value = route.query.token;
    if (!token.value)
        error.value = t('adminOneClick.token_missing');
});
async function confirm() {
    if (!token.value)
        return;
    loading.value = true;
    error.value = null;
    try {
        await api.sendOneClick(token.value);
        result.value = true;
    }
    catch (e) {
        error.value = e.message || JSON.stringify(e);
    }
    finally {
        loading.value = false;
    }
}
function cancel() { router.push({ name: 'conflicts' }); }
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-xl font-bold mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
(__VLS_ctx.$t('adminOneClick.title'));
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    (__VLS_ctx.$t('adminOneClick.result_error', { msg: __VLS_ctx.error }));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('adminOneClick.action'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('adminOneClick.action_label'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirm) },
        disabled: (__VLS_ctx.loading),
        ...{ class: "px-3 py-2 bg-red-600 text-white rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    (__VLS_ctx.$t('adminOneClick.confirm'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancel) },
        disabled: (__VLS_ctx.loading),
        ...{ class: "ml-2 px-3 py-2 bg-gray-200 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    (__VLS_ctx.$t('adminOneClick.cancel'));
    if (__VLS_ctx.result) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-4 text-green-600" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
        (__VLS_ctx.$t('adminOneClick.result_success'));
    }
}
// @ts-ignore
[$t, $t, $t, $t, $t, $t, $t, error, error, confirm, loading, loading, cancel, result,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

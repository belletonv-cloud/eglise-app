import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { isPushSupported, getNotificationPermission, requestPermission, subscribeToPush, registerToken, unsubscribe, getExistingSubscription, extractFCMToken } from '../utils/notifications';
const { t } = useI18n();
const emit = defineEmits();
const props = defineProps();
const vapidConfigured = !!import.meta.env.VITE_VAPID_PUBLIC_KEY;
const permission = ref(getNotificationPermission());
const subscribed = ref(false);
const subscribing = ref(false);
const unsubscribing = ref(false);
const swRegistration = ref(null);
const isPushSupportedVal = isPushSupported();
const permissionClass = computed(() => ({
    'bg-green-100 text-green-800': permission.value === 'granted',
    'bg-yellow-100 text-yellow-800': permission.value === 'default',
    'bg-red-100 text-red-800': permission.value === 'denied',
}));
const permissionText = computed(() => {
    const map = {
        granted: t('notificationPrefs.granted'),
        default: t('notificationPrefs.default'),
        denied: t('notificationPrefs.denied'),
    };
    return map[permission.value] || 'Inconnu';
});
async function getSW() {
    if (swRegistration.value)
        return swRegistration.value;
    if ('serviceWorker' in navigator) {
        try {
            swRegistration.value = await navigator.serviceWorker.ready;
        }
        catch { }
    }
    return swRegistration.value;
}
async function checkSubscription() {
    const reg = await getSW();
    if (!reg)
        return;
    const sub = await getExistingSubscription(reg);
    subscribed.value = !!sub;
}
async function requestAndSubscribe() {
    const result = await requestPermission();
    permission.value = result;
    if (result === 'granted') {
        await subscribe();
    }
}
async function subscribe() {
    const reg = await getSW();
    if (!reg)
        return;
    subscribing.value = true;
    try {
        const sub = await subscribeToPush(reg);
        if (sub) {
            await registerToken(props.memberId, sub);
            subscribed.value = true;
            emit('subscribed', extractFCMToken(sub) || '');
        }
    }
    finally {
        subscribing.value = false;
    }
}
async function unsubscribePush() {
    const reg = await getSW();
    if (!reg)
        return;
    unsubscribing.value = true;
    try {
        await unsubscribe(reg);
        subscribed.value = false;
        emit('unsubscribed');
    }
    finally {
        unsubscribing.value = false;
    }
}
onMounted(() => {
    checkSubscription();
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
/** @type {__VLS_StyleScopedClasses['alert-info']} */ ;
/** @type {__VLS_StyleScopedClasses['vapid-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "notification-prefs" },
});
/** @type {__VLS_StyleScopedClasses['notification-prefs']} */ ;
if (!__VLS_ctx.isPushSupported) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-info" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-info']} */ ;
    (__VLS_ctx.$t('notificationPrefs.not_supported'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "prefs-content" },
    });
    /** @type {__VLS_StyleScopedClasses['prefs-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "permission-status" },
    });
    /** @type {__VLS_StyleScopedClasses['permission-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    (__VLS_ctx.$t('notificationPrefs.label'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (['status-badge', __VLS_ctx.permissionClass]) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (__VLS_ctx.permissionText);
    if (!__VLS_ctx.vapidConfigured) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "vapid-warning" },
        });
        /** @type {__VLS_StyleScopedClasses['vapid-warning']} */ ;
        (__VLS_ctx.$t('notificationPrefs.vapid_warning'));
    }
    if (__VLS_ctx.vapidConfigured) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "actions" },
        });
        /** @type {__VLS_StyleScopedClasses['actions']} */ ;
        if (__VLS_ctx.permission === 'default') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.requestAndSubscribe) },
                ...{ class: "btn-primary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
            (__VLS_ctx.$t('notificationPrefs.enable'));
        }
        if (__VLS_ctx.permission === 'granted' && !__VLS_ctx.subscribed) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.subscribe) },
                ...{ class: "btn-primary" },
                disabled: (__VLS_ctx.subscribing),
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
            (__VLS_ctx.subscribing ? __VLS_ctx.$t('notificationPrefs.subscribing') : __VLS_ctx.$t('notificationPrefs.subscribe'));
        }
        if (__VLS_ctx.subscribed) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.unsubscribePush) },
                ...{ class: "btn-danger" },
                disabled: (__VLS_ctx.unsubscribing),
            });
            /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
            (__VLS_ctx.unsubscribing ? __VLS_ctx.$t('notificationPrefs.unsubscribing') : __VLS_ctx.$t('notificationPrefs.unsubscribe'));
        }
    }
    if (__VLS_ctx.subscribed) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "subscribed-info" },
        });
        /** @type {__VLS_StyleScopedClasses['subscribed-info']} */ ;
        (__VLS_ctx.$t('notificationPrefs.active'));
    }
}
// @ts-ignore
[isPushSupported, $t, $t, $t, $t, $t, $t, $t, $t, $t, permissionClass, permissionText, vapidConfigured, vapidConfigured, permission, permission, requestAndSubscribe, subscribed, subscribed, subscribed, subscribe, subscribing, subscribing, unsubscribePush, unsubscribing, unsubscribing,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { user, isAuthenticated, logout } from './stores/auth';
import { member, loadCurrentMember, isAdmin, isScheduler, loading as memberLoading } from './stores/member';
import Toasts from './components/Toasts.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import GlobalSearch from './components/GlobalSearch.vue';
import { onLogin } from './stores/auth';
import { useRouter } from 'vue-router';
const { locale } = useI18n();
const lang = ref(locale.value);
const toggleLang = () => {
    const newLang = lang.value === 'fr' ? 'en' : 'fr';
    lang.value = newLang;
    locale.value = newLang;
    localStorage.setItem('locale', newLang);
};
const mobileSidebarOpen = ref(false);
const route = useRoute();
watch(() => route.path, () => { mobileSidebarOpen.value = false; });
const isDark = ref(localStorage.getItem('dark-mode') === 'true');
if (isDark.value)
    document.documentElement.classList.add('dark');
function toggleDarkMode() {
    isDark.value = !isDark.value;
    localStorage.setItem('dark-mode', String(isDark.value));
    document.documentElement.classList.toggle('dark', isDark.value);
}
const online = ref(navigator.onLine);
window.addEventListener('online', () => { online.value = true; });
window.addEventListener('offline', () => { online.value = false; });
onMounted(async () => {
    if (!isAuthenticated.value)
        return;
    if (!('Notification' in window))
        return;
    const permission = await Notification.requestPermission().catch(() => 'denied');
    if (permission !== 'granted')
        return;
});
const router = useRouter();
onLogin(() => {
    if (route.name === 'login')
        router.push('/');
});
watch(user, (val) => {
    if (val) {
        loadCurrentMember();
        if (route.name === 'login')
            router.push('/');
    }
    else
        member.value = null;
}, { immediate: true });
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "app",
    ...{ class: ({ dark: __VLS_ctx.isDark }) },
});
/** @type {__VLS_StyleScopedClasses['dark']} */ ;
if (!__VLS_ctx.isAuthenticated) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-900']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
    routerView;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else if (__VLS_ctx.memberLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-900']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 text-gray-500 dark:text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex h-screen bg-gray-100 dark:bg-gray-900" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-900']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out" },
        ...{ class: (__VLS_ctx.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0') },
    });
    /** @type {__VLS_StyleScopedClasses['w-64']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:static']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-40']} */ ;
    /** @type {__VLS_StyleScopedClasses['transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-lg font-bold text-gray-800 dark:text-gray-100" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
    (__VLS_ctx.$t('app.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500 dark:text-gray-400 truncate" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    (__VLS_ctx.user?.email || '');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-1 ml-2 shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleDarkMode) },
        ...{ class: "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" },
        title: (__VLS_ctx.isDark ? __VLS_ctx.$t('app.light_mode') : __VLS_ctx.$t('app.dark_mode')),
    });
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    if (__VLS_ctx.isDark) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-5 h-5" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "12",
            r: "5",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
        });
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-5 h-5" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
        });
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleLang) },
        ...{ class: "p-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" },
        title: (__VLS_ctx.lang === 'fr' ? 'English' : 'Français'),
    });
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.lang === 'fr' ? 'EN' : 'FR');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.isAuthenticated))
                    return;
                if (!!(__VLS_ctx.memberLoading))
                    return;
                __VLS_ctx.mobileSidebarOpen = false;
                // @ts-ignore
                [isDark, isDark, isDark, isAuthenticated, memberLoading, mobileSidebarOpen, mobileSidebarOpen, $t, $t, $t, user, toggleDarkMode, toggleLang, lang, lang,];
            } },
        ...{ class: "lg:hidden p-1 text-gray-500 hover:text-gray-700 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-6 h-6" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "flex-1 p-2 space-y-0.5 overflow-y-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-0.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "px-1 pb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
    const __VLS_5 = GlobalSearch;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        to: "/",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_12 = __VLS_11({
        to: "/",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_15 } = __VLS_13.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.dashboard'));
    // @ts-ignore
    [$t,];
    var __VLS_13;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pt-2 pb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    (__VLS_ctx.$t('menu.section_planning'));
    let __VLS_16;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        to: "/calendar",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_18 = __VLS_17({
        to: "/calendar",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_21 } = __VLS_19.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.calendar'));
    // @ts-ignore
    [$t, $t,];
    var __VLS_19;
    let __VLS_22;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
        to: "/plans",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_24 = __VLS_23({
        to: "/plans",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_27 } = __VLS_25.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.services'));
    // @ts-ignore
    [$t,];
    var __VLS_25;
    let __VLS_28;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        to: "/plan-templates",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_30 = __VLS_29({
        to: "/plan-templates",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_33 } = __VLS_31.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.templates'));
    // @ts-ignore
    [$t,];
    var __VLS_31;
    let __VLS_34;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        to: "/checkin",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_36 = __VLS_35({
        to: "/checkin",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_39 } = __VLS_37.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.checkin'));
    // @ts-ignore
    [$t,];
    var __VLS_37;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        to: "/historique",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_42 = __VLS_41({
        to: "/historique",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_45 } = __VLS_43.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.history'));
    // @ts-ignore
    [$t,];
    var __VLS_43;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pt-2 pb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    (__VLS_ctx.$t('menu.section_people'));
    let __VLS_46;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        to: "/members",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_48 = __VLS_47({
        to: "/members",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_51 } = __VLS_49.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.members'));
    // @ts-ignore
    [$t, $t,];
    var __VLS_49;
    let __VLS_52;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        to: "/teams",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_54 = __VLS_53({
        to: "/teams",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_57 } = __VLS_55.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.teams'));
    // @ts-ignore
    [$t,];
    var __VLS_55;
    let __VLS_58;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        to: "/annuaire",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_60 = __VLS_59({
        to: "/annuaire",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_63 } = __VLS_61.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.directory'));
    // @ts-ignore
    [$t,];
    var __VLS_61;
    let __VLS_64;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        to: "/house-groups",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_66 = __VLS_65({
        to: "/house-groups",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_69 } = __VLS_67.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.groups'));
    // @ts-ignore
    [$t,];
    var __VLS_67;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pt-2 pb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    (__VLS_ctx.$t('menu.section_music'));
    let __VLS_70;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        to: "/songs",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_72 = __VLS_71({
        to: "/songs",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_75 } = __VLS_73.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.songs'));
    // @ts-ignore
    [$t, $t,];
    var __VLS_73;
    let __VLS_76;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
        to: "/music-stand",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_78 = __VLS_77({
        to: "/music-stand",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_81 } = __VLS_79.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.music_stand'));
    // @ts-ignore
    [$t,];
    var __VLS_79;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pt-2 pb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    (__VLS_ctx.$t('menu.section_communication'));
    let __VLS_82;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
        to: "/annonces",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_84 = __VLS_83({
        to: "/annonces",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_83));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_87 } = __VLS_85.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.announcements'));
    // @ts-ignore
    [$t, $t,];
    var __VLS_85;
    let __VLS_88;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
        to: "/events",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_90 = __VLS_89({
        to: "/events",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_93 } = __VLS_91.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.events'));
    // @ts-ignore
    [$t,];
    var __VLS_91;
    let __VLS_94;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
        to: "/email",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_96 = __VLS_95({
        to: "/email",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_95));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_99 } = __VLS_97.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.emails'));
    // @ts-ignore
    [$t,];
    var __VLS_97;
    let __VLS_100;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
        to: "/sondages",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_102 = __VLS_101({
        to: "/sondages",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_105 } = __VLS_103.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.polls'));
    // @ts-ignore
    [$t,];
    var __VLS_103;
    let __VLS_106;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
        to: "/youtube",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }));
    const __VLS_108 = __VLS_107({
        to: "/youtube",
        ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
        activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_107));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
    const { default: __VLS_111 } = __VLS_109.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.$t('menu.youtube'));
    // @ts-ignore
    [$t,];
    var __VLS_109;
    if (__VLS_ctx.isAdmin) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pt-2 pb-1" },
        });
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        (__VLS_ctx.$t('menu.section_admin'));
    }
    if (__VLS_ctx.isAdmin) {
        let __VLS_112;
        /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
        routerLink;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
            to: "/admin",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }));
        const __VLS_114 = __VLS_113({
            to: "/admin",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
        const { default: __VLS_117 } = __VLS_115.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t('menu.admin'));
        // @ts-ignore
        [$t, $t, isAdmin, isAdmin,];
        var __VLS_115;
    }
    if (__VLS_ctx.isAdmin) {
        let __VLS_118;
        /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
        routerLink;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
            to: "/webhooks",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }));
        const __VLS_120 = __VLS_119({
            to: "/webhooks",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
        const { default: __VLS_123 } = __VLS_121.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t('menu.webhooks'));
        // @ts-ignore
        [$t, isAdmin,];
        var __VLS_121;
    }
    if (__VLS_ctx.isScheduler) {
        let __VLS_124;
        /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
        routerLink;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
            to: "/conflicts",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }));
        const __VLS_126 = __VLS_125({
            to: "/conflicts",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
        const { default: __VLS_129 } = __VLS_127.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t('menu.conflicts'));
        // @ts-ignore
        [$t, isScheduler,];
        var __VLS_127;
    }
    if (__VLS_ctx.isAdmin) {
        let __VLS_130;
        /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
        routerLink;
        // @ts-ignore
        const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
            to: "/logs",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }));
        const __VLS_132 = __VLS_131({
            to: "/logs",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_131));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
        const { default: __VLS_135 } = __VLS_133.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t('menu.logs'));
        // @ts-ignore
        [$t, isAdmin,];
        var __VLS_133;
    }
    if (__VLS_ctx.isAdmin) {
        let __VLS_136;
        /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
        routerLink;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
            to: "/pco-sync",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }));
        const __VLS_138 = __VLS_137({
            to: "/pco-sync",
            ...{ class: "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400" },
            activeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-blue-400']} */ ;
        const { default: __VLS_141 } = __VLS_139.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.$t('menu.pco_sync'));
        // @ts-ignore
        [$t, isAdmin,];
        var __VLS_139;
    }
    if (__VLS_ctx.isAuthenticated) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "p-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5" },
        });
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-1.5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.logout) },
            ...{ class: "w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-colors" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-red-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-red-900/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-4 h-4" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
        });
        (__VLS_ctx.$t('app.logout'));
    }
    if (__VLS_ctx.mobileSidebarOpen) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.isAuthenticated))
                        return;
                    if (!!(__VLS_ctx.memberLoading))
                        return;
                    if (!(__VLS_ctx.mobileSidebarOpen))
                        return;
                    __VLS_ctx.mobileSidebarOpen = false;
                    // @ts-ignore
                    [isAuthenticated, mobileSidebarOpen, mobileSidebarOpen, $t, logout,];
                } },
            ...{ class: "fixed inset-0 bg-black/50 z-30 lg:hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-30']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "flex-1 overflow-auto flex flex-col" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "lg:hidden flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" },
    });
    /** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.isAuthenticated))
                    return;
                if (!!(__VLS_ctx.memberLoading))
                    return;
                __VLS_ctx.mobileSidebarOpen = true;
                // @ts-ignore
                [mobileSidebarOpen,];
            } },
        ...{ class: "p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-6 h-6" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M4 6h16M4 12h16M4 18h16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-lg font-bold text-gray-800 dark:text-gray-100" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
    (__VLS_ctx.$t('app.headline'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-6" },
    });
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    if (!__VLS_ctx.online) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-amber-500 text-white text-center py-1 text-sm font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-amber-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_ctx.$t('app.offline_mode'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex-1 overflow-auto p-4 lg:p-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:p-6']} */ ;
    let __VLS_142;
    /** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
    routerView;
    // @ts-ignore
    const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({}));
    const __VLS_144 = __VLS_143({}, ...__VLS_functionalComponentArgsRest(__VLS_143));
    const __VLS_147 = Toasts;
    // @ts-ignore
    const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({}));
    const __VLS_149 = __VLS_148({}, ...__VLS_functionalComponentArgsRest(__VLS_148));
    const __VLS_152 = ConfirmDialog;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({}));
    const __VLS_154 = __VLS_153({}, ...__VLS_functionalComponentArgsRest(__VLS_153));
}
// @ts-ignore
[$t, $t, online,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

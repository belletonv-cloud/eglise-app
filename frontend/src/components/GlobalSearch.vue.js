import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getApiBase } from '../utils/api';
const router = useRouter();
const { t } = useI18n();
const query = ref('');
const results = ref([]);
let timeout = null;
const search = () => {
    clearTimeout(timeout);
    if (query.value.length < 2) {
        results.value = [];
        return;
    }
    timeout = setTimeout(async () => {
        try {
            const base = getApiBase();
            const res = await fetch(`${base}/search?q=${encodeURIComponent(query.value)}`);
            const data = await res.json();
            results.value = data.results || [];
        }
        catch {
            results.value = [];
        }
    }, 300);
};
const iconFor = (type) => {
    const icons = { member: '👤', song: '🎵', plan: '📅', team: '🎪', announcement: '📢' };
    return icons[type] || '📌';
};
const labelFor = (r) => {
    if (r.type === 'member')
        return `${r.first_name} ${r.last_name}`;
    if (r.type === 'song')
        return r.title;
    if (r.type === 'plan')
        return `${r.service_type || t('plan.service')}${t('generic.separator')}${r.date}`;
    if (r.type === 'team')
        return r.name;
    if (r.type === 'announcement')
        return r.content?.slice(0, 80);
    return '';
};
const detailFor = (r) => {
    if (r.type === 'member')
        return r.email || r.phone || '';
    if (r.type === 'song')
        return r.author || '';
    if (r.type === 'plan')
        return r.theme || r.notes || '';
    if (r.type === 'team')
        return r.description || '';
    if (r.type === 'announcement')
        return r.type === 'prayer' ? `🙏 ${t('search.typePrayer')}` : `📢 ${t('plan.type.announcement')}`;
    return '';
};
const navigate = (r) => {
    results.value = [];
    query.value = '';
    if (r.type === 'member')
        router.push(`/members/${r.id}`);
    else if (r.type === 'song')
        router.push(`/song/${r.id}`);
    else if (r.type === 'plan')
        router.push(`/plans/${r.id}`);
    else if (r.type === 'team')
        router.push(`/teams/${r.id}`);
    else if (r.type === 'announcement')
        router.push('/annonces');
};
const goFirst = () => { if (results.value.length)
    navigate(results.value[0]); };
const close = () => { results.value = []; query.value = ''; };
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-gray-400" },
});
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onInput: (__VLS_ctx.search) },
    ...{ onKeydown: (__VLS_ctx.close) },
    ...{ onKeydown: (__VLS_ctx.goFirst) },
    placeholder: (__VLS_ctx.$t('search.placeholder')),
    ...{ class: "bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 w-full placeholder-gray-400" },
});
(__VLS_ctx.query);
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['border-none']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder-gray-400']} */ ;
if (__VLS_ctx.query.length >= 2 && __VLS_ctx.results.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['right-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    for (const [r] of __VLS_vFor((__VLS_ctx.results))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.query.length >= 2 && __VLS_ctx.results.length))
                        return;
                    __VLS_ctx.navigate(r);
                    // @ts-ignore
                    [search, close, goFirst, $t, query, query, results, results, navigate,];
                } },
            key: (r.type + r.id),
            ...{ class: "flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/20']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['last:border-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-lg" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        (__VLS_ctx.iconFor(r));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm font-medium text-gray-800 dark:text-gray-200 truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (__VLS_ctx.labelFor(r));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.detailFor(r));
        // @ts-ignore
        [iconFor, labelFor, detailFor,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

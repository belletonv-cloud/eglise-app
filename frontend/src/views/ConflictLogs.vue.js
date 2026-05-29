import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
const { t } = useI18n();
const rows = ref([]);
const plans = ref([]);
const planId = ref(null);
const memberQuery = ref('');
const page = ref(1);
const per = ref(25);
async function load() {
    const res = await api.getConflictLogs(planId.value || undefined, page.value, per.value, memberQuery.value || undefined);
    // server response: { rows, page, per }
    if (res.rows) {
        rows.value = res.rows;
        page.value = res.page || 1;
    }
    else {
        rows.value = res;
    }
}
onMounted(async () => {
    plans.value = await api.getPlans();
    await load();
});
watch([planId, memberQuery], () => { page.value = 1; load(); });
function prev() { if (page.value > 1) {
    page.value--;
    api.getConflictLogs(planId.value || undefined);
    load();
} }
function next() { page.value++; load(); }
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "text-2xl font-bold mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
(__VLS_ctx.$t('conflictlog.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-4 flex gap-3" },
});
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-sm text-gray-600 mr-2" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
(__VLS_ctx.$t('conflictlog.filter_plan'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.planId),
    ...{ class: "border px-2 py-1 rounded" },
});
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (null),
});
(__VLS_ctx.$t('conflictlog.all'));
for (const [p] of __VLS_vFor((__VLS_ctx.plans))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (p.id),
        value: (p.id),
    });
    (p.date);
    (p.theme || p.id);
    // @ts-ignore
    [$t, $t, $t, planId, plans,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-sm text-gray-600 mr-2" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
(__VLS_ctx.$t('conflictlog.filter_member'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: (__VLS_ctx.$t('conflictlog.placeholder_member')),
    ...{ class: "border px-2 py-1 rounded" },
});
(__VLS_ctx.memberQuery);
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "overflow-x-auto" },
});
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "w-full bg-white rounded shadow" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
    ...{ class: "text-left border-b" },
});
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.date'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.service'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.member'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.assignment'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.forced_by'));
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
    ...{ class: "p-2" },
});
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
(__VLS_ctx.$t('conflictlog.note'));
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [r] of __VLS_vFor((__VLS_ctx.rows))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (r.id),
        ...{ class: "border-b" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.created_at);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.plan_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.first_name);
    (r.last_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.existing_team_name || __VLS_ctx.$t('conflictlog.dash'));
    (__VLS_ctx.$t('conflictlog.scheduled'));
    (r.existing_scheduled_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.forced_by);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (r.note || __VLS_ctx.$t('conflictlog.dash'));
    // @ts-ignore
    [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, memberQuery, rows,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex items-center gap-3" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.prev) },
    ...{ class: "px-2 py-1 bg-gray-200 rounded" },
});
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
(__VLS_ctx.$t('conflictlog.prev'));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.$t('conflictlog.page'));
(__VLS_ctx.page);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.next) },
    ...{ class: "px-2 py-1 bg-gray-200 rounded" },
});
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
(__VLS_ctx.$t('conflictlog.next'));
// @ts-ignore
[$t, $t, $t, prev, page, next,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

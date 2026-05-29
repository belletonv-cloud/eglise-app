import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
const props = defineProps();
const emit = defineEmits();
const { t } = useI18n();
const items = ref([]);
const newLabel = ref('');
const newPosition = ref('');
const load = async () => {
    try {
        items.value = await api.getPlanChecklist(props.planId);
    }
    catch { /* ignore */ }
};
const addFromTemplate = async () => {
    if (!props.serviceTypeId)
        return;
    try {
        const templates = await api.getChecklistTemplates(props.serviceTypeId);
        for (const tpl of templates) {
            for (const ti of tpl.items || []) {
                await api.addPlanChecklistItem(props.planId, {
                    position: tpl.position,
                    label: ti.label,
                });
            }
        }
        await load();
    }
    catch { /* ignore */ }
};
const addCustom = async () => {
    if (!newLabel.value)
        return;
    try {
        await api.addPlanChecklistItem(props.planId, {
            position: newPosition.value || t('planChecklist.general'),
            label: newLabel.value,
        });
        newLabel.value = '';
        newPosition.value = '';
        await load();
    }
    catch { /* ignore */ }
};
const toggle = async (item) => {
    try {
        const updated = await api.updatePlanChecklist(item.id, { done: !item.done });
        Object.assign(item, updated);
    }
    catch { /* ignore */ }
};
const remove = async (item) => {
    try {
        await api.deletePlanChecklist(item.id);
        items.value = items.value.filter((i) => i.id !== item.id);
    }
    catch { /* ignore */ }
};
onMounted(load);
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4" },
});
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between mb-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "font-semibold text-gray-800 dark:text-gray-100" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
(__VLS_ctx.$t('planChecklist.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addFromTemplate) },
    ...{ class: "text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
(__VLS_ctx.$t('planChecklist.add_template'));
if (__VLS_ctx.items.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-4 text-sm text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    (__VLS_ctx.$t('planChecklist.no_items'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-1" },
});
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.items))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (item.id),
        ...{ class: "flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 group" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggle(item);
                // @ts-ignore
                [$t, $t, $t, addFromTemplate, items, items, toggle,];
            } },
        type: "checkbox",
        checked: (!!item.done),
        ...{ class: "rounded border-gray-300 dark:border-gray-600 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (item.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300') },
        ...{ class: "text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (item.label);
    if (item.position) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400 ml-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        (item.position);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(item);
                // @ts-ignore
                [remove,];
            } },
        ...{ class: "text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-3 flex gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onKeyup: (__VLS_ctx.addCustom) },
    placeholder: (__VLS_ctx.$t('planChecklist.new_task')),
    ...{ class: "flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
});
(__VLS_ctx.newLabel);
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: (__VLS_ctx.$t('planChecklist.position')),
    ...{ class: "w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
});
(__VLS_ctx.newPosition);
/** @type {__VLS_StyleScopedClasses['w-20']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addCustom) },
    ...{ class: "px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
// @ts-ignore
[$t, $t, addCustom, addCustom, newLabel, newPosition,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};

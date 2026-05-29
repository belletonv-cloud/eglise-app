import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { useToast } from '../stores/toast';
const props = defineProps();
const { t } = useI18n();
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const form = ref({ max_services_per_month: 4, notes: '', unavailable_dates: [] });
async function load() {
    try {
        const prefs = await api.getVolunteerPreferences(props.memberId);
        form.value = {
            max_services_per_month: prefs.max_services_per_month || 4,
            notes: prefs.notes || '',
            unavailable_dates: JSON.parse(prefs.unavailable_dates || '[]'),
        };
    }
    catch {
        // Use defaults
    }
    finally {
        loading.value = false;
    }
}
async function save() {
    saving.value = true;
    saved.value = false;
    try {
        await api.updateVolunteerPreferences(props.memberId, {
            max_services_per_month: form.value.max_services_per_month,
            notes: form.value.notes,
            unavailable_dates: JSON.stringify(form.value.unavailable_dates.filter(d => d.trim())),
        });
        saved.value = true;
        setTimeout(() => saved.value = false, 2000);
    }
    catch (e) {
        useToast().show(e.message || t('volunteerPreferences.error'), 'error');
    }
    finally {
        saving.value = false;
    }
}
onMounted(load);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('volunteerPreferences.title') || 'Disponibilités');
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-gray-500 py-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    (__VLS_ctx.$t('volunteerPreferences.loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    (__VLS_ctx.$t('volunteerPreferences.max_services'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "1",
        max: "31",
        ...{ class: "w-full border border-gray-300 rounded-lg px-3 py-2" },
    });
    (__VLS_ctx.form.max_services_per_month);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    (__VLS_ctx.$t('volunteerPreferences.notes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.notes),
        rows: "3",
        ...{ class: "w-full border border-gray-300 rounded-lg px-3 py-2" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    (__VLS_ctx.$t('volunteerPreferences.unavailable'));
    for (const [d, i] of __VLS_vFor((__VLS_ctx.form.unavailable_dates))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-2 mb-2" },
            key: (i),
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "date",
            ...{ class: "flex-1 border border-gray-300 rounded-lg px-3 py-2" },
        });
        (__VLS_ctx.form.unavailable_dates[i]);
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.form.unavailable_dates.splice(i, 1);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, loading, form, form, form, form, form,];
                } },
            ...{ class: "px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (__VLS_ctx.$t('volunteerPreferences.remove_date'));
        // @ts-ignore
        [$t,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.form.unavailable_dates.push('');
                // @ts-ignore
                [form,];
            } },
        ...{ class: "text-sm text-blue-600 hover:text-blue-800 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('volunteerPreferences.add_date'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.save) },
        disabled: (__VLS_ctx.saving),
        ...{ class: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.saving ? __VLS_ctx.$t('volunteerPreferences.saving') : __VLS_ctx.$t('volunteerPreferences.save'));
    if (__VLS_ctx.saved) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ml-3 text-green-600 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (__VLS_ctx.$t('volunteerPreferences.saved'));
    }
}
// @ts-ignore
[$t, $t, $t, $t, save, saving, saving, saved,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};

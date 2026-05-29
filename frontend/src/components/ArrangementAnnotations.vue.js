import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { user } from '../stores/auth';
import { showToast } from '../stores/toast';
const { t } = useI18n();
const props = defineProps();
const annotations = ref([]);
const editing = ref(null);
const form = ref({ content: '', is_shared: false });
const currentMemberId = computed(() => user.value?.member_id);
function formatDate(d) {
    if (!d)
        return '';
    // On pourrait rendre ça localisable si nécessaire (clé i18n)
    return new Date(d).toLocaleDateString(t('langCode') || 'fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}
async function loadAnnotations() {
    if (!props.arrangementId)
        return;
    try {
        annotations.value = await api.getArrangementAnnotations(props.arrangementId);
    }
    catch {
        annotations.value = [];
    }
}
function startNew() {
    editing.value = 'new';
    form.value = { content: '', is_shared: false };
}
function editAnnotation(ann) {
    editing.value = ann.id;
    form.value = { content: ann.content, is_shared: !!ann.is_shared };
}
function cancelEdit() {
    editing.value = null;
    form.value = { content: '', is_shared: false };
}
async function saveAnnotation() {
    if (!form.value.content.trim())
        return;
    try {
        if (editing.value === 'new') {
            await api.createAnnotation(props.arrangementId, {
                content: form.value.content,
                is_shared: form.value.is_shared,
            });
        }
        else if (typeof editing.value === 'number') {
            await api.updateAnnotation(editing.value, {
                content: form.value.content,
                is_shared: form.value.is_shared,
            });
        }
        editing.value = null;
        form.value = { content: '', is_shared: false };
        await loadAnnotations();
    }
    catch (e) {
        showToast(t('arrangementAnnotation.error', { msg: e.message }), 'error');
    }
}
async function removeAnnotation(id) {
    if (!confirm(t('arrangementAnnotation.confirm_delete')))
        return;
    try {
        await api.deleteAnnotation(id);
        annotations.value = annotations.value.filter(a => a.id !== id);
    }
    catch (e) {
        showToast(t('arrangementAnnotation.error', { msg: e.message }), 'error');
    }
}
onMounted(loadAnnotations);
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
    ...{ class: "annotations-panel" },
});
/** @type {__VLS_StyleScopedClasses['annotations-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
(__VLS_ctx.$t('arrangementAnnotation.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-sm font-normal text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
(__VLS_ctx.$t('arrangementAnnotation.count', { count: __VLS_ctx.annotations.length }));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-3 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
for (const [ann] of __VLS_vFor((__VLS_ctx.annotations))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (ann.id),
        ...{ class: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-start justify-between gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm font-medium text-gray-700 dark:text-gray-300" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    (ann.first_name);
    (ann.last_name);
    if (ann.is_shared) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-blue-500 ml-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        (__VLS_ctx.$t('arrangementAnnotation.shared'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400 ml-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        (__VLS_ctx.$t('arrangementAnnotation.private'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
    (ann.content);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-xs text-gray-400 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    (__VLS_ctx.formatDate(ann.created_at));
    if (ann.member_id === __VLS_ctx.currentMemberId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-1 shrink-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(ann.member_id === __VLS_ctx.currentMemberId))
                        return;
                    __VLS_ctx.editAnnotation(ann);
                    // @ts-ignore
                    [$t, $t, $t, $t, annotations, annotations, formatDate, currentMemberId, editAnnotation,];
                } },
            ...{ class: "p-1 text-gray-400 hover:text-blue-500 cursor-pointer" },
            title: (__VLS_ctx.$t('arrangementAnnotation.edit')),
        });
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(ann.member_id === __VLS_ctx.currentMemberId))
                        return;
                    __VLS_ctx.removeAnnotation(ann.id);
                    // @ts-ignore
                    [$t, removeAnnotation,];
                } },
            ...{ class: "p-1 text-gray-400 hover:text-red-500 cursor-pointer" },
            title: (__VLS_ctx.$t('arrangementAnnotation.delete')),
        });
        /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-red-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    }
    // @ts-ignore
    [$t,];
}
if (__VLS_ctx.editing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800/50']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.form.content),
        rows: "3",
        placeholder: (__VLS_ctx.$t('arrangementAnnotation.add_placeholder')),
        ...{ class: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between mt-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.form.is_shared);
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    (__VLS_ctx.$t('arrangementAnnotation.shared_label'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelEdit) },
        ...{ class: "px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('arrangementAnnotation.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveAnnotation) },
        disabled: (!__VLS_ctx.form.content.trim()),
        ...{ class: "px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.editing === 'new' ? __VLS_ctx.$t('arrangementAnnotation.add') : __VLS_ctx.$t('arrangementAnnotation.save'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.startNew) },
        ...{ class: "text-sm text-blue-600 hover:text-blue-700 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('arrangementAnnotation.add_button'));
}
// @ts-ignore
[$t, $t, $t, $t, $t, $t, editing, editing, form, form, form, cancelEdit, saveAnnotation, startNew,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};

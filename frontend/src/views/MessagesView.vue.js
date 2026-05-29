import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { showToast } from '../stores/toast';
const { t } = useI18n();
const inbox = ref([]);
const selected = ref(null);
const form = ref({ subject: '', content: '' });
const members = ref([]);
const searchQuery = ref('');
const showPicker = ref(false);
const selectedMemberIds = ref([]);
const filteredMembers = computed(() => {
    if (!searchQuery.value)
        return members.value;
    const q = searchQuery.value.toLowerCase();
    return members.value.filter(m => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q));
});
const selectedMembers = computed(() => members.value.filter(m => selectedMemberIds.value.includes(m.id)));
function toggleMember(m) {
    const idx = selectedMemberIds.value.indexOf(m.id);
    if (idx === -1) {
        selectedMemberIds.value.push(m.id);
    }
    else {
        selectedMemberIds.value.splice(idx, 1);
    }
}
async function loadInbox() {
    inbox.value = await api.getInbox().catch(() => []);
}
async function loadMembers() {
    members.value = await api.getMembers().catch(() => []);
}
async function select(m) {
    selected.value = await api.getMessage(m.id).catch(() => m);
    await api.markMessageRead(m.id).catch(() => { });
}
async function send() {
    if (selectedMemberIds.value.length === 0)
        return;
    try {
        await api.sendMessage({
            subject: form.value.subject,
            content: form.value.content,
            recipients: selectedMemberIds.value,
        });
        form.value.subject = '';
        form.value.content = '';
        selectedMemberIds.value = [];
        searchQuery.value = '';
        await loadInbox();
    }
    catch (e) {
        showToast(e.message || 'Error', 'error');
    }
}
// Close picker when clicking outside
function handleClickOutside(e) {
    const target = e.target;
    if (!target.closest('.member-picker-area')) {
        showPicker.value = false;
    }
}
onMounted(async () => {
    await Promise.all([loadInbox(), loadMembers()]);
    document.addEventListener('click', handleClickOutside);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "p-4" },
});
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-xl font-semibold mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
(__VLS_ctx.$t('messages.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col lg:flex-row gap-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-full lg:w-1/3" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:w-1/3']} */ ;
for (const [msg] of __VLS_vFor((__VLS_ctx.inbox))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.select(msg);
                // @ts-ignore
                [$t, inbox, select,];
            } },
        key: (msg.id),
        ...{ class: "p-2 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (msg.subject || __VLS_ctx.$t('messages.no_subject'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-gray-600 dark:text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    (__VLS_ctx.$t('messages.from'));
    (msg.sender_first);
    (msg.sender_last);
    (msg.created_at);
    // @ts-ignore
    [$t, $t,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex-1" },
});
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-lg font-semibold" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    (__VLS_ctx.selected.subject || __VLS_ctx.$t('messages.no_subject'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-gray-600 dark:text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    (__VLS_ctx.$t('messages.from'));
    (__VLS_ctx.selected.sender_first);
    (__VLS_ctx.selected.sender_last);
    (__VLS_ctx.selected.created_at);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 whitespace-pre-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
    (__VLS_ctx.selected.content);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.$t('messages.select_prompt'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.hr)({
    ...{ class: "my-4" },
});
/** @type {__VLS_StyleScopedClasses['my-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "font-semibold mb-2" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
(__VLS_ctx.$t('messages.new'));
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.send) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: (__VLS_ctx.$t('messages.subject')),
    ...{ class: "w-full p-2 border mb-2 rounded dark:bg-gray-800 dark:border-gray-600" },
});
(__VLS_ctx.form.subject);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    value: (__VLS_ctx.form.content),
    placeholder: (__VLS_ctx.$t('messages.content')),
    ...{ class: "w-full p-2 border mb-2 rounded dark:bg-gray-800 dark:border-gray-600" },
    rows: "6",
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-2" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
(__VLS_ctx.$t('messages.recipients'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onFocus: (...[$event]) => {
            __VLS_ctx.showPicker = true;
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, selected, selected, selected, selected, selected, selected, send, form, form, showPicker,];
        } },
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: (__VLS_ctx.$t('search.placeholder')),
    ...{ class: "w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:border-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
if (__VLS_ctx.showPicker) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border rounded max-h-48 overflow-y-auto bg-white dark:bg-gray-800 dark:border-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-48']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    for (const [m] of __VLS_vFor((__VLS_ctx.filteredMembers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showPicker))
                        return;
                    __VLS_ctx.toggleMember(m);
                    // @ts-ignore
                    [$t, showPicker, searchQuery, filteredMembers, toggleMember,];
                } },
            key: (m.id),
            ...{ class: "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            checked: (__VLS_ctx.selectedMemberIds.includes(m.id)),
            ...{ class: "rounded" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (m.first_name);
        (m.last_name);
        if (m.email) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-gray-400 ml-auto" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
            (m.email);
        }
        // @ts-ignore
        [selectedMemberIds,];
    }
    if (__VLS_ctx.filteredMembers.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "p-2 text-sm text-gray-400 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.$t('members.no_members'));
    }
}
if (__VLS_ctx.selectedMembers.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex flex-wrap gap-1 mt-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    for (const [m] of __VLS_vFor((__VLS_ctx.selectedMembers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            key: (m.id),
            ...{ class: "inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full" },
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:bg-indigo-900']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-indigo-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        (m.first_name);
        (m.last_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedMembers.length > 0))
                        return;
                    __VLS_ctx.toggleMember(m);
                    // @ts-ignore
                    [$t, filteredMembers, toggleMember, selectedMembers, selectedMembers,];
                } },
            type: "button",
            ...{ class: "ml-1 hover:text-indigo-900 dark:hover:text-indigo-100" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-indigo-900']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:hover:text-indigo-100']} */ ;
        // @ts-ignore
        [];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ class: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
(__VLS_ctx.$t('messages.send'));
// @ts-ignore
[$t,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

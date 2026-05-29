import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api, getApiBase } from '../utils/api';
import { confirmDialog } from '../stores/confirm';
import { showToast } from '../stores/toast';
import SchedulePeople from '../components/SchedulePeople.vue';
import AttendanceSection from '../components/AttendanceSection.vue';
import PlanChecklist from '../components/PlanChecklist.vue';
import SermonAudio from '../components/SermonAudio.vue';
const apiBase = getApiBase();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const plan = ref(null);
const items = ref([]);
const loading = ref(true);
const error = ref('');
const showEditForm = ref(false);
const showSongSelector = ref(false);
const showChangeSong = ref(false);
const changingItemId = ref(null);
const songItems = computed(() => items.value.filter(i => i.type === 'song' && i.arrangement_id));
function openMusicStand() {
    const first = songItems.value[0];
    if (first) {
        router.push(`/music-stand/${first.song_id}/${first.arrangement_id}?plan=${plan.value?.id}`);
    }
}
const statusClass = (s) => s === 'completed' ? 'bg-green-100 text-green-700' :
    s === 'cancelled' ? 'bg-red-100 text-red-700' :
        'bg-blue-100 text-blue-700';
const statusLabel = (s) => t('plan.status.' + (s || 'planned'));
const typeLabel = (type) => t('plan.type.' + (type || 'unknown'));
const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const loadData = async () => {
    const id = parseInt(route.params.id);
    try {
        const [planData, itemData] = await Promise.all([
            api.getPlan(id),
            api.getPlanItems(id),
        ]);
        plan.value = planData;
        items.value = itemData;
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
};
const deletePlan = async () => {
    if (!await confirmDialog(t('plan.confirm_delete')))
        return;
    try {
        await api.deletePlan(plan.value.id);
        router.push('/calendar');
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const onEditSaved = () => {
    showEditForm.value = false;
    loadData();
};
const addItem = async (type) => {
    const titles = { header: t('plan.type.new_header'), announcement: t('plan.type.announcement'), media: t('plan.type.media') };
    try {
        const item = await api.createPlanItem(plan.value.id, {
            type,
            title: titles[type] || t('plan.type.new_item'),
        });
        items.value.push({ ...item, song_title: null, arrangement_name: null, transposed_key: null });
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const deleteItem = async (item) => {
    if (!await confirmDialog(t('plan.confirm_item_delete')))
        return;
    try {
        await api.deletePlanItem(item.id);
        items.value = items.value.filter((i) => i.id !== item.id);
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const moveItem = async (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.value.length)
        return;
    const a = items.value[idx];
    const b = items.value[newIdx];
    items.value[idx] = b;
    items.value[newIdx] = a;
    try {
        await Promise.all([
            api.updatePlanItem(a.id, { position: newIdx + 1 }),
            api.updatePlanItem(b.id, { position: idx + 1 }),
        ]);
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const onSongSelect = async (songId, arrangementId, transposedKey) => {
    showSongSelector.value = false;
    try {
        const item = await api.createPlanItem(plan.value.id, {
            type: 'song',
            title: t('plan.type.song'),
            arrangement_id: arrangementId,
            transposed_key: transposedKey,
        });
        const song = await api.getSong(songId);
        items.value.push({
            ...item,
            song_title: song.title,
            arrangement_name: song.arrangements?.find((a) => a.id === arrangementId)?.name || null,
            transposed_key: transposedKey,
        });
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const changeSong = (item) => {
    changingItemId.value = item.id;
    showChangeSong.value = true;
};
const onSongChange = async (songId, arrangementId, transposedKey) => {
    showChangeSong.value = false;
    const song = await api.getSong(songId);
    try {
        await api.updatePlanItem(changingItemId.value, {
            arrangement_id: arrangementId,
            transposed_key: transposedKey,
            title: song.title,
        });
        changingItemId.value = null;
        loadData();
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
const dragIndex = ref(null);
const onDragStart = (idx) => { dragIndex.value = idx; };
const onDragOver = (idx) => { };
const onDrop = async (idx) => {
    if (dragIndex.value === null || dragIndex.value === idx) {
        dragIndex.value = null;
        return;
    }
    const from = dragIndex.value;
    const to = idx;
    dragIndex.value = null;
    const [moved] = items.value.splice(from, 1);
    items.value.splice(to, 0, moved);
    try {
        const updates = items.value.map((item, i) => api.updatePlanItem(item.id, { position: i + 1 }));
        await Promise.all(updates);
    }
    catch (e) {
        showToast(e.message || t('plan.error'), 'error');
    }
};
onMounted(loadData);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12 text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.t('plan.loading'));
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-red-50 text-red-700 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    (__VLS_ctx.error);
}
else if (__VLS_ctx.plan) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2 mb-6 flex-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.$router.push('/calendar');
                // @ts-ignore
                [loading, t, error, error, plan, $router,];
            } },
        ...{ class: "px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.t('plan.back'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "flex-1 min-w-0" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.$router.push(`/plans/${__VLS_ctx.plan.id}/setlist`);
                // @ts-ignore
                [t, plan, $router,];
            } },
        ...{ class: "px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.t('plan.musician_view'));
    if (__VLS_ctx.songItems.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.openMusicStand) },
            ...{ class: "px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer shrink-0" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-purple-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
        href: (`${__VLS_ctx.apiBase}/plans/${__VLS_ctx.plan.id}/ical`),
        target: "_blank",
        ...{ class: "px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.t('plan.ical'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.showEditForm = true;
                // @ts-ignore
                [t, t, plan, songItems, openMusicStand, apiBase, showEditForm,];
            } },
        ...{ class: "px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.t('plan.edit'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.deletePlan) },
        ...{ class: "px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer shrink-0" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (__VLS_ctx.t('plan.delete'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-start justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-2xl font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.plan.date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-500 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    (__VLS_ctx.plan.service_type_name || __VLS_ctx.t('plan.service'));
    if (__VLS_ctx.plan.time) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.plan.time?.slice(0, 5));
    }
    if (__VLS_ctx.plan.theme) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-700 mt-2 italic" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['italic']} */ ;
        (__VLS_ctx.plan.theme);
    }
    if (__VLS_ctx.plan.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600 mt-2 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (__VLS_ctx.plan.notes);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: (__VLS_ctx.statusClass(__VLS_ctx.plan.status)) },
        ...{ class: "px-3 py-1 rounded-full text-sm font-medium" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    (__VLS_ctx.statusLabel(__VLS_ctx.plan.status));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-white rounded-xl shadow-sm border border-gray-200 p-6" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.t('plan.order'));
    (__VLS_ctx.items.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.showSongSelector = true;
                // @ts-ignore
                [t, t, t, t, plan, plan, plan, plan, plan, plan, plan, plan, plan, plan, deletePlan, formatDate, statusClass, statusLabel, items, showSongSelector,];
            } },
        ...{ class: "px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.t('plan.add_song'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.addItem('header');
                // @ts-ignore
                [t, addItem,];
            } },
        ...{ class: "px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.t('plan.add_header'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.addItem('announcement');
                // @ts-ignore
                [t, addItem,];
            } },
        ...{ class: "px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.t('plan.add_announcement'));
    if (__VLS_ctx.items.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-8 text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.t('plan.no_items'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    for (const [item, idx] of __VLS_vFor((__VLS_ctx.items))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onDragstart: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.onDragStart(idx);
                    // @ts-ignore
                    [t, t, items, items, onDragStart,];
                } },
            ...{ onDragover: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.onDragOver(idx);
                    // @ts-ignore
                    [onDragOver,];
                } },
            ...{ onDragenter: () => { } },
            ...{ onDrop: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.onDrop(idx);
                    // @ts-ignore
                    [onDrop,];
                } },
            key: (item.id),
            draggable: "true",
            ...{ class: ({ 'border-blue-400': __VLS_ctx.dragIndex === idx }) },
            ...{ class: "flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 group transition-colors" },
        });
        /** @type {__VLS_StyleScopedClasses['border-blue-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['group']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col items-center gap-0.5 pt-1" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.moveItem(idx, -1);
                    // @ts-ignore
                    [dragIndex, moveItem,];
                } },
            disabled: (idx === 0),
            ...{ class: "text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-30']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.moveItem(idx, 1);
                    // @ts-ignore
                    [moveItem,];
                } },
            disabled: (idx === __VLS_ctx.items.length - 1),
            ...{ class: "text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-30']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-start justify-between" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs font-medium text-gray-400 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        (__VLS_ctx.typeLabel(item.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (item.title);
        if (item.song_title) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-sm text-indigo-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
            (item.song_title);
        }
        if (item.description) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-sm text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (item.description);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.plan))
                        return;
                    __VLS_ctx.deleteItem(item);
                    // @ts-ignore
                    [items, typeLabel, deleteItem,];
                } },
            ...{ class: "text-red-400 hover:text-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        if (item.type === 'song') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.plan))
                            return;
                        if (!(item.type === 'song'))
                            return;
                        __VLS_ctx.changeSong(item);
                        // @ts-ignore
                        [changeSong,];
                    } },
                ...{ class: "text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            (item.arrangement_name ? __VLS_ctx.t('plan.type.change_song') : __VLS_ctx.t('plan.type.link_song'));
            if (item.transposed_key) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-gray-400 ml-2" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                (__VLS_ctx.t('plan.type.transposed'));
                (item.transposed_key);
            }
        }
        // @ts-ignore
        [t, t, t,];
    }
    const __VLS_0 = SchedulePeople;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onChanged': {} },
        planId: (__VLS_ctx.plan.id),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onChanged': {} },
        planId: (__VLS_ctx.plan.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ changed: {} },
        { onChanged: (__VLS_ctx.loadData) });
    var __VLS_3;
    var __VLS_4;
    const __VLS_7 = AttendanceSection;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onChanged': {} },
        planId: (__VLS_ctx.plan.id),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onChanged': {} },
        planId: (__VLS_ctx.plan.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ changed: {} },
        { onChanged: (__VLS_ctx.loadData) });
    var __VLS_10;
    var __VLS_11;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    const __VLS_14 = PlanChecklist;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        planId: (__VLS_ctx.plan.id),
        serviceTypeId: (__VLS_ctx.plan.service_type_id),
    }));
    const __VLS_16 = __VLS_15({
        planId: (__VLS_ctx.plan.id),
        serviceTypeId: (__VLS_ctx.plan.service_type_id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    const __VLS_19 = SermonAudio;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        planId: (__VLS_ctx.plan.id),
    }));
    const __VLS_21 = __VLS_20({
        planId: (__VLS_ctx.plan.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
// @ts-ignore
[plan, plan, plan, plan, plan, loadData, loadData,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../utils/api';
const emit = defineEmits();
const search = ref('');
const songs = ref([]);
const loading = ref(true);
const selected = ref(null);
const selectedArrangementId = ref(null);
const transposedKey = ref('');
const selectedArrangementHasChart = ref(true);
const filteredSongs = computed(() => {
    const q = search.value.toLowerCase();
    return songs.value.filter(s => !q || s.title.toLowerCase().includes(q) || (s.author && s.author.toLowerCase().includes(q)));
});
const selectSong = async (song) => {
    if (selected.value?.id === song.id) {
        selected.value = null;
        selectedArrangementId.value = null;
        return;
    }
    if (!song.arrangements) {
        const full = await api.getSong(song.id);
        song.arrangements = full.arrangements;
    }
    selected.value = song;
    selectedArrangementId.value = song.arrangements?.[0]?.id || null;
    transposedKey.value = '';
    // Update whether the selected arrangement has a chord chart
    const firstArr = song.arrangements?.[0];
    selectedArrangementHasChart.value = !!(firstArr && firstArr.chord_chart);
};
const confirm = () => {
    if (!selected.value || !selectedArrangementId.value)
        return;
    emit('select', selected.value.id, selectedArrangementId.value, transposedKey.value || null);
};
// Watch for arrangement changes to update the alert
watch(selectedArrangementId, async (val) => {
    if (!val || !selected.value) {
        selectedArrangementHasChart.value = true;
        return;
    }
    const arr = selected.value.arrangements?.find((a) => a.id === val);
    if (arr) {
        selectedArrangementHasChart.value = !!arr.chord_chart;
        return;
    }
    // If arrangement data not present inline, fetch full song and check
    try {
        const full = await api.getSong(selected.value.id);
        const a = full.arrangements?.find((x) => x.id === val);
        selectedArrangementHasChart.value = !!a?.chord_chart;
    }
    catch {
        selectedArrangementHasChart.value = true;
    }
});
onMounted(async () => {
    try {
        songs.value = await api.getSongs();
    }
    catch {
        console.warn('PlanSongSelector getSongs failed');
    }
    loading.value = false;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "fixed inset-0 bg-black/50 flex items-center justify-center z-50" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bg-white rounded-xl p-6 w-full max-w-xl shadow-xl max-h-[80vh] flex flex-col" },
});
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-[80vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-xl font-bold mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "Rechercher un chant...",
    ...{ class: "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4" },
});
(__VLS_ctx.search);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-8 text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex-1 overflow-y-auto space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    for (const [song] of __VLS_vFor((__VLS_ctx.filteredSongs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.selectSong(song);
                    // @ts-ignore
                    [search, loading, filteredSongs, selectSong,];
                } },
            key: (song.id),
            ...{ class: "p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors" },
            ...{ class: ({ 'border-blue-400 bg-blue-50': __VLS_ctx.selected?.id === song.id }) },
        });
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-blue-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (song.title);
        if (song.author) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-sm text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (song.author);
        }
        if (__VLS_ctx.selected?.id === song.id && song.arrangements?.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "text-sm font-medium text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.selectedArrangementId),
                ...{ class: "w-full border border-gray-300 rounded-lg px-2 py-1 mt-1 text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (null),
            });
            for (const [a] of __VLS_vFor((song.arrangements))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (a.id),
                    value: (a.id),
                });
                (a.name);
                (a.key ? '(' + a.key + ')' : '');
                // @ts-ignore
                [selected, selected, selectedArrangementId,];
            }
            if (__VLS_ctx.selectedArrangementId && !__VLS_ctx.selectedArrangementHasChart) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-yellow-50']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-yellow-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-yellow-800']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            }
            if (__VLS_ctx.selectedArrangementId) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mt-1" },
                });
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                    ...{ class: "text-sm font-medium text-gray-600" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    placeholder: "Ex: C, Dm, G...",
                    ...{ class: "w-full border border-gray-300 rounded-lg px-2 py-1 mt-1 text-sm" },
                });
                (__VLS_ctx.transposedKey);
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            }
        }
        // @ts-ignore
        [selectedArrangementId, selectedArrangementId, selectedArrangementHasChart, transposedKey,];
    }
    if (__VLS_ctx.filteredSongs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-8 text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex gap-3 justify-end pt-4 border-t mt-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit, filteredSongs,];
        } },
    ...{ class: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.confirm) },
    disabled: (!__VLS_ctx.selected || !__VLS_ctx.selectedArrangementId),
    ...{ class: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" },
});
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
// @ts-ignore
[selected, selectedArrangementId, confirm,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
});
export default {};

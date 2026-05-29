import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api, getApiBase } from '../utils/api';
import { showToast } from '../stores/toast';
const props = defineProps();
const { t } = useI18n();
const apiBase = getApiBase();
const audio = ref(null);
const audioTitle = ref('');
const fileInput = ref(null);
const segmentsData = ref(null);
const processing = ref(false);
const progressPercent = ref(0);
const estimatedTime = ref('');
const processingStatus = ref('');
let progressTimer = null;
const typeLabels = {
    introduction: t('sermonAudio.type_introduction'),
    louange: t('sermonAudio.type_louange'),
    prédication: t('sermonAudio.type_predication'),
    'sainte-cène': t('sermonAudio.type_sainte_cene'),
    transition: t('sermonAudio.type_transition'),
};
const typeColors = {
    introduction: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    louange: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    prédication: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'sainte-cène': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    transition: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};
function typeLabel(type) {
    return typeLabels[type] || type;
}
function typeClass(type) {
    return typeColors[type] || typeColors.transition;
}
function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
const getAttachmentUrl = (att) => {
    if (att.file_url?.startsWith('kdrive:')) {
        return `${apiBase}/attachments/${att.id}/file`;
    }
    return att.file_url || '';
};
const loadSegments = async () => {
    try {
        segmentsData.value = await api.getAudioSegments(props.planId);
    }
    catch { /* not processed yet */ }
};
const load = async () => {
    try {
        audio.value = await api.getPlanAudio(props.planId);
    }
    catch { /* ignore */ }
    await loadSegments();
};
function estimateProcessingTime(file) {
    const sizeMb = file.size / (1024 * 1024);
    const minutes = Math.max(1, Math.round(sizeMb * 1.5));
    if (minutes < 60)
        return `${minutes} minutes`;
    return `${Math.floor(minutes / 60)}h${minutes % 60}min`;
}
const upload = async () => {
    const file = fileInput.value?.files?.[0];
    if (!file)
        return;
    processing.value = true;
    processingStatus.value = t('sermonAudio.uploading');
    estimatedTime.value = estimateProcessingTime(file);
    progressPercent.value = 10;
    if (progressTimer)
        clearInterval(progressTimer);
    progressTimer = setInterval(() => {
        progressPercent.value = Math.min(90, progressPercent.value + 2);
    }, 3000);
    try {
        processingStatus.value = t('sermonAudio.processing');
        const result = await api.uploadPlanAudio(props.planId, file, audioTitle.value || t('sermonAudio.upload_title'));
        progressPercent.value = 95;
        audioTitle.value = '';
        if (fileInput.value)
            fileInput.value.value = '';
        await load();
        if (result?.audio_splitter?.segments != null) {
            progressPercent.value = 100;
        }
    }
    catch (e) {
        showToast(t('sermonAudio.upload_error') + e.message, 'error');
    }
    finally {
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
        setTimeout(() => { processing.value = false; progressPercent.value = 0; }, 1500);
    }
};
const deleteAudio = async (id) => {
    try {
        await api.deleteAttachment(id);
        await load();
    }
    catch { /* ignore */ }
};
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
(__VLS_ctx.$t('sermonAudio.title'));
if (__VLS_ctx.audio) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    if (__VLS_ctx.audio.audio_title) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-medium text-gray-700 dark:text-gray-300" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
        (__VLS_ctx.audio.audio_title);
    }
    if (__VLS_ctx.audio.audio_duration_seconds) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.fmtTime(__VLS_ctx.audio.audio_duration_seconds));
    }
    if (__VLS_ctx.audio.audio_url) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.audio)({
            src: (`${__VLS_ctx.apiBase}/plans/${props.planId}/audio/stream`),
            controls: true,
            ...{ class: "w-full" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    }
    for (const [att] of __VLS_vFor((__VLS_ctx.audio.attachments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (att.id),
            ...{ class: "flex items-center justify-between py-1" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-sm text-gray-600 dark:text-gray-400 truncate block" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        (att.filename);
        if (att.file_type === 'audio') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.audio)({
                src: (__VLS_ctx.getAttachmentUrl(att)),
                controls: true,
                ...{ class: "w-full mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.audio))
                        return;
                    __VLS_ctx.deleteAudio(att.id);
                    // @ts-ignore
                    [$t, audio, audio, audio, audio, audio, audio, audio, fmtTime, apiBase, getAttachmentUrl, deleteAudio,];
                } },
            ...{ class: "text-red-400 hover:text-red-600 text-xs cursor-pointer ml-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        (__VLS_ctx.$t('sermonAudio.delete'));
        // @ts-ignore
        [$t,];
    }
}
if (!__VLS_ctx.audio) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-4 text-sm text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    (__VLS_ctx.$t('sermonAudio.no_recording'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-3" },
});
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: (__VLS_ctx.$t('sermonAudio.placeholder')),
    ...{ class: "w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
});
(__VLS_ctx.audioTitle);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
if (__VLS_ctx.processing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2 text-sm text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "animate-spin h-4 w-4" },
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        ...{ class: "opacity-25" },
        cx: "12",
        cy: "12",
        r: "10",
        stroke: "currentColor",
        'stroke-width': "4",
        fill: "none",
    });
    /** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        ...{ class: "opacity-75" },
        fill: "currentColor",
        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
    });
    /** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.processingStatus);
    if (__VLS_ctx.estimatedTime) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-xs text-gray-400 pl-6" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['pl-6']} */ ;
        (__VLS_ctx.$t('sermonAudio.estimated'));
        (__VLS_ctx.estimatedTime);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-full bg-gray-200 rounded-full h-1.5" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-600 h-1.5 rounded-full transition-all" },
        ...{ style: ({ width: __VLS_ctx.progressPercent + '%' }) },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.upload) },
    ref: "fileInput",
    type: "file",
    accept: "audio/*",
    disabled: (__VLS_ctx.processing),
    ...{ class: "block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['file:mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['file:py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['file:px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['file:rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['file:border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['file:text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['file:bg-blue-50']} */ ;
/** @type {__VLS_StyleScopedClasses['file:text-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:file:bg-blue-100']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
if (__VLS_ctx.segmentsData) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 border-t border-gray-200 dark:border-gray-700 pt-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
        ...{ class: "font-medium text-sm text-gray-700 dark:text-gray-300" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    (__VLS_ctx.$t('sermonAudio.segments'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    if (__VLS_ctx.segmentsData.duration_seconds) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.fmtTime(__VLS_ctx.segmentsData.duration_seconds));
    }
    if (__VLS_ctx.segmentsData.songs?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-xs text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.segmentsData.songs.length);
        (__VLS_ctx.$t('sermonAudio.songs').toLowerCase());
    }
    if (__VLS_ctx.segmentsData.songs?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        for (const [s, i] of __VLS_vFor((__VLS_ctx.segmentsData.songs))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (i),
                ...{ class: "flex items-center gap-2 py-1 px-2 even:bg-gray-50 dark:even:bg-gray-700/30 rounded text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['even:bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:even:bg-gray-700/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-medium shrink-0" },
            });
            /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-blue-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-blue-900']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-blue-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            (i + 1);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex-1 truncate text-gray-700 dark:text-gray-300" },
            });
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
            (s.title || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs text-gray-400 shrink-0" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            (__VLS_ctx.fmtTime(s.start));
            (__VLS_ctx.fmtTime(s.end));
            // @ts-ignore
            [$t, $t, $t, $t, $t, audio, fmtTime, fmtTime, fmtTime, audioTitle, processing, processing, processingStatus, estimatedTime, estimatedTime, progressPercent, upload, segmentsData, segmentsData, segmentsData, segmentsData, segmentsData, segmentsData, segmentsData,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "max-h-64 overflow-y-auto space-y-1" },
    });
    /** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
    for (const [seg, i] of __VLS_vFor((__VLS_ctx.segmentsData.segments))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "flex items-start gap-2 py-1 px-2 even:bg-gray-50 dark:even:bg-gray-700/30 rounded text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['even:bg-gray-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:even:bg-gray-700/30']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0 w-16 text-gray-400 font-mono mt-0.5" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
        (__VLS_ctx.fmtTime(seg.start_seconds));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (__VLS_ctx.typeClass(seg.segment_type)) },
            ...{ class: "shrink-0 w-20 text-center rounded px-1 py-0.5 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_ctx.typeLabel(seg.segment_type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "flex-1 text-gray-600 dark:text-gray-400 truncate" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        (seg.title || seg.text || '');
        if (seg.confidence) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "shrink-0 text-gray-300 w-8 text-right" },
            });
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            ((seg.confidence * 100).toFixed(0));
        }
        // @ts-ignore
        [fmtTime, segmentsData, typeClass, typeLabel,];
    }
    if (!__VLS_ctx.segmentsData.segments?.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-center py-2 text-gray-400 text-xs" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        (__VLS_ctx.$t('sermonAudio.no_segments'));
    }
}
// @ts-ignore
[$t, segmentsData,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};

import { ref, computed, watch } from 'vue';
import { api } from '../utils/api';
import { parseChordPro } from '../utils/chordpro';
const props = defineProps();
const emit = defineEmits(['close', 'save']);
const localChart = ref(props.initialChart || '');
const saving = ref(false);
const message = ref(null);
const parsedLines = computed(() => parseChordPro(localChart.value));
async function save() {
    saving.value = true;
    message.value = null;
    try {
        await api.updateArrangement(props.arrangementId, { chord_chart: localChart.value });
        message.value = { type: 'success', text: 'Sauvegardé avec succès!' };
        emit('save', localChart.value);
        setTimeout(() => emit('close'), 1000);
    }
    catch (e) {
        message.value = { type: 'error', text: e.message || 'Erreur lors de la sauvegarde' };
    }
    finally {
        saving.value = false;
    }
}
watch(() => props.initialChart, (newVal) => {
    localChart.value = newVal || '';
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
/** @type {__VLS_StyleScopedClasses['editor-header']} */ ;
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "chordpro-editor" },
});
/** @type {__VLS_StyleScopedClasses['chordpro-editor']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "editor-header" },
});
/** @type {__VLS_StyleScopedClasses['editor-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "close-btn" },
});
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "editor-content" },
});
/** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-section" },
});
/** @type {__VLS_StyleScopedClasses['input-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    value: (__VLS_ctx.localChart),
    rows: "15",
    ...{ class: "w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500" },
    placeholder: "\u007b\u0074\u0069\u0074\u006c\u0065\u003a\u0020\u004e\u006f\u006d\u0020\u0064\u0075\u0020\u0063\u0068\u0061\u006e\u0074\u007d\u000a\u007b\u0061\u0072\u0074\u0069\u0073\u0074\u003a\u0020\u0041\u0075\u0074\u0065\u0075\u0072\u007d\u000a\u005b\u0043\u005d\u0050\u0061\u0072\u006f\u006c\u0065\u0073\u0020\u0061\u0076\u0065\u0063\u0020\u005b\u0047\u005d\u0061\u0063\u0063\u006f\u0072\u0064\u0073",
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "help-text" },
});
/** @type {__VLS_StyleScopedClasses['help-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "preview-section" },
});
/** @type {__VLS_StyleScopedClasses['preview-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
if (__VLS_ctx.localChart) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-content" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
    for (const [line, idx] of __VLS_vFor((__VLS_ctx.parsedLines))) {
        __VLS_asFunctionalElement(__VLS_intrinsics.template)({
            key: (idx),
        });
        if (line.type === 'empty') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chordpro-empty" },
            });
            /** @type {__VLS_StyleScopedClasses['chordpro-empty']} */ ;
        }
        else if (line.type === 'standalone') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "standalone-chord-row" },
            });
            /** @type {__VLS_StyleScopedClasses['standalone-chord-row']} */ ;
            (line.chordRow);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chordpro-block" },
            });
            /** @type {__VLS_StyleScopedClasses['chordpro-block']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "chord-row" },
            });
            /** @type {__VLS_StyleScopedClasses['chord-row']} */ ;
            (line.chordRow);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lyric-row" },
            });
            /** @type {__VLS_StyleScopedClasses['lyric-row']} */ ;
            (line.lyrics);
        }
        // @ts-ignore
        [localChart, localChart, parsedLines,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-empty text-gray-400 text-center py-8" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-empty']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "editor-footer" },
});
/** @type {__VLS_StyleScopedClasses['editor-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.save) },
    disabled: (__VLS_ctx.saving),
    ...{ class: "save-btn" },
});
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
(__VLS_ctx.saving ? 'Sauvegarde...' : 'Sauvegarder');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$emit, save, saving, saving,];
        } },
    ...{ class: "cancel-btn" },
});
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
if (__VLS_ctx.message) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (['message', __VLS_ctx.message.type]) },
    });
    /** @type {__VLS_StyleScopedClasses['message']} */ ;
    (__VLS_ctx.message.text);
}
// @ts-ignore
[message, message, message,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};

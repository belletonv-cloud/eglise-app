import { ref, getCurrentInstance } from 'vue';
import { getApiBase, authenticatedFetch } from '../utils/api';
const props = defineProps();
const emit = defineEmits(['close', 'uploaded']);
const fileInput = ref(null);
const selectedFile = ref(null);
const uploading = ref(false);
const downloadUrl = ref('');
const error = ref('');
const mediaType = ref('audio');
const title = ref('');
// i18n
const { proxy } = getCurrentInstance();
const $t = proxy?.$t || ((k) => k);
function formatFileSize(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function triggerFileInput() {
    fileInput.value?.click();
}
function onFileSelect(event) {
    const target = event.target;
    if (target.files?.[0]) {
        selectedFile.value = target.files[0];
        downloadUrl.value = '';
        error.value = '';
    }
}
function onDrop(event) {
    const files = event.dataTransfer?.files;
    if (files?.[0]) {
        selectedFile.value = files[0];
        downloadUrl.value = '';
        error.value = '';
    }
}
async function upload() {
    if (!selectedFile.value)
        return;
    uploading.value = true;
    error.value = '';
    downloadUrl.value = '';
    try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        formData.append('arrangement_id', String(props.arrangementId));
        formData.append('file_type', mediaType.value);
        const res = await authenticatedFetch(`${getApiBase()}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            let msg = '';
            if (res.status === 401 || res.status === 403) {
                msg = $t('song.upload_error_auth');
            }
            else {
                const err = await res.json().catch(() => ({ error: '' }));
                msg = err.error ? (typeof err.error === 'string' ? err.error : $t('song.upload_error_generic')) : $t('song.upload_error_generic');
            }
            throw new Error(msg || $t('song.upload_error_generic'));
        }
        const attachment = await res.json();
        const fileUrl = `${getApiBase()}/attachments/${attachment.id}/file`;
        downloadUrl.value = fileUrl;
        emit('uploaded', {
            id: attachment.id,
            url: fileUrl,
            filename: attachment.filename,
            type: mediaType.value,
            title: title.value || selectedFile.value.name,
        });
        setTimeout(() => emit('close'), 1500);
    }
    catch (e) {
        error.value = e.message || 'Erreur lors de l\'upload';
    }
    finally {
        uploading.value = false;
    }
}
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
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['dropzone']} */ ;
/** @type {__VLS_StyleScopedClasses['dropzone-text']} */ ;
/** @type {__VLS_StyleScopedClasses['media-type']} */ ;
/** @type {__VLS_StyleScopedClasses['media-title']} */ ;
/** @type {__VLS_StyleScopedClasses['media-type']} */ ;
/** @type {__VLS_StyleScopedClasses['media-title']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "media-upload" },
});
/** @type {__VLS_StyleScopedClasses['media-upload']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-header" },
});
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.$t('media.add'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$t, $emit,];
        } },
    ...{ class: "close-btn" },
});
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "upload-content" },
});
/** @type {__VLS_StyleScopedClasses['upload-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onDragover: () => { } },
    ...{ onDrop: (__VLS_ctx.onDrop) },
    ...{ onClick: (__VLS_ctx.triggerFileInput) },
    ...{ class: "dropzone" },
});
/** @type {__VLS_StyleScopedClasses['dropzone']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.onFileSelect) },
    ref: "fileInput",
    type: "file",
    accept: "audio/*,video/*,image/*,application/pdf",
    ...{ class: "hidden" },
});
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
if (!__VLS_ctx.selectedFile) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dropzone-text" },
    });
    /** @type {__VLS_StyleScopedClasses['dropzone-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.$t('song.drop_or_select') || 'Glissez un fichier ici ou cliquez pour sélectionner');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "hint" },
    });
    /** @type {__VLS_StyleScopedClasses['hint']} */ ;
    (__VLS_ctx.$t('song.accepted_types') || 'Audio, vidéo, image ou PDF');
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "selected-file" },
    });
    /** @type {__VLS_StyleScopedClasses['selected-file']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-name" },
    });
    /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
    (__VLS_ctx.selectedFile.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "file-size" },
    });
    /** @type {__VLS_StyleScopedClasses['file-size']} */ ;
    (__VLS_ctx.formatFileSize(__VLS_ctx.selectedFile.size));
}
if (__VLS_ctx.uploading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-section" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "progress-text" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
    (__VLS_ctx.$t('song.uploading') || 'Upload en cours...');
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.error);
}
if (__VLS_ctx.downloadUrl) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "success-message" },
    });
    /** @type {__VLS_StyleScopedClasses['success-message']} */ ;
    (__VLS_ctx.$t('song.upload_success') || '✓ Fichier uploadé avec succès!');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "media-type" },
});
/** @type {__VLS_StyleScopedClasses['media-type']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.$t('media.type_label'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.mediaType),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "audio",
});
(__VLS_ctx.$t('media.type_audio'));
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "video",
});
(__VLS_ctx.$t('media.type_video'));
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "image",
});
(__VLS_ctx.$t('media.type_image'));
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "pdf",
});
(__VLS_ctx.$t('media.type_pdf'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "media-title" },
});
/** @type {__VLS_StyleScopedClasses['media-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.$t('media.title_label'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.title),
    type: "text",
    placeholder: (__VLS_ctx.$t('media.file_desc')),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "modal-footer" },
});
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
            // @ts-ignore
            [$t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $emit, onDrop, triggerFileInput, onFileSelect, selectedFile, selectedFile, selectedFile, formatFileSize, uploading, error, error, downloadUrl, mediaType, title,];
        } },
    ...{ class: "cancel-btn" },
});
/** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
(__VLS_ctx.$t('generic.cancel'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.upload) },
    disabled: (!__VLS_ctx.selectedFile || __VLS_ctx.uploading),
    ...{ class: "upload-btn" },
});
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
(__VLS_ctx.uploading ? __VLS_ctx.$t('media.uploading') : __VLS_ctx.$t('media.upload'));
// @ts-ignore
[$t, $t, $t, selectedFile, uploading, uploading, upload,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};

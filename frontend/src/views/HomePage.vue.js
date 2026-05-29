import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../utils/api';
import { getOfflineSongs } from '../utils/offlineDb';
const songs = ref([]);
const loading = ref(true);
const error = ref('');
const offlineMode = ref(false);
const router = useRouter();
const filteredSongs = computed(() => {
    return songs.value.filter(s => (s.arrangement_count ?? 0) > 0);
});
async function loadFromAPI() {
    try {
        songs.value = await api.getSongs();
        offlineMode.value = false;
    }
    catch (e) {
        throw e;
    }
}
async function loadFromOffline() {
    const offline = await getOfflineSongs();
    songs.value = offline.map((s) => ({
        id: s.id,
        title: s.title,
        author: s.author,
        arrangement_count: s.arrangements?.length || 0,
    }));
    offlineMode.value = true;
}
onMounted(async () => {
    try {
        await loadFromAPI();
    }
    catch (e) {
        await loadFromOffline();
        if (!offlineMode.value) {
            error.value = 'API non accessible : ' + e.message;
        }
    }
    finally {
        loading.value = false;
    }
});
const goToSong = (id) => {
    router.push({ name: 'song-detail', params: { id: id.toString() } });
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['song-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "home" },
});
/** @type {__VLS_StyleScopedClasses['home']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "content" },
});
/** @type {__VLS_StyleScopedClasses['content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.$t('home.title'));
(__VLS_ctx.filteredSongs.length);
if (__VLS_ctx.offlineMode) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "offline-badge" },
    });
    /** @type {__VLS_StyleScopedClasses['offline-badge']} */ ;
    (__VLS_ctx.$t('home.offline'));
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    (__VLS_ctx.$t('loading'));
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.error);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    for (const [song] of __VLS_vFor((__VLS_ctx.filteredSongs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.goToSong(song.id);
                    // @ts-ignore
                    [$t, $t, $t, filteredSongs, filteredSongs, offlineMode, loading, error, error, goToSong,];
                } },
            key: (song.id),
            ...{ class: "song-item" },
        });
        /** @type {__VLS_StyleScopedClasses['song-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "song-id" },
        });
        /** @type {__VLS_StyleScopedClasses['song-id']} */ ;
        (song.id);
        (song.title);
        if (song.author) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (song.author);
        }
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

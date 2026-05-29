import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { parseChordPro } from '../utils/chordpro';
const route = useRoute();
const { t, locale } = useI18n();
const plan = ref(null);
const songs = ref([]);
const nonSongs = ref([]);
const loading = ref(true);
const error = ref('');
const typeLabel = (tl) => {
    const map = {
        song: t('plan.type.song'),
        header: t('plan.type.header'),
        media: t('plan.type.media'),
        announcement: t('plan.type.announcement'),
    };
    return map[tl] || tl;
};
function renderChordChart(chart) {
    const lines = parseChordPro(chart);
    return lines.map((line) => {
        if (line.chords) {
            return `<div class="text-blue-600 font-bold tracking-wider">${line.chords}</div>`;
        }
        return `<div>${line.text || ''}</div>`;
    }).join('');
}
function formatDate(d) {
    return new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}
onMounted(async () => {
    const id = parseInt(route.params.id);
    try {
        const [planData, items] = await Promise.all([
            api.getPlan(id),
            api.getPlanItems(id),
        ]);
        plan.value = planData;
        const songItems = items.filter((i) => i.type === 'song');
        const loadedSongs = await Promise.all(songItems.map(async (item) => {
            let song = null;
            let arrangement = null;
            if (item.arrangement_id) {
                const songsList = await api.getSongs();
                for (const s of songsList) {
                    const a = (s.arrangements || []).find((arr) => arr.id === item.arrangement_id);
                    if (a) {
                        song = s;
                        arrangement = a;
                        break;
                    }
                }
            }
            return {
                plan_item_id: item.id,
                position: item.position,
                type_label: typeLabel(item.type),
                song_title: item.song_title || item.title,
                arrangement_name: arrangement?.name || null,
                key: arrangement?.key || null,
                transposed_key: item.transposed_key || null,
                chord_chart: arrangement?.chord_chart || null,
                media: arrangement?.media || [],
            };
        }));
        songs.value = loadedSongs;
        nonSongs.value = items
            .filter((i) => i.type !== 'song')
            .map((i) => ({ ...i, type_label: typeLabel(i.type) }));
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "max-w-3xl mx-auto" },
});
/** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12 text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.$t('plan.loading'));
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
        ...{ class: "flex items-center gap-3 mb-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.$router.push(`/plans/${__VLS_ctx.plan.id}`);
                // @ts-ignore
                [loading, $t, error, error, plan, plan, $router,];
            } },
        ...{ class: "px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('setlist.back_to_plan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.plan))
                    return;
                __VLS_ctx.$router.push(`/kiosk/${__VLS_ctx.plan.id}`);
                // @ts-ignore
                [$t, plan, $router,];
            } },
        ...{ class: "px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer ml-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    (__VLS_ctx.$t('setlist.kiosk_mode'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-3xl font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.plan.date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-500 mt-1" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    (__VLS_ctx.plan.service_type_name || __VLS_ctx.$t('plan.service'));
    if (__VLS_ctx.plan.time) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.plan.time?.slice(0, 5));
    }
    if (__VLS_ctx.plan.theme) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-700 mt-2 text-lg italic" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['italic']} */ ;
        (__VLS_ctx.plan.theme);
    }
    if (__VLS_ctx.songs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-12 text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        (__VLS_ctx.$t('kiosk.no_songs'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    for (const [song] of __VLS_vFor((__VLS_ctx.songs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (song.plan_item_id),
            ...{ class: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-indigo-50 px-6 py-3 border-b border-indigo-100" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-indigo-100']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-indigo-600 font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (song.position);
        (song.type_label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-xl font-bold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (song.song_title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-sm text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (song.arrangement_name);
        if (song.key) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.$t('arrangement.original_key'));
            (song.key);
        }
        if (song.transposed_key) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-indigo-600 font-medium" },
            });
            /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            (__VLS_ctx.$t('arrangement.play_in'));
            (song.transposed_key);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        if (song.chord_chart) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "font-mono text-sm leading-relaxed whitespace-pre-wrap" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderChordChart(song.chord_chart)) }, null, null);
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
            /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-gray-400 italic" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['italic']} */ ;
            (__VLS_ctx.$t('kiosk.no_chart'));
        }
        if (song.media && song.media.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "px-6 pb-4 flex gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            for (const [m] of __VLS_vFor((song.media))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                    key: (m.id),
                    href: (m.file_url),
                    target: "_blank",
                    ...{ class: "text-sm text-indigo-600 hover:text-indigo-800 underline" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
                /** @type {__VLS_StyleScopedClasses['underline']} */ ;
                (m.filename);
                // @ts-ignore
                [$t, $t, $t, $t, $t, $t, plan, plan, plan, plan, plan, plan, formatDate, songs, songs, renderChordChart,];
            }
        }
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.nonSongs.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-8 bg-gray-50 rounded-xl p-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-sm font-medium text-gray-500 mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.$t('setlist.other_items'));
        for (const [item] of __VLS_vFor((__VLS_ctx.nonSongs))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (item.id),
                ...{ class: "text-sm text-gray-600 py-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-gray-400 uppercase text-xs" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (item.type_label);
            (item.title);
            if (item.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-gray-400" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
                (__VLS_ctx.$t('generic.separator'));
                (item.description);
            }
            // @ts-ignore
            [$t, $t, nonSongs, nonSongs,];
        }
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

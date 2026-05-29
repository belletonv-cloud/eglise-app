import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { showToast } from '../stores/toast';
const { t, locale } = useI18n();
const items = ref([]);
const loading = ref(true);
const filter = ref('all');
const showActionsModal = ref(false);
const showOneTimeActionsModal = ref(false);
const selectedEvent = ref(null);
const selectedOneTime = ref(null);
const actionForm = ref({ repeat_period: 'week', cancelDate: '', moveDate: '', reason: '' });
const oneTimeForm = ref({ newDate: '', reason: '' });
const filtered = computed(() => {
    if (filter.value === 'all')
        return items.value;
    return items.value.filter(i => i.source === filter.value);
});
function dayOfWeek(date) {
    const d = date.getDay();
    return d === 0 ? 6 : d - 1;
}
function weekOfMonth(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = date.getDate();
    const dow = dayOfWeek(first);
    return Math.ceil((day + dow) / 7);
}
function isLastWeekOfMonth(date) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    return next.getMonth() !== date.getMonth();
}
function dayNameFr(dow) {
    return (['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][dow]) || '';
}
function ordinalFr(n) {
    const map = { 1: '1er', 2: '2e', 3: '3e', 4: '4e', 5: '5e' };
    return map[n] || `${n}e`;
}
function isCancelled(eventId, date) {
    const ev = items.value.find(e => e.id === eventId);
    if (!ev?.exceptions)
        return false;
    return ev.exceptions.some((ex) => ex.exception_date === date && ex.type === 'cancelled');
}
function getMovedTo(eventId, date) {
    const ev = items.value.find(e => e.id === eventId);
    if (!ev?.exceptions)
        return null;
    const ex = ev.exceptions.find((e) => e.exception_date === date && e.type === 'moved');
    return ex?.new_date || null;
}
function generateRecurringDates(ev, count = 6) {
    const start = new Date(ev.start_date + 'T00:00:00');
    const results = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (ev.repeat_period === 'week') {
        let d = new Date(start);
        while (results.length < count) {
            if (d >= now) {
                const dateStr = d.toISOString().slice(0, 10);
                results.push({
                    originalId: ev.id,
                    title: ev.title,
                    date: dateStr,
                    dateLabel: formatDate(dateStr),
                    startTime: ev.start_time,
                    location: ev.location,
                    ruleLabel: `Chaque ${dayNameFr(dayOfWeek(d))}`,
                    image_url: ev.image_url,
                    cancelled: isCancelled(ev.id, dateStr),
                    moved: !!getMovedTo(ev.id, dateStr),
                    movedTo: getMovedTo(ev.id, dateStr) ? formatDate(getMovedTo(ev.id, dateStr)) : null,
                });
            }
            d.setDate(d.getDate() + 7);
        }
    }
    else if (ev.repeat_period === 'month') {
        const dow = dayOfWeek(start);
        const wom = weekOfMonth(start);
        const last = isLastWeekOfMonth(start);
        let year = start.getFullYear();
        let month = start.getMonth();
        while (results.length < count) {
            let targetDate = null;
            if (last) {
                const lastDay = new Date(year, month + 1, 0).getDate();
                for (let day = lastDay; day >= 1; day--) {
                    const candidate = new Date(year, month, day);
                    if (dayOfWeek(candidate) === dow && isLastWeekOfMonth(candidate)) {
                        targetDate = candidate;
                        break;
                    }
                }
            }
            else {
                let found = 0;
                for (let day = 1; day <= 31; day++) {
                    const candidate = new Date(year, month, day);
                    if (candidate.getMonth() !== month)
                        break;
                    if (dayOfWeek(candidate) === dow) {
                        found++;
                        if (found === wom) {
                            targetDate = candidate;
                            break;
                        }
                    }
                }
            }
            if (targetDate && targetDate >= now) {
                const dateStr = targetDate.toISOString().slice(0, 10);
                results.push({
                    originalId: ev.id,
                    title: ev.title,
                    date: dateStr,
                    dateLabel: formatDate(dateStr),
                    startTime: ev.start_time,
                    location: ev.location,
                    ruleLabel: last ? `Dernier ${dayNameFr(dow)} du mois` : `${ordinalFr(wom)} ${dayNameFr(dow)} du mois`,
                    image_url: ev.image_url,
                    cancelled: isCancelled(ev.id, dateStr),
                    moved: !!getMovedTo(ev.id, dateStr),
                    movedTo: getMovedTo(ev.id, dateStr) ? formatDate(getMovedTo(ev.id, dateStr)) : null,
                });
            }
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }
    }
    return results;
}
const recurring = computed(() => {
    const all = [];
    for (const ev of filtered.value) {
        if (ev.repeat_period && ev.status !== 'cancelled') {
            all.push(...generateRecurringDates(ev));
        }
    }
    all.sort((a, b) => a.date.localeCompare(b.date));
    return all.slice(0, 18);
});
const oneTime = computed(() => {
    const now = new Date().toISOString().slice(0, 10);
    return filtered.value
        .filter(ev => (!ev.repeat_period || ev.status === 'cancelled') && ev.start_date >= now)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
});
const formatDate = (d) => d ? new Date(d).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
async function openActions(ev) {
    selectedEvent.value = ev;
    actionForm.value = { repeat_period: '', cancelDate: ev.date, moveDate: '', reason: '' };
    showActionsModal.value = true;
}
async function openOneTimeActions(ev) {
    selectedOneTime.value = ev;
    oneTimeForm.value = { newDate: ev.start_date, reason: '' };
    showOneTimeActionsModal.value = true;
}
async function cancelOccurrence() {
    if (!selectedEvent.value || !actionForm.value.cancelDate)
        return;
    try {
        await api.createChurchEventException(selectedEvent.value.originalId, {
            type: 'cancelled',
            exception_date: actionForm.value.cancelDate,
            reason: actionForm.value.reason,
        });
        showToast('Occurrence annulée');
        showActionsModal.value = false;
        await load();
    }
    catch (e) {
        showToast(e.message, 'error');
    }
}
async function moveOccurrence() {
    if (!selectedEvent.value || !actionForm.value.moveDate)
        return;
    try {
        await api.createChurchEventException(selectedEvent.value.originalId, {
            type: 'moved',
            exception_date: actionForm.value.cancelDate,
            new_date: actionForm.value.moveDate,
            reason: actionForm.value.reason,
        });
        showToast('Occurrence décalée');
        showActionsModal.value = false;
        await load();
    }
    catch (e) {
        showToast(e.message, 'error');
    }
}
async function cancelOneTime() {
    if (!selectedOneTime.value)
        return;
    try {
        await api.updateChurchEvent(selectedOneTime.value.id, { status: 'cancelled' });
        showToast('Événement annulé');
        showOneTimeActionsModal.value = false;
        await load();
    }
    catch (e) {
        showToast(e.message, 'error');
    }
}
async function moveOneTime() {
    if (!selectedOneTime.value || !oneTimeForm.value.newDate)
        return;
    try {
        await api.updateChurchEvent(selectedOneTime.value.id, { start_date: oneTimeForm.value.newDate });
        showToast('Événement décalé');
        showOneTimeActionsModal.value = false;
        await load();
    }
    catch (e) {
        showToast(e.message, 'error');
    }
}
const load = async () => {
    try {
        const events = await api.getChurchEvents(undefined, true);
        items.value = events;
    }
    catch { /* ignore */ }
    finally {
        loading.value = false;
    }
};
onMounted(load);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between mb-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-2xl font-bold text-gray-800 dark:text-gray-100" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
(__VLS_ctx.$t('churchEvents.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex gap-2 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.filter = 'all';
            // @ts-ignore
            [$t, filter,];
        } },
    ...{ class: "px-3 py-1.5 rounded-lg text-sm" },
    ...{ class: (__VLS_ctx.filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300') },
});
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
(__VLS_ctx.$t('churchEvents.all'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.filter = 'cieuxouverts.bzh';
            // @ts-ignore
            [$t, filter, filter,];
        } },
    ...{ class: "px-3 py-1.5 rounded-lg text-sm" },
    ...{ class: (__VLS_ctx.filter === 'cieuxouverts.bzh' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300') },
});
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12 text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.$t('loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    if (__VLS_ctx.recurring.length) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-bold text-gray-800 dark:text-gray-100 mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        (__VLS_ctx.$t('churchEvents.recurring'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-3 md:grid-cols-2 lg:grid-cols-3" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
        for (const [ev] of __VLS_vFor((__VLS_ctx.recurring))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (ev.originalId + '-' + ev.date),
                ...{ class: "rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-750" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-750']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-start justify-between" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "font-bold text-gray-800 dark:text-gray-100 text-sm flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            (ev.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.recurring.length))
                            return;
                        __VLS_ctx.openActions(ev);
                        // @ts-ignore
                        [$t, $t, filter, loading, recurring, recurring, openActions,];
                    } },
                ...{ class: "ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:hover:text-gray-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (ev.dateLabel);
            if (ev.startTime) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (ev.startTime);
            }
            if (ev.location) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "text-xs text-gray-500 dark:text-gray-400 mt-1" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                (ev.location);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2 mt-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-blue-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-blue-900']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-blue-700']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-blue-300']} */ ;
            (ev.ruleLabel);
            if (ev.cancelled) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:bg-red-900']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:text-red-300']} */ ;
            }
            if (ev.moved) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-amber-100']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:bg-amber-900']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-amber-700']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:text-amber-300']} */ ;
                (ev.movedTo);
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.oneTime.length) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-bold text-gray-800 dark:text-gray-100 mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 md:grid-cols-2 lg:grid-cols-3" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
        for (const [ev] of __VLS_vFor((__VLS_ctx.oneTime))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (ev.id),
                ...{ class: "rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800" },
                ...{ class: ({ 'opacity-60': ev.status === 'cancelled' }) },
            });
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
            if (ev.image_url) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (ev.image_url),
                    alt: (ev.title),
                    ...{ class: "w-full h-32 object-cover" },
                    loading: "lazy",
                });
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
                /** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "w-full h-32 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center" },
                });
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-32']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-amber-500']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-orange-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-white text-3xl" },
                });
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-start justify-between" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "font-bold text-gray-800 dark:text-gray-100 text-sm flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            (ev.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.oneTime.length))
                            return;
                        __VLS_ctx.openOneTimeActions(ev);
                        // @ts-ignore
                        [oneTime, oneTime, openOneTimeActions,];
                    } },
                ...{ class: "ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:hover:text-gray-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatDate(ev.start_date));
            if (ev.start_time) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (ev.start_time);
            }
            if (ev.location) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "text-xs text-gray-500 dark:text-gray-400 mt-1" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                (ev.location);
            }
            if (ev.status === 'cancelled') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "inline-block mt-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
                });
                /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:bg-red-900']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
                /** @type {__VLS_StyleScopedClasses['dark:text-red-300']} */ ;
            }
            // @ts-ignore
            [formatDate,];
        }
    }
}
if (__VLS_ctx.showActionsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showActionsModal))
                    return;
                __VLS_ctx.showActionsModal = false;
                // @ts-ignore
                [showActionsModal, showActionsModal,];
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
        ...{ class: "bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-bold mb-4 text-gray-800 dark:text-gray-100" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
    (__VLS_ctx.selectedEvent?.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500 dark:text-gray-400 mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    (__VLS_ctx.selectedEvent?.ruleLabel);
    (__VLS_ctx.selectedEvent?.dateLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.actionForm.repeat_period),
        ...{ class: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "week",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "month",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    (__VLS_ctx.$t('churchEvents.cancel_occurrence'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    (__VLS_ctx.actionForm.cancelDate);
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelOccurrence) },
        ...{ class: "px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('churchEvents.cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    (__VLS_ctx.actionForm.moveDate);
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.moveOccurrence) },
        ...{ class: "px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-amber-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-amber-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.actionForm.reason),
        type: "text",
        placeholder: "Férié, intempéries...",
        ...{ class: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-3 justify-end pt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showActionsModal))
                    return;
                __VLS_ctx.showActionsModal = false;
                // @ts-ignore
                [$t, $t, showActionsModal, selectedEvent, selectedEvent, selectedEvent, actionForm, actionForm, actionForm, actionForm, cancelOccurrence, moveOccurrence,];
            } },
        ...{ class: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
}
if (__VLS_ctx.showOneTimeActionsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showOneTimeActionsModal))
                    return;
                __VLS_ctx.showOneTimeActionsModal = false;
                // @ts-ignore
                [showOneTimeActionsModal, showOneTimeActionsModal,];
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
        ...{ class: "bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-bold mb-4 text-gray-800 dark:text-gray-100" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
    (__VLS_ctx.selectedOneTime?.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "date",
        ...{ class: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    (__VLS_ctx.oneTimeForm.newDate);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.oneTimeForm.reason),
        type: "text",
        placeholder: "Salle indisponible...",
        ...{ class: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelOneTime) },
        ...{ class: "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.$t('churchEvents.cancel_event'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.moveOneTime) },
        ...{ class: "flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-amber-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-amber-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.$t('churchEvents.cancel_occurrence').replace('Annuler', 'Décaler'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-3 justify-end pt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showOneTimeActionsModal))
                    return;
                __VLS_ctx.showOneTimeActionsModal = false;
                // @ts-ignore
                [$t, $t, showOneTimeActionsModal, selectedOneTime, oneTimeForm, oneTimeForm, cancelOneTime, moveOneTime,];
            } },
        ...{ class: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
}
if (!__VLS_ctx.loading && __VLS_ctx.recurring.length === 0 && __VLS_ctx.oneTime.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12 text-gray-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    (__VLS_ctx.$t('churchEvents.nothing'));
}
// @ts-ignore
[$t, loading, recurring, oneTime,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

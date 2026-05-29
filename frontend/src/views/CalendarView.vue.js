import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import PlanForm from '../components/PlanForm.vue';
import EventPopover from '../components/EventPopover.vue';
import { stepsByPage } from '../page-help-steps';
const router = useRouter();
const { t, tm } = useI18n();
const plans = ref([]);
const events = ref([]);
const isLoading = ref(true);
const error = ref('');
const showForm = ref(false);
const selectedDate = ref('');
const currentDate = ref(new Date());
const currentView = ref('month');
const popover = ref({ event: null, x: 0, y: 0, visible: false });
const views = [
    { key: 'month', label: 'Mois' },
    { key: 'week', label: 'Semaine' },
    { key: 'cards', label: 'Cartes' },
    { key: 'agenda', label: 'Ordre du jour' },
];
const dayNames = computed(() => tm('dayNames'));
const monthNames = computed(() => tm('monthFull'));
const monthLabel = computed(() => {
    const d = currentDate.value;
    return `${monthNames.value[d.getMonth()]} ${d.getFullYear()}`;
});
const periodLabel = computed(() => {
    if (currentView.value === 'week') {
        const wd = weekDays.value;
        if (!wd.length)
            return monthLabel.value;
        const opts = { day: 'numeric', month: 'long' };
        return `${formatDateLabel(wd[0].dateObj, opts)} — ${formatDateLabel(wd[wd.length - 1].dateObj, opts)}`;
    }
    return monthLabel.value;
});
const firstDayOfMonth = computed(() => {
    const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
    return (d.getDay() + 6) % 7;
});
const daysInMonth = computed(() => {
    return new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0).getDate();
});
const weekDays = computed(() => {
    const d = new Date(currentDate.value);
    const dayOfWeek = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(d);
        date.setDate(date.getDate() + i);
        const dateStr = dateStrFromDate(date);
        days.push({
            date: dateStr,
            dateObj: date,
            day: date.getDate(),
            items: getItemsForDate(dateStr),
        });
    }
    return days;
});
const allItems = computed(() => {
    const items = [];
    for (const p of plans.value) {
        items.push({
            id: `plan-${p.id}`,
            title: p.service_type_name || t('calendar.service'),
            date: p.date,
            time: p.time || '',
            location: p.location || '',
            description: p.notes || '',
            emoji: '📋',
            type: 'plan',
            status: p.status || 'planned',
            link: '',
            ticketUrl: '',
            planId: p.id,
        });
    }
    for (const e of events.value) {
        items.push({
            id: `event-${e.id}-${e._occurrenceKey || e.start_date}`,
            title: e.title,
            date: e.start_date,
            time: e.start_time || '',
            location: e.location || '',
            description: e.description || '',
            emoji: e.emoji || '📌',
            type: 'event',
            status: e.status || 'active',
            link: e.lien || '',
            ticketUrl: e.billetterie || '',
            planId: null,
        });
    }
    return items;
});
const sortedItems = computed(() => {
    return [...allItems.value].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
});
function getItemsForDate(dateStr) {
    return allItems.value.filter(item => item.date === dateStr);
}
const calendarDays = computed(() => {
    const days = [];
    for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
        const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), -i);
        days.push({
            date: dateStrFromDate(d),
            day: d.getDate(),
            isCurrentMonth: false,
            items: getItemsForDate(dateStrFromDate(d)),
        });
    }
    for (let i = 1; i <= daysInMonth.value; i++) {
        const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), i);
        const dateStr = dateStrFromDate(d);
        days.push({
            date: dateStr,
            day: i,
            isCurrentMonth: true,
            items: getItemsForDate(dateStr),
        });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, i);
        days.push({
            date: dateStrFromDate(d),
            day: d.getDate(),
            isCurrentMonth: false,
            items: getItemsForDate(dateStrFromDate(d)),
        });
    }
    return days;
});
const groupedByDate = computed(() => {
    const map = {};
    for (const item of sortedItems.value) {
        const date = new Date(item.date + 'T00:00:00');
        const key = date.toDateString();
        if (!map[key]) {
            map[key] = {
                key,
                label: formatDateLabelFull(date),
                items: [],
            };
        }
        map[key].items.push(item);
    }
    return Object.values(map);
});
const eventColors = ['bg-blue-600', 'bg-red-500', 'bg-amber-500', 'bg-purple-600', 'bg-emerald-500'];
function itemColor(item) {
    if (item.type === 'plan') {
        if (item.status === 'completed')
            return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
        if (item.status === 'cancelled')
            return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    }
    const idx = (item.title?.charCodeAt(0) || 0) % eventColors.length;
    return eventColors[idx] + ' text-white';
}
function isToday(dateStr) {
    const now = new Date();
    return dateStr === dateStrFromDate(now);
}
function prev() {
    const d = new Date(currentDate.value);
    if (currentView.value === 'week')
        d.setDate(d.getDate() - 7);
    else
        d.setMonth(d.getMonth() - 1);
    currentDate.value = d;
    loadData();
}
function next() {
    const d = new Date(currentDate.value);
    if (currentView.value === 'week')
        d.setDate(d.getDate() + 7);
    else
        d.setMonth(d.getMonth() + 1);
    currentDate.value = d;
    loadData();
}
function createPlan(day) {
    if (!day.isCurrentMonth)
        return;
    selectedDate.value = day.date;
    showForm.value = true;
}
function goToPlan(id) {
    if (!id)
        return;
    router.push({ name: 'plan-detail', params: { id: String(id) } });
}
function handleItemClick(item, evt) {
    if (item.type === 'plan') {
        goToPlan(item.planId);
        return;
    }
    // Popover contextual uniquement pour events
    if (evt) {
        popover.value = {
            event: item,
            x: evt.clientX,
            y: evt.clientY + 2,
            visible: true,
        };
    }
}
function closePopover() {
    popover.value.visible = false;
    popover.value.event = null;
}
const onPlanSaved = () => {
    showForm.value = false;
    loadData();
};
function dateStrFromDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return String(d.getDate()).padStart(2, '0');
}
function formatMonth(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
}
function formatDateLabel(date, opts) {
    return date.toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'long' });
}
function formatDateLabelFull(date) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function expandRecurring(ev, now, maxCount) {
    const start = new Date(ev.start_date + 'T00:00:00');
    const results = [];
    let d = new Date(start);
    if (d < now) {
        if (ev.repeat_period === 'week') {
            while (d < now)
                d.setDate(d.getDate() + 7);
        }
        else if (ev.repeat_period === 'month') {
            while (d < now)
                d.setMonth(d.getMonth() + 1);
        }
    }
    let count = 0;
    while (count < maxCount) {
        const dateStr = d.toISOString().slice(0, 10);
        const cancelled = ev.exceptions?.some((ex) => ex.exception_date === dateStr && ex.type === 'cancelled');
        const moved = ev.exceptions?.find((ex) => ex.exception_date === dateStr && ex.type === 'moved');
        if (!cancelled) {
            const targetDate = moved ? moved.new_date : dateStr;
            results.push({ ...ev, start_date: targetDate, start_time: ev.start_time || '', _occurrenceKey: dateStr });
            count++;
        }
        if (ev.repeat_period === 'week') {
            d.setDate(d.getDate() + 7);
        }
        else if (ev.repeat_period === 'month') {
            d.setMonth(d.getMonth() + 1);
        }
        else {
            break;
        }
    }
    return results;
}
const loadData = async () => {
    try {
        isLoading.value = true;
        const month = currentDate.value.getMonth() + 1;
        const year = currentDate.value.getFullYear();
        const [plansData, eventsData] = await Promise.all([
            api.getPlans(month, year),
            api.getChurchEvents(undefined, true).catch(() => []),
        ]);
        plans.value = plansData;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expanded = [];
        for (const ev of eventsData) {
            if (ev.status === 'cancelled')
                continue;
            if (ev.repeat_period) {
                const occurrences = expandRecurring(ev, now, 12);
                expanded.push(...occurrences);
            }
            else {
                const evtDate = new Date(ev.start_date + 'T00:00:00');
                if (evtDate < now)
                    continue;
                expanded.push(ev);
            }
        }
        events.value = expanded;
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        isLoading.value = false;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "calendar" },
});
/** @type {__VLS_StyleScopedClasses['calendar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between mb-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "text-2xl font-bold text-gray-800 dark:text-gray-100" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
(__VLS_ctx.$t('calendar.title'));
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.PageHelp} */
PageHelp;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    page: "calendar",
    helpText: (__VLS_ctx.$t('help.calendar')),
    steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).calendar),
}));
const __VLS_2 = __VLS_1({
    page: "calendar",
    helpText: (__VLS_ctx.$t('help.calendar')),
    steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).calendar),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-12 flex flex-col gap-3 items-center animate-pulse" },
        'aria-busy': "true",
    });
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-80 h-8 bg-gray-200 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['w-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-72 h-5 bg-gray-100 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['w-72']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-[340px] h-16 bg-gray-100 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['w-[340px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "w-80 h-12 bg-gray-200 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['w-80']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-gray-400 mt-4" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    (__VLS_ctx.$t('loading'));
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
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between mb-4 flex-wrap gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.prev) },
        ...{ class: "px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-700 dark:text-gray-200 mx-2 min-w-[180px] text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:text-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-[180px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.periodLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.next) },
        ...{ class: "px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
    for (const [v] of __VLS_vFor((__VLS_ctx.views))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.currentView = v.key;
                    // @ts-ignore
                    [$t, $t, $t, stepsByPage, t, isLoading, error, error, prev, periodLabel, next, views, currentView,];
                } },
            key: (v.key),
            ...{ class: "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer" },
            ...{ class: (__VLS_ctx.currentView === v.key ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300') },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (v.label);
        // @ts-ignore
        [currentView,];
    }
    if (__VLS_ctx.currentView === 'month') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-px']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        for (const [d] of __VLS_vFor((__VLS_ctx.dayNames))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (d),
                ...{ class: "bg-gray-50 dark:bg-gray-800 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            (d);
            // @ts-ignore
            [currentView, dayNames,];
        }
        for (const [day, i] of __VLS_vFor((__VLS_ctx.calendarDays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.currentView === 'month'))
                            return;
                        __VLS_ctx.createPlan(day);
                        // @ts-ignore
                        [calendarDays, createPlan,];
                    } },
                key: (i),
                ...{ class: "bg-white dark:bg-gray-900 min-h-[70px] md:min-h-[100px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" },
                ...{ class: ({ 'text-gray-400': !day.isCurrentMonth, 'bg-blue-50/30 dark:bg-blue-900/10': __VLS_ctx.isToday(day.date) }) },
            });
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-900']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-h-[70px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['md:min-h-[100px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-blue-50/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-blue-900/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-xs font-medium mb-1 flex items-center justify-center" },
                ...{ class: (__VLS_ctx.isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : '') },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            (day.day);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-0.5" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-0.5']} */ ;
            for (const [item] of __VLS_vFor((day.items))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.isLoading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!(__VLS_ctx.currentView === 'month'))
                                return;
                            __VLS_ctx.handleItemClick(item, $event);
                            // @ts-ignore
                            [isToday, isToday, handleItemClick,];
                        } },
                    key: (item.id),
                    ...{ class: "text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight" },
                    ...{ class: (__VLS_ctx.itemColor(item)) },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
                (item.emoji || '');
                (item.title);
                // @ts-ignore
                [itemColor,];
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.currentView === 'week') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-px']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
        for (const [d] of __VLS_vFor((__VLS_ctx.dayNames))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (d),
                ...{ class: "bg-gray-50 dark:bg-gray-800 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            (d);
            // @ts-ignore
            [currentView, dayNames,];
        }
        for (const [day] of __VLS_vFor((__VLS_ctx.weekDays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (day.date),
                ...{ class: "bg-white dark:bg-gray-900 min-h-[120px] p-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" },
                ...{ class: ({ 'bg-blue-50/30 dark:bg-blue-900/10': __VLS_ctx.isToday(day.date) }) },
            });
            /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-gray-900']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-h-[120px]']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:hover:bg-blue-900/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-blue-50/30']} */ ;
            /** @type {__VLS_StyleScopedClasses['dark:bg-blue-900/10']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-xs font-medium mb-1 flex items-center justify-center" },
                ...{ class: (__VLS_ctx.isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto' : '') },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            (day.day);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-0.5" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-0.5']} */ ;
            for (const [item] of __VLS_vFor((day.items))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.isLoading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!(__VLS_ctx.currentView === 'week'))
                                return;
                            __VLS_ctx.handleItemClick(item, $event);
                            // @ts-ignore
                            [isToday, isToday, handleItemClick, weekDays,];
                        } },
                    key: (item.id),
                    ...{ class: "text-xs px-1 py-0.5 rounded truncate cursor-pointer font-medium leading-tight" },
                    ...{ class: (__VLS_ctx.itemColor(item)) },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
                (item.emoji || '');
                (item.title);
                // @ts-ignore
                [itemColor,];
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.currentView === 'cards') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-12 text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    }
    if (__VLS_ctx.currentView === 'agenda') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-12 text-gray-400" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    }
    if (__VLS_ctx.showForm) {
        const __VLS_5 = PlanForm;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            ...{ 'onClose': {} },
            ...{ 'onSaved': {} },
            date: (__VLS_ctx.selectedDate),
        }));
        const __VLS_7 = __VLS_6({
            ...{ 'onClose': {} },
            ...{ 'onSaved': {} },
            date: (__VLS_ctx.selectedDate),
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        let __VLS_10;
        const __VLS_11 = ({ close: {} },
            { onClose: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.showForm))
                        return;
                    __VLS_ctx.showForm = false;
                    // @ts-ignore
                    [currentView, currentView, showForm, showForm, selectedDate,];
                } });
        const __VLS_12 = ({ saved: {} },
            { onSaved: (__VLS_ctx.onPlanSaved) });
        var __VLS_8;
        var __VLS_9;
    }
    if (__VLS_ctx.popover.visible && __VLS_ctx.popover.event) {
        const __VLS_13 = EventPopover;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            event: (__VLS_ctx.popover.event),
            x: (__VLS_ctx.popover.x),
            y: (__VLS_ctx.popover.y),
            visible: (__VLS_ctx.popover.visible),
            onClose: (__VLS_ctx.closePopover),
        }));
        const __VLS_15 = __VLS_14({
            event: (__VLS_ctx.popover.event),
            x: (__VLS_ctx.popover.x),
            y: (__VLS_ctx.popover.y),
            visible: (__VLS_ctx.popover.visible),
            onClose: (__VLS_ctx.closePopover),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    }
}
// @ts-ignore
[onPlanSaved, popover, popover, popover, popover, popover, popover, closePopover,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

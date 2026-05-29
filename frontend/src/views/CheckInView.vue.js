import PageHelp from '../components/PageHelp.vue';
import { stepsByPage } from '../page-help-steps';
import { ref, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { showToast } from '../stores/toast';
import { useCheckins } from '../composables/useCheckins';
const { t } = useI18n();
const { plans, members, attendances, currentPlan, searchResults, isLoading, isSubmitting, error, loadPlans, loadMembers, loadAttendances, checkIn, checkOut, createMember, validateCheckIn, searchMembers } = useCheckins();
const showManualCheckIn = ref(false);
const showQR = ref(false);
const manualForm = ref({ first_name: '', last_name: '', search: '' });
const searchInputRef = ref(null);
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const formatTime = (tl) => tl ? new Date(tl).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const handleSelectPlan = async (plan) => {
    currentPlan.value = plan;
    await loadAttendances(plan.id);
};
const handleSearch = (query) => {
    searchMembers(query);
};
const handleCheckIn = async (member) => {
    const errorKey = validateCheckIn(currentPlan.value, member);
    if (errorKey) {
        showToast(t(errorKey), 'error');
        if (searchInputRef.value)
            nextTick(() => searchInputRef.value?.focus());
        return;
    }
    try {
        await checkIn({ plan_id: currentPlan.value.id, member_id: member.id });
        showToast(t('checkin.success'), 'success');
        await loadAttendances(currentPlan.value.id);
    }
    catch {
        showToast(t('checkin.api_error'), 'error');
    }
};
const handleManualCheckIn = async () => {
    if (!manualForm.value.last_name)
        return;
    try {
        let member = members.value.find((m) => m.last_name.toLowerCase() === manualForm.value.last_name.toLowerCase() &&
            (!manualForm.value.first_name || m.first_name?.toLowerCase() === manualForm.value.first_name.toLowerCase()));
        if (!member) {
            member = await createMember({
                first_name: manualForm.value.first_name,
                last_name: manualForm.value.last_name,
                membership_type: 'guest'
            });
        }
        const errorKey = validateCheckIn(currentPlan.value, member);
        if (errorKey) {
            showToast(t(errorKey), 'error');
            if (searchInputRef.value)
                nextTick(() => searchInputRef.value?.focus());
            return;
        }
        await checkIn({ plan_id: currentPlan.value.id, member_id: member.id });
        showToast(t('checkin.success'), 'success');
        showManualCheckIn.value = false;
        manualForm.value = { first_name: '', last_name: '', search: '' };
        await loadAttendances(currentPlan.value.id);
    }
    catch {
        showToast(t('checkin.api_error'), 'error');
    }
};
const handleCheckOut = async (attendanceId) => {
    await checkOut(attendanceId);
    showToast(t('checkin.removed'), 'success');
    await loadAttendances(currentPlan.value.id);
};
onMounted(() => {
    loadPlans();
    loadMembers();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        role: "status",
        'data-testid': "loader",
        ...{ class: "text-center py-12 text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.$t('loading'));
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-red-50 text-red-700 p-4 rounded-lg" },
        'aria-live': "polite",
    });
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    (__VLS_ctx.error);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "max-w-4xl mx-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center gap-4 mb-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                __VLS_ctx.$router.back();
                // @ts-ignore
                [isLoading, $t, error, error, $router,];
            } },
        ...{ class: "text-gray-600 hover:text-gray-800 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-gray-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('checkin.back'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-2xl font-bold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.$t('checkin.title'));
    const __VLS_0 = PageHelp;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        page: "checkin",
        helpText: (__VLS_ctx.$t('help.checkin')),
        steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).checkin),
    }));
    const __VLS_2 = __VLS_1({
        page: "checkin",
        helpText: (__VLS_ctx.$t('help.checkin')),
        steps: (__VLS_ctx.stepsByPage(__VLS_ctx.t).checkin),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (!__VLS_ctx.currentPlan) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-lg font-semibold mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        (__VLS_ctx.$t('checkin.select_plan'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        for (const [plan] of __VLS_vFor((__VLS_ctx.plans))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(!__VLS_ctx.currentPlan))
                            return;
                        __VLS_ctx.handleSelectPlan(plan);
                        // @ts-ignore
                        [$t, $t, $t, $t, stepsByPage, t, currentPlan, plans, handleSelectPlan,];
                    } },
                key: (plan.id),
                ...{ class: "border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer hover:shadow-md transition-all" },
                'data-testid': "plan-item",
            });
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:border-blue-300']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "font-semibold text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (__VLS_ctx.formatDate(plan.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-sm text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (plan.service_type_name || __VLS_ctx.$t('calendar.service'));
            if (plan.time) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (plan.time?.slice(0, 5));
            }
            if (plan.theme) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "text-sm text-gray-600 mt-1 italic" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['italic']} */ ;
                (plan.theme);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-xs text-gray-400 mt-2" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            (plan.attendance_count || 0);
            (__VLS_ctx.$t('checkin.present'));
            // @ts-ignore
            [$t, $t, formatDate,];
        }
        if (__VLS_ctx.plans.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-center py-8 text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            (__VLS_ctx.$t('checkin.no_upcoming'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-8" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-lg font-semibold mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        (__VLS_ctx.$t('checkin.qr_code'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-2 md:grid-cols-4 gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        for (const [plan] of __VLS_vFor((__VLS_ctx.plans.slice(0, 4)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (plan.id),
                ...{ class: "border border-gray-200 rounded-lg p-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(__VLS_ctx.origin + '/checkin?plan=' + plan.id)}`),
                ...{ class: "qr-code mx-auto mb-2" },
                alt: "QR check-in",
                loading: "lazy",
            });
            /** @type {__VLS_StyleScopedClasses['qr-code']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (__VLS_ctx.formatDate(plan.date));
            // @ts-ignore
            [$t, $t, plans, plans, formatDate, origin,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
            ...{ class: "flex items-center justify-between mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-xl font-bold text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (__VLS_ctx.formatDate(__VLS_ctx.currentPlan.date));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (__VLS_ctx.currentPlan.service_type_name);
        if (__VLS_ctx.currentPlan.time) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.currentPlan.time?.slice(0, 5));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.currentPlan))
                        return;
                    __VLS_ctx.currentPlan = null;
                    // @ts-ignore
                    [currentPlan, currentPlan, currentPlan, currentPlan, currentPlan, formatDate,];
                } },
            ...{ class: "text-sm text-gray-500 hover:text-gray-700 cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (__VLS_ctx.$t('checkin.change'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.currentPlan))
                        return;
                    __VLS_ctx.showQR = !__VLS_ctx.showQR;
                    // @ts-ignore
                    [$t, showQR, showQR,];
                } },
            ...{ class: "text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer ml-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
        if (__VLS_ctx.showQR) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(__VLS_ctx.origin + '/checkin?plan=' + __VLS_ctx.currentPlan.id)}`),
                ...{ class: "qr-code mx-auto" },
                alt: "QR check-in",
            });
            /** @type {__VLS_StyleScopedClasses['qr-code']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-400 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.$t('checkin.scan_hint'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.currentPlan))
                        return;
                    __VLS_ctx.handleSearch($event.target.value);
                    // @ts-ignore
                    [$t, currentPlan, origin, showQR, handleSearch,];
                } },
            ref: "searchInputRef",
            placeholder: (__VLS_ctx.$t('checkin.search_placeholder')),
            ...{ class: "w-full border border-gray-300 rounded-lg px-4 py-3 text-lg" },
            'aria-describedby': (__VLS_ctx.error ? 'checkin-error' : undefined),
            autofocus: true,
            'data-testid': "search-input",
        });
        (__VLS_ctx.manualForm.search);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        if (__VLS_ctx.searchResults.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-2 mb-4 max-h-60 overflow-y-auto" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-h-60']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
            for (const [member] of __VLS_vFor((__VLS_ctx.searchResults))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.isLoading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!!(!__VLS_ctx.currentPlan))
                                return;
                            if (!(__VLS_ctx.searchResults.length > 0))
                                return;
                            __VLS_ctx.handleCheckIn(member);
                            // @ts-ignore
                            [$t, error, manualForm, searchResults, searchResults, handleCheckIn,];
                        } },
                    key: (member.id),
                    ...{ class: "flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer" },
                    'data-testid': "member-result",
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-blue-50']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "font-medium text-gray-800" },
                });
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
                (member.first_name);
                (member.last_name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "text-sm text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
                (member.email || member.phone || '');
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ class: "px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700" },
                    'data-testid': "checkin-button",
                });
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-green-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-green-700']} */ ;
                (__VLS_ctx.$t('checkin.checkin_button'));
                // @ts-ignore
                [$t,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "border-t border-gray-200 pt-4" },
        });
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.currentPlan))
                        return;
                    __VLS_ctx.showManualCheckIn = true;
                    // @ts-ignore
                    [showManualCheckIn,];
                } },
            ...{ class: "text-sm text-blue-600 hover:text-blue-800" },
            'data-testid': "open-manual-checkin",
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
        (__VLS_ctx.$t('checkin.manual'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-white rounded-xl shadow-sm border border-gray-200 p-6" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-lg font-semibold mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        (__VLS_ctx.$t('checkin.present_count', { count: __VLS_ctx.attendances.length }));
        if (__VLS_ctx.attendances.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-center py-8 text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            (__VLS_ctx.$t('checkin.no_checkin'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
            for (const [att] of __VLS_vFor((__VLS_ctx.attendances))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (att.id),
                    ...{ class: "flex items-center justify-between p-3 bg-gray-50 rounded-lg" },
                    'data-testid': "attendance-item",
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "font-medium text-gray-800" },
                });
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
                (att.first_name);
                (att.last_name);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-xs text-gray-400 ml-2" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                (__VLS_ctx.formatTime(att.check_in_time));
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.isLoading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!!(!__VLS_ctx.currentPlan))
                                return;
                            if (!!(__VLS_ctx.attendances.length === 0))
                                return;
                            __VLS_ctx.handleCheckOut(att.id);
                            // @ts-ignore
                            [$t, $t, $t, attendances, attendances, attendances, formatTime, handleCheckOut,];
                        } },
                    ...{ class: "text-red-500 hover:text-red-700 text-sm cursor-pointer" },
                    'data-testid': "checkout-button",
                });
                /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                // @ts-ignore
                [];
            }
        }
    }
    if (__VLS_ctx.showManualCheckIn) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.showManualCheckIn))
                        return;
                    __VLS_ctx.showManualCheckIn = false;
                    // @ts-ignore
                    [showManualCheckIn, showManualCheckIn,];
                } },
            ...{ class: "fixed inset-0 bg-black/50 flex items-center justify-center z-50" },
            'aria-modal': "true",
            role: "dialog",
        });
        /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
        /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-white rounded-xl p-6 w-full max-w-md shadow-xl" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
            ...{ class: "text-lg font-bold mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        (__VLS_ctx.$t('checkin.manual_title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (__VLS_ctx.handleManualCheckIn) },
            ...{ class: "space-y-4" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
            for: "manual-lastname",
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        (__VLS_ctx.$t('members.last_name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            id: "manual-lastname",
            required: true,
            ...{ class: "w-full border border-gray-300 rounded-lg px-3 py-2" },
            'aria-describedby': (__VLS_ctx.error ? 'checkin-error' : undefined),
            'data-testid': "manual-last-name",
        });
        (__VLS_ctx.manualForm.last_name);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
            for: "manual-firstname",
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        (__VLS_ctx.$t('members.first_name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            id: "manual-firstname",
            ...{ class: "w-full border border-gray-300 rounded-lg px-3 py-2" },
            'aria-describedby': (__VLS_ctx.error ? 'checkin-error' : undefined),
            'data-testid': "manual-first-name",
        });
        (__VLS_ctx.manualForm.first_name);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-3 justify-end pt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.showManualCheckIn))
                        return;
                    __VLS_ctx.showManualCheckIn = false;
                    // @ts-ignore
                    [$t, $t, $t, error, error, manualForm, manualForm, showManualCheckIn, handleManualCheckIn,];
                } },
            type: "button",
            ...{ class: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (__VLS_ctx.$t('checkin.cancel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            disabled: (__VLS_ctx.isSubmitting),
            ...{ class: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer" },
            'data-testid': "manual-checkin-submit",
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-green-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-green-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        if (__VLS_ctx.isSubmitting) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "spinner mr-1" },
                role: "status",
            });
            /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
            /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
        }
        (__VLS_ctx.$t('checkin.checkin_button'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        'aria-live': "polite",
        ...{ style: {} },
    });
}
// @ts-ignore
[$t, $t, isSubmitting, isSubmitting,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

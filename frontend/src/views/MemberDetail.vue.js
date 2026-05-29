import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTeams } from '../composables/useTeams';
import { api } from '../utils/api';
import NotificationPrefs from '../components/NotificationPrefs.vue';
import VolunteerPreferences from '../components/VolunteerPreferences.vue';
import { useToast } from '../stores/toast';
const { t } = useI18n();
const route = useRoute();
const member = ref(null);
const loading = ref(true);
const error = ref('');
const editing = ref(false);
const form = ref({});
const { teams, loadTeams } = useTeams();
const joinTeamId = ref(null);
const joinPosition = ref('');
const typeLabel = (tl) => {
    const key = `memberDetail.types.${tl}`;
    const translated = t(key);
    return translated === key ? tl : translated;
};
async function load() {
    try {
        loading.value = true;
        const id = Number(route.params.id);
        if (isNaN(id))
            throw new Error(t('app.invalid_id'));
        member.value = await api.getMember(id);
        await loadTeams();
        form.value = { ...member.value };
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
}
async function saveMember() {
    const id = Number(route.params.id);
    if (isNaN(id))
        return;
    try {
        await api.updateMember(id, form.value);
        editing.value = false;
        load();
    }
    catch (e) {
        useToast().show(e.message || 'Error', 'error');
    }
}
onMounted(load);
const { show } = useToast();
const leaveTeam = async (teamId) => {
    try {
        const id = Number(route.params.id);
        await api.removeTeamMember(teamId, id);
        show(t('memberDetail.removed_from_ministry'), 'success');
        await load();
    }
    catch (e) {
        show(e.message || t('memberDetail.error'), 'error');
    }
};
function validateAssignment() {
    if (!joinTeamId.value) {
        return t('memberAssignment.no_ministry_selected');
    }
    if (member.value && member.value.teams && member.value.teams.find((x) => x.id === joinTeamId.value)) {
        return t('memberAssignment.already_assigned');
    }
    return null;
}
const joinTeam = async () => {
    const validationError = validateAssignment();
    if (validationError) {
        show(validationError, 'error');
        return;
    }
    try {
        const id = Number(route.params.id);
        await api.addTeamMember(joinTeamId.value, id, joinPosition.value || undefined);
        show(t('memberDetail.joined_ministry'), 'success');
        joinTeamId.value = null;
        joinPosition.value = '';
        await load();
    }
    catch (e) {
        show(e.message || t('memberDetail.error'), 'error');
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
if (__VLS_ctx.member) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['member-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.member))
                    return;
                __VLS_ctx.$router.push('/members');
                // @ts-ignore
                [member, $router,];
            } },
        ...{ class: "back-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
    (__VLS_ctx.$t('memberDetail.back'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.member.first_name);
    (__VLS_ctx.member.last_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('memberDetail.info'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('memberDetail.email'));
    (__VLS_ctx.member.email ?? '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('memberDetail.phone'));
    (__VLS_ctx.member.phone ?? '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('memberDetail.status'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "badge" },
        ...{ class: (__VLS_ctx.member.membership_type ?? 'guest') },
    });
    /** @type {__VLS_StyleScopedClasses['badge']} */ ;
    (__VLS_ctx.typeLabel(__VLS_ctx.member.membership_type ?? 'guest'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.$t('memberDetail.notes'));
    (__VLS_ctx.member.notes ?? '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.member))
                    return;
                __VLS_ctx.editing = !__VLS_ctx.editing;
                // @ts-ignore
                [member, member, member, member, member, member, member, $t, $t, $t, $t, $t, $t, typeLabel, editing, editing,];
            } },
        ...{ class: "edit-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['edit-btn']} */ ;
    (__VLS_ctx.editing ? __VLS_ctx.$t('memberDetail.cancel') : __VLS_ctx.$t('memberDetail.edit'));
    if (__VLS_ctx.editing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.$t('memberDetail.edit_title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (__VLS_ctx.saveMember) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.first_name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
        });
        (__VLS_ctx.form.first_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.last_name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            required: true,
        });
        (__VLS_ctx.form.last_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.email'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "email",
        });
        (__VLS_ctx.form.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.phone'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({});
        (__VLS_ctx.form.phone);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.status'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.form.membership_type),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "guest",
        });
        (__VLS_ctx.$t('memberDetail.types.guest'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "member",
        });
        (__VLS_ctx.$t('memberDetail.types.member'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "inactive",
        });
        (__VLS_ctx.$t('memberDetail.types.inactive'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.$t('memberDetail.notes'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (__VLS_ctx.form.notes),
            rows: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: "save-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
        (__VLS_ctx.$t('memberDetail.save'));
    }
    if (__VLS_ctx.member.teams && __VLS_ctx.member.teams.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.$t('memberDetail.ministries_title', { count: __VLS_ctx.member.teams.length }));
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        for (const [t] of __VLS_vFor(__VLS_ctx.member.teams)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (t.id),
            });
            let __VLS_0;
            /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
            routerLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                to: (`/teams/${t.id}`),
            }));
            const __VLS_2 = __VLS_1({
                to: (`/teams/${t.id}`),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            const { default: __VLS_5 } = __VLS_3.slots;
            (t.name);
            // @ts-ignore
            [member, member, member, member, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, $t, editing, editing, saveMember, form, form, form, form, form, form,];
            var __VLS_3;
            if (t.position) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "position" },
                });
                /** @type {__VLS_StyleScopedClasses['position']} */ ;
                (t.position);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.member))
                            return;
                        if (!(__VLS_ctx.member.teams && __VLS_ctx.member.teams.length > 0))
                            return;
                        __VLS_ctx.leaveTeam(t.id);
                        // @ts-ignore
                        [leaveTeam,];
                    } },
                ...{ class: "ml-3 text-sm text-red-600" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
            (__VLS_ctx.$t('memberDetail.leave'));
            // @ts-ignore
            [$t,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('memberDetail.join_ministry_title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.joinTeamId),
        ...{ class: "px-2 py-1 border rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (null),
    });
    (__VLS_ctx.$t('memberDetail.join_ministry_select'));
    for (const [t] of __VLS_vFor((__VLS_ctx.teams))) {
        __VLS_asFunctionalElement(__VLS_intrinsics.template)({
            key: (t.id),
        });
        if (!__VLS_ctx.member.teams?.find((x) => x.id === t.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: (t.id),
            });
            (t.name);
        }
        // @ts-ignore
        [member, $t, $t, joinTeamId, teams,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: (__VLS_ctx.$t('memberDetail.join_position')),
        ...{ class: "px-2 py-1 border rounded" },
    });
    (__VLS_ctx.joinPosition);
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.joinTeam) },
        ...{ class: "px-3 py-1 bg-green-600 text-white rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-green-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    (__VLS_ctx.$t('memberDetail.join_button'));
    const __VLS_6 = VolunteerPreferences;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        memberId: (Number(__VLS_ctx.route.params.id)),
    }));
    const __VLS_8 = __VLS_7({
        memberId: (Number(__VLS_ctx.route.params.id)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.$t('memberDetail.notifications'));
    const __VLS_11 = NotificationPrefs;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        memberId: (Number(__VLS_ctx.route.params.id)),
    }));
    const __VLS_13 = __VLS_12({
        memberId: (Number(__VLS_ctx.route.params.id)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading" },
    });
    /** @type {__VLS_StyleScopedClasses['loading']} */ ;
    (__VLS_ctx.$t('memberDetail.loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.error);
}
// @ts-ignore
[$t, $t, $t, $t, joinPosition, joinTeam, route, route, loading, error,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

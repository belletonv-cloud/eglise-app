import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '../utils/api';
import { confirmDialog } from '../stores/confirm';
import { useToast } from '../stores/toast';
const route = useRoute();
const { t } = useI18n();
const team = ref(null);
const allMembers = ref([]);
const loading = ref(true);
const error = ref('');
const newMemberId = ref('');
const newPosition = ref('');
const editing = ref({});
const positions = ref({});
const { show } = useToast();
const availableMembers = computed(() => {
    const memberIds = new Set((team.value?.members || []).map((m) => m.id));
    return allMembers.value.filter(m => !memberIds.has(m.id));
});
async function load() {
    try {
        loading.value = true;
        const id = Number(route.params.id);
        if (isNaN(id))
            throw new Error('ID invalide');
        const [teamData, membersData] = await Promise.all([
            api.getTeam(id),
            api.getMembers()
        ]);
        team.value = teamData;
        allMembers.value = membersData;
    }
    catch (e) {
        error.value = e.message;
    }
    finally {
        loading.value = false;
    }
}
async function addMember() {
    if (!newMemberId.value)
        return;
    try {
        await api.addTeamMember(Number(route.params.id), Number(newMemberId.value), newPosition.value || undefined);
        show(t('team.added'), 'success');
        newMemberId.value = '';
        newPosition.value = '';
        load();
    }
    catch (e) {
        show(e.message || t('team.error'), 'error');
    }
}
async function removeMember(memberId) {
    if (!await confirmDialog(t('team.confirm_remove')))
        return;
    try {
        await api.removeTeamMember(Number(route.params.id), memberId);
        show(t('team.removed'), 'success');
        load();
    }
    catch (e) {
        show(e.message || 'Erreur', 'error');
    }
}
function startEdit(memberId, current) {
    editing.value = { ...editing.value, [memberId]: true };
    positions.value = { ...positions.value, [memberId]: current || '' };
}
function cancelEdit(memberId) {
    const copy = { ...editing.value };
    delete copy[memberId];
    editing.value = copy;
}
async function savePosition(memberId) {
    const teamId = Number(route.params.id);
    const pos = positions.value[memberId];
    try {
        await api.updateTeamMember(teamId, memberId, { position: pos });
        show(t('team.position_updated'), 'success');
        cancelEdit(memberId);
        load();
    }
    catch (e) {
        show(e.message || t('team.error'), 'error');
    }
}
onMounted(load);
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
if (__VLS_ctx.team) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "team-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['team-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.team))
                    return;
                __VLS_ctx.$router.push('/teams');
                // @ts-ignore
                [team, $router,];
            } },
        ...{ class: "back-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
    (__VLS_ctx.t('team.back'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.team.name);
    if (__VLS_ctx.team.description) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "desc" },
        });
        /** @type {__VLS_StyleScopedClasses['desc']} */ ;
        (__VLS_ctx.team.description);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('team.members'));
    (__VLS_ctx.team.members?.length || 0);
    if (__VLS_ctx.team.members && __VLS_ctx.team.members.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('table.name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('table.role'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [m] of __VLS_vFor((__VLS_ctx.team.members))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (m.id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            let __VLS_0;
            /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
            routerLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                to: (`/members/${m.id}`),
            }));
            const __VLS_2 = __VLS_1({
                to: (`/members/${m.id}`),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            const { default: __VLS_5 } = __VLS_3.slots;
            (m.first_name);
            (m.last_name);
            // @ts-ignore
            [team, team, team, team, team, team, team, t, t, t, t,];
            var __VLS_3;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            if (__VLS_ctx.editing[m.id]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ class: "px-2 py-1 border rounded" },
                });
                (__VLS_ctx.positions[m.id]);
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.team))
                                return;
                            if (!(__VLS_ctx.team.members && __VLS_ctx.team.members.length > 0))
                                return;
                            if (!(__VLS_ctx.editing[m.id]))
                                return;
                            __VLS_ctx.savePosition(m.id);
                            // @ts-ignore
                            [editing, positions, savePosition,];
                        } },
                    ...{ class: "ml-2 px-2 py-1 bg-blue-600 text-white rounded" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.team))
                                return;
                            if (!(__VLS_ctx.team.members && __VLS_ctx.team.members.length > 0))
                                return;
                            if (!(__VLS_ctx.editing[m.id]))
                                return;
                            __VLS_ctx.cancelEdit(m.id);
                            // @ts-ignore
                            [cancelEdit,];
                        } },
                    ...{ class: "ml-2 px-2 py-1 bg-gray-200 rounded" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                (__VLS_ctx.$t('generic.cancel'));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                (m.position || '-');
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.team))
                                return;
                            if (!(__VLS_ctx.team.members && __VLS_ctx.team.members.length > 0))
                                return;
                            if (!!(__VLS_ctx.editing[m.id]))
                                return;
                            __VLS_ctx.startEdit(m.id, m.position);
                            // @ts-ignore
                            [$t, startEdit,];
                        } },
                    ...{ class: "ml-2 text-sm text-blue-600" },
                });
                /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
                (__VLS_ctx.t('team.edit'));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.team))
                            return;
                        if (!(__VLS_ctx.team.members && __VLS_ctx.team.members.length > 0))
                            return;
                        __VLS_ctx.removeMember(m.id);
                        // @ts-ignore
                        [t, removeMember,];
                    } },
                ...{ class: "delete-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
            (__VLS_ctx.t('team.remove'));
            // @ts-ignore
            [t,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty" },
        });
        /** @type {__VLS_StyleScopedClasses['empty']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('team.add_member'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.addMember) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.newMemberId),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
        disabled: true,
    });
    (__VLS_ctx.t('team.select_member'));
    for (const [m] of __VLS_vFor((__VLS_ctx.availableMembers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (m.id),
            value: (m.id),
        });
        (m.first_name);
        (m.last_name);
        // @ts-ignore
        [t, t, addMember, newMemberId, availableMembers,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('team.position'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: (__VLS_ctx.t('team.position_placeholder')),
    });
    (__VLS_ctx.newPosition);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "add-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    (__VLS_ctx.t('team.add'));
}
else if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading" },
    });
    /** @type {__VLS_StyleScopedClasses['loading']} */ ;
    (__VLS_ctx.t('team.loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error" },
    });
    /** @type {__VLS_StyleScopedClasses['error']} */ ;
    (__VLS_ctx.t('team.error'));
    (__VLS_ctx.error);
}
// @ts-ignore
[t, t, t, t, t, newPosition, loading, error,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

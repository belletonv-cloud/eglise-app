import { ref, computed, onMounted } from 'vue';
import { api } from '../utils/api';
import { showToast } from '../stores/toast';
const tab = ref('roles');
const q = ref('');
const members = ref([]);
const exceptions = ref([]);
const resourcePerms = ref([]);
const newPermission = ref({});
const newGranted = ref({});
const rbacForm = ref({ resource_type: '', resource_id: '', member_id: '', permission: '' });
async function load() {
    members.value = await api.getMembers();
    exceptions.value = await api.getMemberExceptions();
    resourcePerms.value = await api.getResourcePermissions();
}
onMounted(load);
const filtered = computed(() => members.value.filter(m => (m.first_name + ' ' + m.last_name).toLowerCase().includes(q.value.toLowerCase())));
const canAddRbac = computed(() => rbacForm.value.resource_type && rbacForm.value.resource_id && rbacForm.value.member_id && rbacForm.value.permission);
const memberName = (id) => {
    const m = members.value.find(m => m.id === id);
    return m ? `${m.first_name} ${m.last_name}` : `#${id}`;
};
const exceptionsByMember = computed(() => {
    const map = {};
    for (const e of exceptions.value) {
        map[e.member_id] = map[e.member_id] || [];
        map[e.member_id].push(e);
    }
    return map;
});
async function addException(memberId) {
    const perm = newPermission.value[memberId];
    const granted = newGranted.value[memberId];
    if (!perm)
        return showToast('permission required', 'warning');
    await api.createMemberException({ member_id: memberId, permission: perm, granted: granted === true || granted === 'true' });
    await load();
}
async function removeException(id) {
    await api.deleteMemberException(id);
    await load();
}
async function updateRole(m) {
    await api.updateMemberRole(m.id, { role: m.role });
}
async function addResourcePermission() {
    if (!canAddRbac.value)
        return;
    await api.createResourcePermission({
        member_id: Number(rbacForm.value.member_id),
        resource_type: rbacForm.value.resource_type,
        resource_id: Number(rbacForm.value.resource_id),
        permission: rbacForm.value.permission,
        granted: true,
    });
    rbacForm.value = { resource_type: '', resource_id: '', member_id: '', permission: '' };
    await load();
}
async function removeResourcePermission(id) {
    if (!confirm('Supprimer cette permission ?'))
        return;
    await api.deleteResourcePermission(id);
    await load();
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-2xl font-bold mb-4" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
(__VLS_ctx.$t('admin.members.headline'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-6" },
});
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex gap-2 mb-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tab = 'roles';
            // @ts-ignore
            [$t, tab,];
        } },
    ...{ class: (__VLS_ctx.tab === 'roles' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700') },
    ...{ class: "px-4 py-2 rounded-lg cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
(__VLS_ctx.$t('admin.members.tabs.roles'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tab = 'rbac';
            // @ts-ignore
            [$t, tab, tab,];
        } },
    ...{ class: (__VLS_ctx.tab === 'rbac' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700') },
    ...{ class: "px-4 py-2 rounded-lg cursor-pointer" },
});
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
(__VLS_ctx.$t('admin.members.tabs.rbac'));
if (__VLS_ctx.tab === 'roles') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "text-sm sm:text-base" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:text-base']} */ ;
    (__VLS_ctx.$t('table.search'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "Nom",
        ...{ class: "border px-2 py-1 rounded w-full sm:w-auto" },
    });
    (__VLS_ctx.q);
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:w-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full bg-white rounded shadow" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.email'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.role'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('admin.members.exceptions'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [m] of __VLS_vFor((__VLS_ctx.filtered))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (m.id),
            ...{ class: "border-b" },
        });
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (m.first_name);
        (m.last_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (m.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'roles'))
                        return;
                    __VLS_ctx.updateRole(m);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, tab, tab, q, filtered, updateRole,];
                } },
            value: (m.role),
            ...{ class: "border px-2 py-1" },
        });
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "viewer",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "volunteer",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "editor",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "scheduler",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "music_director",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "tech_director",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "admin",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        for (const [e] of __VLS_vFor((__VLS_ctx.exceptionsByMember[m.id] || []))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (e.id),
            });
            (e.permission);
            (e.granted ? __VLS_ctx.$t('admin.members.granted') : __VLS_ctx.$t('admin.members.denied'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.tab === 'roles'))
                            return;
                        __VLS_ctx.removeException(e.id);
                        // @ts-ignore
                        [$t, $t, exceptionsByMember, removeException,];
                    } },
                ...{ class: "text-red-500 cursor-pointer" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mt-2 flex flex-wrap gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            placeholder: "permission",
            ...{ class: "border px-2 py-1 text-sm" },
        });
        (__VLS_ctx.newPermission[m.id]);
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.newGranted[m.id]),
            ...{ class: "border px-2 py-1 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (true),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: (false),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'roles'))
                        return;
                    __VLS_ctx.addException(m.id);
                    // @ts-ignore
                    [newPermission, newGranted, addException,];
                } },
            ...{ class: "px-2 py-1 bg-blue-500 text-white rounded text-sm cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (__VLS_ctx.$t('action.add'));
        // @ts-ignore
        [$t,];
    }
}
if (__VLS_ctx.tab === 'rbac') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mb-4 flex gap-2 items-center" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.rbacForm.resource_type),
        ...{ class: "border px-3 py-2 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('admin.rbac.resource_type_placeholder'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "plan",
    });
    (__VLS_ctx.$t('admin.rbac.resource.plan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "song",
    });
    (__VLS_ctx.$t('admin.rbac.resource.song'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "arrangement",
    });
    (__VLS_ctx.$t('admin.rbac.resource.arrangement'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "team",
    });
    (__VLS_ctx.$t('admin.rbac.resource.team'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        placeholder: "{{$t('admin.rbac.resource_id')}}",
        ...{ class: "border px-3 py-2 rounded w-24" },
    });
    (__VLS_ctx.rbacForm.resource_id);
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.rbacForm.member_id),
        ...{ class: "border px-3 py-2 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('admin.rbac.member_placeholder'));
    for (const [m] of __VLS_vFor((__VLS_ctx.members))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (m.id),
            value: (m.id),
        });
        (m.first_name);
        (m.last_name);
        // @ts-ignore
        [$t, $t, $t, $t, $t, $t, tab, rbacForm, rbacForm, rbacForm, members,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.rbacForm.permission),
        ...{ class: "border px-3 py-2 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.$t('admin.rbac.permission_placeholder'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "view",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "edit",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "schedule",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "admin",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addResourcePermission) },
        disabled: (!__VLS_ctx.canAddRbac),
        ...{ class: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-green-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-green-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    (__VLS_ctx.$t('action.add'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full bg-white rounded shadow" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.member'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.resource'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.id'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.permission'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    (__VLS_ctx.$t('table.access'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "p-2" },
    });
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [p] of __VLS_vFor((__VLS_ctx.resourcePerms))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (p.id),
            ...{ class: "border-b" },
        });
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (__VLS_ctx.memberName(p.member_id));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (p.resource_type);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (p.resource_id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        (p.permission);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (p.granted ? 'text-green-600' : 'text-red-600') },
        });
        (p.granted ? __VLS_ctx.$t('admin.members.granted') : __VLS_ctx.$t('admin.members.denied'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'rbac'))
                        return;
                    __VLS_ctx.removeResourcePermission(p.id);
                    // @ts-ignore
                    [$t, $t, $t, $t, $t, $t, $t, $t, $t, rbacForm, addResourcePermission, canAddRbac, resourcePerms, memberName, removeResourcePermission,];
                } },
            ...{ class: "text-red-500 cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        (__VLS_ctx.$t('action.delete'));
        // @ts-ignore
        [$t,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};

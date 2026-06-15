<template>
    <div>
        <h1 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            {{ $t("admin.members.headline") }}
        </h1>

        <div class="mb-6">
            <div class="flex gap-2 mb-4">
                <button
                    @click="tab = 'roles'"
                    :class="
                        tab === 'roles'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-4 py-2 rounded-lg cursor-pointer"
                >
                    {{ $t("admin.members.tabs.roles") }}
                </button>
                <button
                    @click="tab = 'rbac'"
                    :class="
                        tab === 'rbac'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-4 py-2 rounded-lg cursor-pointer"
                >
                    {{ $t("admin.members.tabs.rbac") }}
                </button>
                <button
                    @click="tab = 'rgpd'"
                    :class="
                        tab === 'rgpd'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-4 py-2 rounded-lg cursor-pointer"
                >
                    {{ $t("admin.members.tabs.rgpd") }}
                </button>
            </div>

            <!-- Roles tab -->
            <div v-if="tab === 'roles'">
                <div
                    class="mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                >
                    <label class="text-sm sm:text-base">{{
                        $t("table.search")
                    }}</label>
                    <input
                        v-model="q"
                        placeholder="Nom"
                        class="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full sm:w-auto"
                    />
                </div>

                <div class="overflow-x-auto">
                    <table
                        class="w-full bg-white dark:bg-gray-900 rounded shadow"
                    >
                        <thead>
                            <tr>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.name") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.email") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.role") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("admin.members.exceptions") }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="m in filtered"
                                :key="m.id"
                                class="border-b border-gray-200 dark:border-gray-700"
                            >
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ m.first_name }} {{ m.last_name }}
                                </td>
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ m.email }}
                                </td>
                                <td class="p-2">
                                    <select
                                        v-model="m.role"
                                        @change="updateRole(m)"
                                        class="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    >
                                        <option value="viewer">viewer</option>
                                        <option value="volunteer">
                                            volunteer
                                        </option>
                                        <option value="editor">editor</option>
                                        <option value="scheduler">
                                            scheduler
                                        </option>
                                        <option value="music_director">
                                            music_director
                                        </option>
                                        <option value="tech_director">
                                            tech_director
                                        </option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td class="p-2">
                                    <ul>
                                        <li
                                            v-for="e in exceptionsByMember[
                                                m.id
                                            ] || []"
                                            :key="e.id"
                                        >
                                            {{ e.permission }} —
                                            {{
                                                e.granted
                                                    ? $t(
                                                          "admin.members.granted",
                                                      )
                                                    : $t("admin.members.denied")
                                            }}
                                            <button
                                                @click="removeException(e.id)"
                                                class="text-red-500 dark:text-red-400 cursor-pointer"
                                            >
                                                x
                                            </button>
                                        </li>
                                    </ul>
                                    <div class="mt-2 flex flex-wrap gap-2">
                                        <input
                                            v-model="newPermission[m.id]"
                                            placeholder="permission"
                                            class="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                        />
                                        <select
                                            v-model="newGranted[m.id]"
                                            class="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                        >
                                            <option :value="true">grant</option>
                                            <option :value="false">deny</option>
                                        </select>
                                        <button
                                            @click="addException(m.id)"
                                            class="px-2 py-1 bg-blue-500 dark:bg-blue-700 text-white rounded text-sm cursor-pointer"
                                        >
                                            {{ $t("action.add") }}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- RGPD tab -->
            <div v-if="tab === 'rgpd'">
                <div class="overflow-x-auto">
                    <table class="w-full bg-white dark:bg-gray-900 rounded shadow">
                        <thead>
                            <tr>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-left">
                                    {{ $t("table.name") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-left">
                                    {{ $t("table.email") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-left">
                                    {{ $t("admin.members.rgpd.origin") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-center">
                                    {{ $t("admin.members.rgpd.consent_sharing") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-center">
                                    {{ $t("admin.members.rgpd.consent_photo") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 text-center">
                                    {{ $t("admin.members.rgpd.consent_communication") }}
                                </th>
                                <th class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="m in members"
                                :key="m.id"
                                class="border-b border-gray-200 dark:border-gray-700"
                            >
                                <td class="p-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                    {{ m.first_name }} {{ m.last_name }}
                                </td>
                                <td class="p-2 text-gray-800 dark:text-gray-200">
                                    {{ m.email || "—" }}
                                </td>
                                <td class="p-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                    {{ m.data_origin || "—" }}
                                </td>
                                <td class="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        :checked="!!m.consent_data_sharing"
                                        @change="toggleConsent(m, 'consent_data_sharing', $event.target.checked)"
                                        class="w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td class="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        :checked="!!m.consent_photo"
                                        @change="toggleConsent(m, 'consent_photo', $event.target.checked)"
                                        class="w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td class="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        :checked="!!m.consent_communication"
                                        @change="toggleConsent(m, 'consent_communication', $event.target.checked)"
                                        class="w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td class="p-2 whitespace-nowrap">
                                    <button
                                        @click="gdprExport(m)"
                                        class="text-blue-600 dark:text-blue-400 hover:underline text-sm cursor-pointer mr-2"
                                    >
                                        {{ $t("admin.members.rgpd.export") }}
                                    </button>
                                    <button
                                        @click="gdprErase(m)"
                                        class="text-red-600 dark:text-red-400 hover:underline text-sm cursor-pointer"
                                    >
                                        {{ $t("admin.members.rgpd.erase") }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-if="members.length === 0" class="text-gray-500 dark:text-gray-400 mt-4">
                    {{ $t("table.no_results") }}
                </p>
            </div>

            <!-- RBAC tab -->
            <div v-if="tab === 'rbac'">
                <div class="mb-4 flex gap-2 items-center">
                    <select
                        v-model="rbacForm.resource_type"
                        class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                        <option value="">
                            {{ $t("admin.rbac.resource_type_placeholder") }}
                        </option>
                        <option value="plan">
                            {{ $t("admin.rbac.resource.plan") }}
                        </option>
                        <option value="song">
                            {{ $t("admin.rbac.resource.song") }}
                        </option>
                        <option value="arrangement">
                            {{ $t("admin.rbac.resource.arrangement") }}
                        </option>
                        <option value="team">
                            {{ $t("admin.rbac.resource.team") }}
                        </option>
                    </select>
                    <input
                        v-model="rbacForm.resource_id"
                        type="number"
                        placeholder="{{$t('admin.rbac.resource_id')}}"
                        class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-24"
                    />
                    <select
                        v-model="rbacForm.member_id"
                        class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                        <option value="">
                            {{ $t("admin.rbac.member_placeholder") }}
                        </option>
                        <option v-for="m in members" :key="m.id" :value="m.id">
                            {{ m.first_name }} {{ m.last_name }}
                        </option>
                    </select>
                    <select
                        v-model="rbacForm.permission"
                        class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                        <option value="">
                            {{ $t("admin.rbac.permission_placeholder") }}
                        </option>
                        <option value="view">Voir</option>
                        <option value="edit">Modifier</option>
                        <option value="schedule">Planifier</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button
                        @click="addResourcePermission"
                        :disabled="!canAddRbac"
                        class="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 cursor-pointer"
                    >
                        {{ $t("action.add") }}
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table
                        class="w-full bg-white dark:bg-gray-900 rounded shadow"
                    >
                        <thead>
                            <tr>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.member") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.resource") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.id") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.permission") }}
                                </th>
                                <th
                                    class="p-2 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                                >
                                    {{ $t("table.access") }}
                                </th>
                                <th class="p-2 bg-gray-50 dark:bg-gray-800"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="p in resourcePerms"
                                :key="p.id"
                                class="border-b border-gray-200 dark:border-gray-700"
                            >
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ memberName(p.member_id) }}
                                </td>
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ p.resource_type }}
                                </td>
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ p.resource_id }}
                                </td>
                                <td
                                    class="p-2 text-gray-800 dark:text-gray-200"
                                >
                                    {{ p.permission }}
                                </td>
                                <td class="p-2">
                                    <span
                                        :class="
                                                p.granted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                        "
                                        >{{
                                            p.granted
                                                ? $t("admin.members.granted")
                                                : $t("admin.members.denied")
                                        }}</span
                                    >
                                </td>
                                <td class="p-2">
                                    <button
                                        @click="removeResourcePermission(p.id)"
                                        class="text-red-500 dark:text-red-400 cursor-pointer"
                                    >
                                        {{ $t("action.delete") }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../utils/api";
import { showToast } from "../stores/toast";

const { t } = useI18n();

const consentUpdating = ref({});

const tab = ref("roles");
const q = ref("");
const members = ref([]);
const exceptions = ref([]);
const resourcePerms = ref([]);
const newPermission = ref({});
const newGranted = ref({});
const rbacForm = ref({
    resource_type: "",
    resource_id: "",
    member_id: "",
    permission: "",
});

async function load() {
    { const r = await api.getMembers(); members.value = r.data ?? r; }
    { const r = await api.getMemberExceptions(); exceptions.value = r.data ?? r; }
    { const r = await api.getResourcePermissions(); resourcePerms.value = r.data ?? r; }
}

onMounted(load);

const filtered = computed(() =>
    members.value.filter((m) =>
        (m.first_name + " " + m.last_name)
            .toLowerCase()
            .includes(q.value.toLowerCase()),
    ),
);

const canAddRbac = computed(
    () =>
        rbacForm.value.resource_type &&
        rbacForm.value.resource_id &&
        rbacForm.value.member_id &&
        rbacForm.value.permission,
);

const memberName = (id) => {
    const m = members.value.find((m) => m.id === id);
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
    if (!perm) return showToast("permission required", "warning");
    await api.createMemberException({
        member_id: memberId,
        permission: perm,
        granted: granted === true || granted === "true",
    });
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
    if (!canAddRbac.value) return;
    await api.createResourcePermission({
        member_id: Number(rbacForm.value.member_id),
        resource_type: rbacForm.value.resource_type,
        resource_id: Number(rbacForm.value.resource_id),
        permission: rbacForm.value.permission,
        granted: true,
    });
    rbacForm.value = {
        resource_type: "",
        resource_id: "",
        member_id: "",
        permission: "",
    };
    await load();
}

async function removeResourcePermission(id) {
    if (!confirm("Supprimer cette permission ?")) return;
    await api.deleteResourcePermission(id);
    await load();
}

async function toggleConsent(m, field, checked) {
    const key = `${m.id}-${field}`;
    if (consentUpdating.value[key]) return;
    consentUpdating.value[key] = true;
    try {
        const body = {
            consent_data_sharing: field === "consent_data_sharing" ? checked : !!m.consent_data_sharing,
            consent_photo: field === "consent_photo" ? checked : !!m.consent_photo,
            consent_communication: field === "consent_communication" ? checked : !!m.consent_communication,
        };
        await api.updateMemberConsent(m.id, body);
        m[field] = checked ? 1 : 0;
        showToast(t("admin.members.rgpd.consent_updated"), "success");
    } catch {
        showToast(t("admin.members.rgpd.consent_error"), "error");
    } finally {
        delete consentUpdating.value[key];
    }
}

async function gdprExport(m) {
    const url = window.URL.createObjectURL(
        new Blob([JSON.stringify(await api.gdprExport(m.id), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${m.first_name}-${m.last_name}-${m.id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(t("admin.members.rgpd.export_done"), "success");
}

async function gdprErase(m) {
    if (!confirm(t("admin.members.rgpd.confirm_erase"))) return;
    await api.gdprErase(m.id);
    showToast(t("admin.members.rgpd.erase_done"), "success");
    await load();
}
</script>

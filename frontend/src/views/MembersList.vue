<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">People</h2>
                <div class="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span class="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-blue-700 dark:text-blue-300">Teams</span>
                    <span class="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5">Add text filter</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ displayMembers.length }} people</span>
                </div>
            </div>
            <button
                @click="showForm = true"
                v-if="isAdmin || canManageMembers"
                class="cursor-pointer rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
                {{ $t("members.add") }}
            </button>
        </div>

        <div
            v-if="isLoading"
            class="py-12 flex flex-col gap-3 items-center animate-pulse"
            aria-busy="true"
        >
            <div class="w-80 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="w-72 h-5 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div class="w-[340px] h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div class="w-80 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span class="text-gray-400 dark:text-gray-500 mt-4">{{ $t("loading") }}</span>
        </div>
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
            {{ error }}
        </div>

        <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                <div class="space-y-5 text-sm">
                    <section>
                        <h3 class="mb-2 font-semibold text-gray-700 dark:text-gray-300">Teams</h3>
                        <div class="space-y-2">
                            <label
                                v-for="team in teams"
                                :key="team.id"
                                class="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300"
                            >
                                <input
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                                    :checked="selectedTeamIds.includes(Number(team.id))"
                                    @change="toggleTeam(Number(team.id))"
                                />
                                <span>{{ team.name }}</span>
                            </label>
                            <p v-if="isLoadingTeams" class="text-xs text-gray-400 dark:text-gray-500">{{ $t("loading") }}</p>
                        </div>
                    </section>
                    <section>
                        <h3 class="mb-2 font-semibold text-gray-700 dark:text-gray-300">Tags</h3>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="tag in availableTags"
                                :key="tag"
                                type="button"
                                class="rounded-full border px-2 py-1 text-xs"
                                :class="selectedTags.includes(tag) ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'"
                                @click="toggleTag(tag)"
                            >
                                {{ tag }}
                            </button>
                        </div>
                    </section>
                    <section>
                        <h3 class="mb-2 font-semibold text-gray-700 dark:text-gray-300">Dates</h3>
                        <div class="space-y-2">
                            <label class="flex items-center gap-2 dark:text-gray-200"><input v-model="dateFilter" type="radio" value="all" /> All</label>
                            <label class="flex items-center gap-2 dark:text-gray-200"><input v-model="dateFilter" type="radio" value="recent" /> Last 90 days</label>
                            <label class="flex items-center gap-2 dark:text-gray-200"><input v-model="dateFilter" type="radio" value="year" /> This year</label>
                            <label class="flex items-center gap-2 dark:text-gray-200"><input v-model="dateFilter" type="radio" value="stale" /> Older</label>
                        </div>
                    </section>
                    <section>
                        <h3 class="mb-2 font-semibold text-gray-700 dark:text-gray-300">Permissions</h3>
                        <div class="space-y-2">
                            <label v-for="perm in permissionFilters" :key="perm" class="flex items-center gap-2 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    :checked="selectedPermissions.includes(perm)"
                                    @change="togglePermission(perm)"
                                />
                                <span>{{ perm }}</span>
                            </label>
                        </div>
                    </section>
                </div>
            </aside>

            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 p-4">
                    <div class="relative max-w-xl">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">🔎</span>
                        <input
                            v-model="searchQuery"
                            data-testid="people-search"
                            type="search"
                            :placeholder="$t('members.search_placeholder')"
                            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-3 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-300 dark:focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                        />
                    </div>
                </div>

                <div v-if="displayMembers.length === 0" class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {{ $t("members.no_members") }}
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">First Name</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Phone Number</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Permissions (Highest)</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Last Scheduled Plan</th>
                                <th v-if="isAdmin || canManageMembers" class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="m in pagedDisplayMembers" :key="m.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{{ m.first_name }} {{ m.last_name }}</td>
                                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ m.phone ?? "-" }}</td>
                                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    <div class="font-medium">{{ highestPermissionLabel(m) }}</div>
                                    <div v-if="memberPermissionHints[m.id]?.length" class="text-xs text-gray-500 dark:text-gray-400">
                                        ({{ memberPermissionHints[m.id]?.join(", ") }})
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatPlanDate(m.last_scheduled_plan) }}</td>
                                <td v-if="isAdmin || canManageMembers" class="px-4 py-3 text-right">
                                    <button
                                        @click="editMember(m)"
                                        class="mr-3 cursor-pointer text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        {{ $t("members.edit") }}
                                    </button>
                                    <button
                                        @click="deleteMember(m.id)"
                                        class="cursor-pointer text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        {{ $t("members.delete") }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div
                class="pagination flex items-center gap-2 justify-center py-4"
                v-if="displayMembers.length > pageSize"
            >
                <button
                    type="button"
                    @click="goPrev"
                    :disabled="page === 1"
                    class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    Précédent
                </button>
                <button
                    v-for="p in totalPages"
                    :key="p"
                    type="button"
                    @click="goToPage(p)"
                    :class="[
                        'px-3 py-1 rounded',
                        {
                            'bg-blue-600 dark:bg-blue-500 text-white': p === page,
                            'bg-gray-100 dark:bg-gray-700': p !== page,
                        },
                    ]"
                >
                    {{ p }}
                </button>
                <button
                    type="button"
                    @click="goNext"
                    :disabled="page === totalPages"
                    class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    Suivant
                </button>
            </div>
        </div>

        <div
            v-if="showForm"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            @click.self="showForm = false"
        >
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
                <h3 class="text-xl font-bold mb-4">
                    {{
                        editing
                            ? $t("members.form_title_edit")
                            : $t("members.form_title_add")
                    }}
                </h3>
                <form @submit.prevent="saveMember" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >{{ $t("members.first_name") }}</label
                            >
                            <input
                                v-model="form.first_name"
                                required
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >{{ $t("members.last_name") }}</label
                            >
                            <input
                                v-model="form.last_name"
                                required
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >{{ $t("members.email") }}</label
                        >
                        <input
                            v-model="form.email"
                            type="email"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >{{ $t("members.phone") }}</label
                        >
                        <input
                            v-model="form.phone"
                            type="tel"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >{{ $t("members.membership_type") }}</label
                        >
                        <select
                            v-model="form.membership_type"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="guest">
                                {{ $t("members.types.guest") }}
                            </option>
                            <option value="member">
                                {{ $t("members.types.member") }}
                            </option>
                            <option value="inactive">
                                {{ $t("members.types.inactive") }}
                            </option>
                        </select>
                    </div>
                    <div class="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            @click="showForm = false"
                            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                        >
                            {{ $t("members.cancel") }}
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer"
                        >
                            {{
                                editing ? $t("members.save") : $t("members.add")
                            }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { getMembers } from "../api/members";
import { useTeams } from "../composables/useTeams";
import { api } from "../utils/api";
import type { Member, Team } from "../utils/types";
type MemberTeam = Team & { position?: string };
type MemberException = { id: number; member_id: number; permission: string; granted: boolean };

import { confirmDialog } from "../stores/confirm";
import { showToast } from "../stores/toast";
import { isAdmin, canManageMembers } from "../stores/member";

const { t } = useI18n();

// Pagination state
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const members = ref<Member[]>([]);
const { teams, loadTeams } = useTeams();
const isLoadingTeams = ref(false);
const selectedTeamIds = ref<number[]>([]);
const selectedTags = ref<string[]>([]);
const selectedPermissions = ref<string[]>([]);
const dateFilter = ref<"all" | "recent" | "year" | "stale">("all");
const searchQuery = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const memberPermissionHints = ref<Record<number, string[]>>({});
const showForm = ref(false);
const editing = ref<number | null>(null);
const form = ref({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    membership_type: "guest",
});

const availableTags = computed(() => ["member", "guest", "inactive"]);
const permissionFilters = ["admin", "scheduler", "music_director", "editor", "viewer"];

const totalPages = computed(() =>
    displayMembers.value.length > 0
        ? Math.max(1, Math.ceil(displayMembers.value.length / pageSize.value))
        : 1,
);

async function fetchMembers() {
    isLoading.value = true;
    error.value = null;
    try {
        const res = await getMembers({
            page: page.value,
            limit: 100,
            q: searchQuery.value,
            teamId: null,
        });
        members.value = res.members ?? [];
        total.value = res.total ?? members.value.length;

        try {
            const exceptions = (await api.getMemberExceptions()) as MemberException[];
            const grouped: Record<number, string[]> = {};
            for (const ex of exceptions || []) {
                if (!ex.granted) continue;
                if (!grouped[ex.member_id]) grouped[ex.member_id] = [];
                const current = grouped[ex.member_id];
                if (current) current.push(ex.permission);
            }
            memberPermissionHints.value = grouped;
        } catch {
            memberPermissionHints.value = {};
        }

        // Correction UX : rollback page si out-of-bounds (classement rafraîchi)
        if (page.value > totalPages.value) {
            page.value = totalPages.value;
            await fetchMembers();
        }
    } catch (e: any) {
        error.value = "Impossible de charger les membres.";
        members.value = [];
        total.value = 0;
    } finally {
        isLoading.value = false;
    }
}

watch(
    [page, pageSize],
    () => {
        fetchMembers();
    },
    { immediate: true },
);

function goToPage(p: number) {
    if (p < 1 || p > totalPages.value || p === page.value) return;
    page.value = p;
}
function goPrev() {
    if (page.value > 1) page.value--;
}
function goNext() {
    if (page.value < totalPages.value) page.value++;
}

const typeLabel = (tl: string, rl?: string) => {
    // Prefer role over membership_type for display
    const effectiveType = tl && tl !== "guest" ? tl : rl || "guest";
    const key = `members.types.${effectiveType}`;
    const translated = t(key);
    return translated === key ? effectiveType : translated;
};
const typeClass = (tl: string) =>
    tl === "member"
        ? "bg-green-100 text-green-700"
        : tl === "inactive"
          ? "bg-gray-100 text-gray-600"
          : "bg-blue-100 text-blue-700";

const highestPermissionLabel = (m: Member) => {
    const role = (m.role || "").trim();
    if (role) return role;
    return typeLabel(m.membership_type ?? "guest", m.role);
};

const formatPlanDate = (value?: string) => {
    if (!value) return "—";
    const dt = new Date(`${value}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
};

const editMember = (m: Member) => {
    editing.value = m.id;
    form.value = {
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email ?? "",
        phone: m.phone ?? "",
        membership_type: m.membership_type ?? "guest",
    };
    showForm.value = true;
};

const deleteMember = async (id: number) => {
    if (!(await confirmDialog(t("members.confirm_delete")))) return;
    try {
        await api.deleteMember(id);
        fetchMembers();
    } catch (e: any) {
        showToast(e.message || "Erreur lors de la suppression", "error");
    }
};

const saveMember = async () => {
    try {
        if (editing.value) {
            await api.updateMember(editing.value, form.value);
        } else {
            await api.createMember(form.value);
        }
        showForm.value = false;
        editing.value = null;
        form.value = {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            membership_type: "guest",
        };
        fetchMembers();
    } catch (e: any) {
        showToast(e.message || "Erreur lors de l'enregistrement", "error");
    }
};

const loadTeamsInternal = async () => {
    isLoadingTeams.value = true;
    try {
        await loadTeams();
        if (selectedTeamIds.value.length === 0) {
            const preferred = new Set([
                "Louange/Adoration Cdm",
                "Pôle Accueil Cdm",
                "Louange SCO",
            ]);
            const defaults = teams.value
                .filter((team) => preferred.has(team.name))
                .slice(0, 3)
                .map((team) => Number(team.id));
            selectedTeamIds.value = defaults;
        }
    } finally {
        isLoadingTeams.value = false;
    }
};
onMounted(() => {
    loadTeamsInternal();
});

let filterDebounce: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, () => {
    if (filterDebounce) clearTimeout(filterDebounce);
    page.value = 1;
    filterDebounce = setTimeout(() => {
        fetchMembers();
    }, 180);
});

const displayMembers = computed(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    return members.value.filter((m) => {
        if (
            selectedTeamIds.value.length > 0 &&
            !((m.teams as MemberTeam[] | undefined) || []).some((t) =>
                selectedTeamIds.value.includes(Number(t.id)),
            )
        ) {
            return false;
        }

        if (selectedTags.value.length > 0) {
            const tag = (m.membership_type || "guest").toLowerCase();
            if (!selectedTags.value.includes(tag)) return false;
        }

        if (selectedPermissions.value.length > 0) {
            const highest = highestPermissionLabel(m).toLowerCase();
            if (!selectedPermissions.value.some((perm) => highest.includes(perm.toLowerCase()))) {
                return false;
            }
        }

        const planDate = m.last_scheduled_plan ? new Date(`${m.last_scheduled_plan}T12:00:00`) : null;
        if (dateFilter.value === "recent" && (!planDate || planDate < ninetyDaysAgo)) return false;
        if (dateFilter.value === "year" && (!planDate || planDate.getFullYear() !== now.getFullYear())) return false;
        if (dateFilter.value === "stale" && (!planDate || planDate.getFullYear() >= now.getFullYear())) return false;

        return true;
    });
});

const pagedDisplayMembers = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return displayMembers.value.slice(start, start + pageSize.value);
});

function toggleTeam(teamId: number) {
    if (selectedTeamIds.value.includes(teamId)) {
        selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== teamId);
    } else {
        selectedTeamIds.value = [...selectedTeamIds.value, teamId];
    }
    page.value = 1;
}

function toggleTag(tag: string) {
    if (selectedTags.value.includes(tag)) {
        selectedTags.value = selectedTags.value.filter((v) => v !== tag);
    } else {
        selectedTags.value = [...selectedTags.value, tag];
    }
    page.value = 1;
}

function togglePermission(permission: string) {
    if (selectedPermissions.value.includes(permission)) {
        selectedPermissions.value = selectedPermissions.value.filter((v) => v !== permission);
    } else {
        selectedPermissions.value = [...selectedPermissions.value, permission];
    }
    page.value = 1;
}
</script>

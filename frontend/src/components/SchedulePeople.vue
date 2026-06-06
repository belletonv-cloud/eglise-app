<template>
    <div
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
    >
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Teams
            </h3>
            <button
                @click="showAdd = true"
                class="cursor-pointer rounded-lg bg-blue-600 dark:bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
                + {{ $t("schedulePeople.add_person.add") }}
            </button>
        </div>

        <div
            v-if="loading"
            class="py-6 text-center text-gray-500 dark:text-gray-400"
        >
            {{ $t("schedulePeople.loading") }}
        </div>

        <div
            v-else
            class="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]"
        >
            <aside
                class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/70 p-4"
            >
                <section class="mb-4">
                    <h4
                        class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                        Are you available for:
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        {{ availabilityLabel }}
                    </p>
                    <div class="mt-3 flex gap-2">
                        <button
                            @click="setAvailability('declined')"
                            class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Decline
                        </button>
                        <button
                            @click="setAvailability('confirmed')"
                            class="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                            Accept
                        </button>
                    </div>
                </section>

                <section class="mb-4">
                    <h4
                        class="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                        Times
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        {{ planTimeLabel }}
                    </p>
                </section>

                <section class="mb-4">
                    <h4
                        class="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                        Files
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        No files for this plan
                    </p>
                </section>

                <section>
                    <h4
                        class="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                        Notes
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        {{ planNotes || "—" }}
                    </p>
                </section>
            </aside>

            <div class="space-y-4">
                <div
                    v-for="group in visibleGroups"
                    :key="group.name"
                    class="rounded-xl border border-gray-200 bg-white p-4"
                >
                    <div class="mb-3 flex items-center justify-between">
                        <div>
                            <h4 class="text-base font-semibold text-gray-800">
                                {{ group.name }}
                            </h4>
                            <div class="mt-1 flex items-center gap-3 text-xs">
                                <span class="text-emerald-600"
                                    >✅ {{ group.confirmed }}</span
                                >
                                <span class="text-red-600"
                                    >❌ {{ group.declined }}</span
                                >
                                <span class="text-amber-600"
                                    >⚪ {{ group.pending }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <table class="min-w-full">
                        <thead class="border-b border-gray-100">
                            <tr>
                                <th
                                    class="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Role
                                </th>
                                <th
                                    class="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Member
                                </th>
                                <th
                                    class="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Status
                                </th>
                                <th
                                    class="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr
                                v-for="p in group.people"
                                :key="p.id"
                                class="hover:bg-gray-50"
                            >
                                <td
                                    class="px-2 py-2 text-sm text-gray-700 dark:text-gray-200"
                                >
                                    {{ p.position || "—" }}
                                </td>
                                <td
                                    class="px-2 py-2 text-sm font-medium text-gray-800 dark:text-gray-100"
                                >
                                    {{ p.first_name }} {{ p.last_name }}
                                </td>
                                <td class="px-2 py-2 text-sm">
                                    <span
                                        :class="statusClass(p.status)"
                                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                                    >
                                        {{ p.status || "pending" }}
                                    </span>
                                </td>
                                <td class="px-2 py-2 text-right">
                                    <button
                                        @click="updateStatus(p, 'confirmed')"
                                        class="mr-2 text-xs text-emerald-600 hover:underline"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        @click="updateStatus(p, 'pending')"
                                        class="mr-2 text-xs text-amber-600 hover:underline"
                                    >
                                        ○
                                    </button>
                                    <button
                                        @click="updateStatus(p, 'declined')"
                                        class="mr-2 text-xs text-red-600 hover:underline"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        @click="remove(p)"
                                        class="text-xs text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        {{ $t("schedulePeople.remove") }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 class="text-sm font-semibold text-gray-700">
                        Other Teams
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {{
                            showAllTeams
                                ? "All teams are showing"
                                : "Only My Teams are showing"
                        }}
                    </p>
                    <button
                        @click="showAllTeams = !showAllTeams"
                        class="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        {{ showAllTeams ? "Show my teams" : "Show all teams" }}
                    </button>
                </div>
            </div>
        </div>

        <div
            v-if="showAdd"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            @click.self="showAdd = false"
        >
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h4 class="mb-4 text-lg font-bold">
                    {{ $t("schedulePeople.add_person.title") }}
                </h4>
                <form @submit.prevent="addPerson" class="space-y-4">
                    <div>
                        <label
                            class="mb-1 block text-sm font-medium text-gray-700"
                            >{{ $t("schedulePeople.add_person.member") }}</label
                        >
                        <select
                            v-model="newPerson.member_id"
                            required
                            class="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                            <option value="" disabled>
                                {{ $t("generic.choose") }}
                            </option>
                            <option
                                v-for="m in availableMembers"
                                :key="m.id"
                                :value="m.id"
                            >
                                {{ m.first_name }} {{ m.last_name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-sm font-medium text-gray-700"
                            >{{ $t("schedulePeople.add_person.role") }}</label
                        >
                        <input
                            v-model="newPerson.position"
                            :placeholder="
                                $t('schedulePeople.add_person.role_placeholder')
                            "
                            class="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-sm font-medium text-gray-700"
                            >{{ $t("schedulePeople.add_person.team") }}</label
                        >
                        <select
                            v-model="newPerson.team_id"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                            <option :value="undefined">
                                {{ $t("schedulePeople.add_person.none") }}
                            </option>
                            <option
                                v-for="t in teams"
                                :key="t.id"
                                :value="t.id"
                            >
                                {{ t.name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            @click="showAdd = false"
                            class="cursor-pointer rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            {{ $t("schedulePeople.add_person.cancel") }}
                        </button>
                        <button
                            type="submit"
                            class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            {{ $t("schedulePeople.add_person.add") }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../utils/api";
import { confirmDialog } from "../stores/confirm";
import { useToast } from "../stores/toast";

const props = defineProps<{ planId: number }>();
const emit = defineEmits<{ changed: [] }>();
const { t } = useI18n();
const { show } = useToast();

type ScheduledPerson = {
    id: number;
    member_id: number;
    team_id?: number;
    team_name?: string;
    first_name: string;
    last_name: string;
    position?: string;
    status?: string;
};

const people = ref<ScheduledPerson[]>([]);
const members = ref<any[]>([]);
const teams = ref<any[]>([]);
const loading = ref(true);
const showAdd = ref(false);
const showAllTeams = ref(false);
const currentMemberId = ref<number | null>(null);
const planDate = ref<string | null>(null);
const planTime = ref<string | null>(null);
const planNotes = ref<string | null>(null);
const newPerson = ref({
    member_id: "",
    position: "",
    team_id: undefined as number | undefined,
});
const availableMembers = ref<any[]>([]);

const groupedTeams = computed(() => {
    const map = new Map<string, ScheduledPerson[]>();
    for (const p of people.value) {
        const name = p.team_name || "Louange/Adoration";
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(p);
    }

    return Array.from(map.entries()).map(([name, teamPeople]) => ({
        name,
        people: teamPeople,
        confirmed: teamPeople.filter((p) => p.status === "confirmed").length,
        declined: teamPeople.filter((p) => p.status === "declined").length,
        pending: teamPeople.filter((p) => !p.status || p.status === "pending")
            .length,
    }));
});

const availabilityLabel = computed(() => {
    const first = groupedTeams.value[0];
    if (!first || first.people.length === 0) return "—";
    const role = first.people[0]?.position || "Team";
    return `${role} ${first.name}`;
});

const visibleGroups = computed(() => {
    if (showAllTeams.value) return groupedTeams.value;
    return groupedTeams.value.slice(0, 1);
});

const planTimeLabel = computed(() => {
    if (!planDate.value) return "—";
    return `${planDate.value}${planTime.value ? ` · ${planTime.value.slice(0, 5)}` : ""}`;
});

const statusClass = (status?: string) =>
    status === "confirmed"
        ? "bg-emerald-100 text-emerald-700"
        : status === "declined"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700";

async function loadPeople() {
    try {
        loading.value = true;
        people.value = (await api.getPlanPeople(props.planId)) || [];
        const scheduledIds = new Set(people.value.map((p) => p.member_id));
        availableMembers.value = members.value.filter(
            (m: any) => !scheduledIds.has(m.id),
        );
    } catch {
        people.value = [];
    } finally {
        loading.value = false;
    }
}

async function updateStatus(p: ScheduledPerson, status: string) {
    await api.updateSchedule(props.planId, p.id, { status });
    p.status = status;
    emit("changed");
}

async function setAvailability(status: "confirmed" | "declined") {
    if (!currentMemberId.value) return;
    const mine = people.value.find(
        (p) => p.member_id === currentMemberId.value,
    );
    if (!mine) return;
    await updateStatus(mine, status);
}

async function addPerson() {
    await api.schedulePerson(props.planId, {
        member_id: parseInt(newPerson.value.member_id),
        position: newPerson.value.position || undefined,
        team_id: newPerson.value.team_id || undefined,
    });
    show(t("schedulePeople.toast.added"), "success");
    showAdd.value = false;
    newPerson.value = { member_id: "", position: "", team_id: undefined };
    await loadPeople();
}

async function remove(p: ScheduledPerson) {
    if (
        !(await confirmDialog(
            `${t("schedulePeople.remove")} ${p.first_name} ${p.last_name} ?`,
        ))
    )
        return;
    await api.removeSchedule(props.planId, p.id);
    await loadPeople();
}

onMounted(async () => {
    try {
        const [membersData, teamsData, meData, planData] = await Promise.all([
            api.getMembers(),
            api.getTeams(),
            api.getMe(),
            api.getPlan(props.planId),
        ]);
        members.value = membersData || [];
        teams.value = teamsData || [];
        currentMemberId.value = meData?.id || null;
        planDate.value = planData?.date || null;
        planTime.value = planData?.time || null;
        planNotes.value = planData?.notes || null;
    } catch {
        members.value = [];
        teams.value = [];
    }
    await loadPeople();
});
</script>

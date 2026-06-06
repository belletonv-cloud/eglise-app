<template>
    <div class="space-y-4">
        <div
            class="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/30 to-white dark:to-gray-900 px-4 py-4 shadow-sm"
        >
            <div
                class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Teams
                    </h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Répartition des équipes façon Planning Center : Band,
                        Audio/Visual et équipes support.
                    </p>
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-medium">
                    <span
                        class="rounded-full bg-white dark:bg-gray-800 px-3 py-1 text-gray-700 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-gray-700"
                    >
                        {{ teamCount }} teams
                    </span>
                    <span
                        class="rounded-full bg-white dark:bg-gray-800 px-3 py-1 text-gray-700 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-gray-700"
                    >
                        {{ assignedCount }} personnes
                    </span>
                    <span
                        class="rounded-full bg-white dark:bg-gray-800 px-3 py-1 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700"
                    >
                        {{ boardStats.band.ok + boardStats.av.ok }} affectations
                    </span>
                </div>
            </div>
        </div>

        <div
            v-if="loading"
            class="grid grid-cols-1 gap-4 lg:grid-cols-2"
            aria-busy="true"
        >
            <div
                v-for="n in 2"
                :key="n"
                class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm animate-pulse"
            >
                <div class="h-6 w-40 rounded bg-gray-200"></div>
                <div
                    class="mt-3 h-4 w-56 rounded bg-gray-100 dark:bg-gray-700"
                ></div>
                <div class="mt-6 space-y-3">
                    <div
                        v-for="i in 4"
                        :key="i"
                        class="h-14 rounded-xl bg-gray-100 dark:bg-gray-700"
                    ></div>
                </div>
            </div>
        </div>

        <div
            v-else-if="error"
            class="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
            {{ error }}
        </div>

        <div
            v-else-if="teamCount === 0"
            class="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
        >
            Aucune équipe disponible pour le moment.
        </div>

        <div v-else class="space-y-4">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section
                    v-for="board in primaryBoards"
                    :key="board.key"
                    class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h4
                                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
                            >
                                {{ board.title }}
                            </h4>
                            <p
                                class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                            >
                                {{ board.subtitle }}
                            </p>
                        </div>
                        <div
                            class="flex items-center gap-2 text-xs font-semibold"
                        >
                            <span
                                class="rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-emerald-700 dark:text-emerald-300"
                            >
                                ✓ {{ board.stats.ok }}
                            </span>
                            <span
                                class="rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-red-600 dark:text-red-400"
                            >
                                ✕ {{ board.stats.missing }}
                            </span>
                            <span
                                class="rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-amber-700 dark:text-amber-300"
                            >
                                ● {{ board.stats.pending }}
                            </span>
                        </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2">
                        <span
                            v-for="team in board.teams"
                            :key="team.id"
                            class="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200"
                        >
                            {{ team.name }}
                        </span>
                    </div>

                    <div
                        v-if="board.stats.pending > 0"
                        class="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-300"
                    >
                        {{ board.stats.pending }} équipe(s) sans affectation
                        complète.
                    </div>

                    <div
                        v-if="board.roles.length === 0"
                        class="mt-5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 px-4 py-8 bg-white dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                        {{ board.emptyMessage }}
                    </div>

                    <div v-else class="mt-5 space-y-3">
                        <div
                            v-for="role in board.roles"
                            :key="role.role"
                            class="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800"
                        >
                            <div
                                class="bg-gray-50/70 dark:bg-gray-800/80 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100"
                            >
                                {{ role.role }}
                            </div>
                            <div
                                class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900"
                            >
                                <div
                                    v-for="member in role.members"
                                    :key="member.id"
                                    class="flex items-center justify-between gap-3 px-4 py-3"
                                >
                                    <div
                                        class="flex min-w-0 items-center gap-3"
                                    >
                                        <div
                                            class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200"
                                        >
                                            {{ initials(member.name) }}
                                        </div>
                                        <div class="min-w-0">
                                            <div
                                                class="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
                                            >
                                                {{ member.name }}
                                            </div>
                                            <div
                                                class="truncate text-xs text-gray-500 dark:text-gray-400"
                                            >
                                                {{
                                                    member.email ||
                                                    "Aucun email"
                                                }}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        v-if="member.email"
                                        :href="`mailto:${member.email}`"
                                        class="shrink-0 rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                                        title="Envoyer un email"
                                    >
                                        ✉️
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section
                v-if="supportTeams.length"
                class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
            >
                <div
                    class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <h4
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            Support teams
                        </h4>
                        <p
                            class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                        >
                            Accueil, enfants et autres équipes utiles autour du
                            service.
                        </p>
                    </div>
                    <div
                        class="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                        {{ supportTeams.length }} équipe(s)
                    </div>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <article
                        v-for="team in supportTeams"
                        :key="team.id"
                        class="rounded-2xl border border-gray-800 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 p-4"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <h5
                                    class="text-base font-semibold text-gray-900 dark:text-gray-100"
                                >
                                    {{ team.name }}
                                </h5>
                                <p
                                    class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {{ team.description || supportLabel(team) }}
                                </p>
                            </div>
                            <span
                                class="rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-gray-700"
                            >
                                {{ team.members?.length || 0 }}
                            </span>
                        </div>

                        <div
                            v-if="!team.members?.length"
                            class="mt-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                            Aucun membre assigné.
                        </div>

                        <div v-else class="mt-4 space-y-2">
                            <div
                                v-for="member in team.members"
                                :key="member.id"
                                class="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-900 px-3 py-2"
                            >
                                <div class="min-w-0">
                                    <div
                                        class="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >
                                        {{ nameOf(member) }}
                                    </div>
                                    <div
                                        class="truncate text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        {{
                                            member.position || "Rôle à préciser"
                                        }}
                                    </div>
                                </div>
                                <div
                                    class="text-xs font-semibold text-gray-400 dark:text-gray-500"
                                >
                                    {{ initials(nameOf(member)) }}
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api } from "../utils/api";

type TeamSummary = {
    id: number;
    name: string;
    description?: string | null;
    service_type?: string | null;
    member_count?: number | string | null;
};

type TeamMember = {
    id: number | string;
    first_name?: string;
    last_name?: string;
    email?: string | null;
    position?: string | null;
};

type TeamDetail = TeamSummary & {
    members?: TeamMember[];
};

type RoleLine = {
    role: string;
    members: { id: number | string; name: string; email?: string | null }[];
};

type BoardStats = {
    ok: number;
    missing: number;
    pending: number;
};

const loading = ref(true);
const error = ref("");
const allTeams = ref<TeamDetail[]>([]);

function normalizeText(value: string | null | undefined): string {
    return (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function nameOf(member: TeamMember): string {
    const name = `${member.first_name || ""} ${member.last_name || ""}`.trim();
    return name || `Member #${member.id}`;
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

function isBandTeam(team: TeamSummary): boolean {
    const text = normalizeText(
        `${team.name} ${team.description || ""} ${team.service_type || ""}`,
    );
    const serviceType = normalizeText(team.service_type);
    return (
        ["worship", "music", "band"].includes(serviceType) ||
        text.includes("louange") ||
        text.includes("worship") ||
        text.includes("band") ||
        text.includes("chorale") ||
        text.includes("choir")
    );
}

function isAvTeam(team: TeamSummary): boolean {
    const text = normalizeText(
        `${team.name} ${team.description || ""} ${team.service_type || ""}`,
    );
    const serviceType = normalizeText(team.service_type);
    return (
        ["sound", "lights", "video", "audio", "visual"].includes(serviceType) ||
        text.includes("audio") ||
        text.includes("visual") ||
        text.includes("av") ||
        text.includes("son") ||
        text.includes("lumiere") ||
        text.includes("video") ||
        text.includes("multimedia") ||
        text.includes("camera") ||
        text.includes("pro presenter")
    );
}

function supportLabel(team: TeamSummary): string {
    const serviceType = normalizeText(team.service_type);
    if (serviceType === "welcome") return "Accueil et hospitalité";
    if (serviceType === "children") return "Équipe enfants";
    return "Équipe support";
}

function buildRoles(teams: TeamDetail[]): RoleLine[] {
    const roleMap = new Map<
        string,
        { id: number | string; name: string; email?: string | null }[]
    >();

    for (const team of teams) {
        for (const member of team.members || []) {
            const role = (member.position || "").trim() || "Rôle à préciser";
            const members = roleMap.get(role) || [];
            members.push({
                id: member.id,
                name: nameOf(member),
                email: member.email || null,
            });
            roleMap.set(role, members);
        }
    }

    return Array.from(roleMap.entries())
        .map(([role, members]) => ({
            role,
            members: members.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => {
            if (a.role === "Rôle à préciser") return 1;
            if (b.role === "Rôle à préciser") return -1;
            return a.role.localeCompare(b.role);
        });
}

function buildStats(teams: TeamDetail[]): BoardStats {
    const members = teams.flatMap((team) => team.members || []);
    const ok = members.filter((member) =>
        Boolean(member.position?.trim()),
    ).length;
    const missing = members.filter((member) => !member.position?.trim()).length;
    const pending = teams.filter((team) => !(team.members || []).length).length;
    return { ok, missing, pending };
}

const bandTeams = computed(() => allTeams.value.filter(isBandTeam));
const avTeams = computed(() => allTeams.value.filter(isAvTeam));
const supportTeams = computed(() =>
    allTeams.value.filter((team) => !isBandTeam(team) && !isAvTeam(team)),
);

const boardStats = computed(() => ({
    band: buildStats(bandTeams.value),
    av: buildStats(avTeams.value),
}));

const primaryBoards = computed(() => [
    {
        key: "band",
        title: "Band",
        subtitle: "Voix, instruments, direction musicale",
        teams: bandTeams.value,
        roles: buildRoles(bandTeams.value),
        stats: boardStats.value.band,
        emptyMessage: "Aucune équipe musique détectée.",
    },
    {
        key: "av",
        title: "Audio/Visual",
        subtitle: "Son, lumières, vidéo et projection",
        teams: avTeams.value,
        roles: buildRoles(avTeams.value),
        stats: boardStats.value.av,
        emptyMessage: "Aucune équipe audio/visuel détectée.",
    },
]);

const teamCount = computed(() => allTeams.value.length);
const assignedCount = computed(() =>
    allTeams.value.reduce((sum, team) => sum + (team.members?.length || 0), 0),
);

async function load() {
    loading.value = true;
    error.value = "";

    try {
        const summaries = (await api.getTeams({
            page: 1,
            size: 100,
        } as any)) as TeamSummary[] | null;
        const safeSummaries = Array.isArray(summaries) ? summaries : [];
        const detailedTeams = await Promise.all(
            safeSummaries.map(async (summary) => {
                const detail = await api.getTeam(summary.id);
                if (!detail) return { ...summary, members: [] } as TeamDetail;
                return {
                    ...summary,
                    ...detail,
                    members: Array.isArray(detail.members)
                        ? detail.members
                        : [],
                } as TeamDetail;
            }),
        );
        allTeams.value = detailedTeams;
    } catch (err: any) {
        error.value = err?.message || "Erreur de chargement des équipes";
        allTeams.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>

<template>
    <div class="relative">
        <div
            class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-transparent focus-within:border-emerald-300 dark:focus-within:border-emerald-700"
        >
            <span class="text-gray-400 dark:text-gray-500">🔍</span>
            <input
                v-model="query"
                @input="search"
                @keydown.escape="close"
                @keydown.enter="goFirst"
                :placeholder="$t('search.placeholder')"
                class="bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 w-full placeholder-gray-400 dark:placeholder-gray-500"
            />
        </div>
        <div
            v-if="
                query.trim().length >= 2 &&
                (loading || results.length || searched)
            "
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 max-h-80 overflow-y-auto z-50"
        >
            <div
                v-if="loading"
                class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
            >
                {{ $t("loading") }}
            </div>
            <div
                v-for="r in results"
                :key="r.type + r.id"
                @click="navigate(r)"
                class="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
                <span class="text-lg">{{ r.icon || iconFor(r.type) }}</span>
                <div class="flex-1 min-w-0">
                    <div
                        class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate"
                    >
                        {{ labelFor(r) }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ detailFor(r) }}
                    </div>
                </div>
            </div>
            <div
                v-if="!loading && searched && results.length === 0"
                class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
            >
                {{ $t("search.no_results") }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { authenticatedFetch, getApiBase } from "../utils/api";

const router = useRouter();
const { t } = useI18n();
const query = ref("");
const results = ref<any[]>([]);
const loading = ref(false);
const searched = ref(false);
let timeout: any = null;
let activeRequest = 0;

const quickLinks = computed(() => [
    {
        id: "services-center",
        type: "route",
        title: t("apps.services_center_title"),
        description: t("apps.services_center_desc"),
        to: "/services-center",
        icon: "🗂️",
    },
    {
        id: "serving-schedule",
        type: "route",
        title: t("apps.serving_schedule_title"),
        description: t("apps.serving_schedule_desc"),
        to: "/serving-schedule",
        icon: "📅",
    },
    {
        id: "music-stand",
        type: "route",
        title: t("apps.music_stand_title"),
        description: t("apps.music_stand_desc"),
        to: "/music-stand-app",
        icon: "🎼",
    },
    {
        id: "members",
        type: "route",
        title: t("menu.members"),
        description: t("apps.members_desc"),
        to: "/members",
        icon: "👥",
    },
    {
        id: "teams",
        type: "route",
        title: t("menu.teams"),
        description: t("apps.teams_desc"),
        to: "/teams",
        icon: "🎛️",
    },
    {
        id: "songs",
        type: "route",
        title: t("menu.songs"),
        description: t("apps.songs_desc"),
        to: "/songs",
        icon: "🎵",
    },
    {
        id: "calendar",
        type: "route",
        title: t("menu.calendar"),
        description: t("menu.section_services"),
        to: "/calendar",
        icon: "📅",
    },
    {
        id: "events",
        type: "route",
        title: t("menu.events"),
        description: t("apps.announcements_desc"),
        to: "/events",
        icon: "📍",
    },
    {
        id: "announcements",
        type: "route",
        title: t("menu.announcements"),
        description: t("apps.announcements_desc"),
        to: "/annonces",
        icon: "📢",
    },
    {
        id: "directory",
        type: "route",
        title: t("menu.directory"),
        description: t("menu.section_people"),
        to: "/annuaire",
        icon: "📖",
    },
]);

function matchesQuickLink(
    link: { title: string; description: string },
    term: string,
): boolean {
    const haystack = `${link.title} ${link.description}`.toLowerCase();
    return haystack.includes(term);
}

function buildResults(term: string, apiResults: any[]) {
    const shortcuts = quickLinks.value.filter((link) =>
        matchesQuickLink(link, term),
    );
    const merged = [...shortcuts, ...apiResults];
    const seen = new Set<string>();
    return merged.filter((item) => {
        const key =
            item.type === "route"
                ? `route:${item.id}`
                : `${item.type}:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

const search = () => {
    clearTimeout(timeout);
    const term = query.value.trim();
    activeRequest += 1;
    if (term.length < 2) {
        results.value = [];
        loading.value = false;
        searched.value = false;
        return;
    }
    timeout = setTimeout(async () => {
        const requestId = activeRequest;
        loading.value = true;
        searched.value = false;
        try {
            const base = getApiBase();
            const res = await authenticatedFetch(
                `${base}/api/search?q=${encodeURIComponent(term)}`,
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (requestId !== activeRequest) return;
            results.value = buildResults(
                term.toLowerCase(),
                Array.isArray(data.results) ? data.results : [],
            );
        } catch {
            if (requestId !== activeRequest) return;
            results.value = buildResults(term.toLowerCase(), []);
        } finally {
            if (requestId === activeRequest) {
                loading.value = false;
                searched.value = true;
            }
        }
    }, 250);
};

const iconFor = (type: string) => {
    const icons: Record<string, string> = {
        route: "🧭",
        member: "👤",
        song: "🎵",
        plan: "📅",
        team: "🎪",
        announcement: "📢",
        church_event: "📍",
    };
    return icons[type] || "📌";
};

const labelFor = (r: any) => {
    if (r.type === "route") return r.title;
    if (r.type === "member") return `${r.first_name} ${r.last_name}`;
    if (r.type === "song") return r.title;
    if (r.type === "plan")
        return `${r.service_type || t("plan.service")}${t("generic.separator")}${r.date}`;
    if (r.type === "team") return r.name;
    if (r.type === "announcement") return r.content?.slice(0, 80);
    if (r.type === "church_event") return r.title;
    return "";
};

const detailFor = (r: any) => {
    if (r.type === "route") return r.description;
    if (r.type === "member") return r.email || r.phone || "";
    if (r.type === "song") return r.author || "";
    if (r.type === "plan") return r.theme || r.notes || "";
    if (r.type === "team") return r.description || "";
    if (r.type === "announcement")
        return r.type === "prayer"
            ? `🙏 ${t("search.typePrayer")}`
            : `📢 ${t("plan.type.announcement")}`;
    if (r.type === "church_event") return r.location || r.start_date || "";
    return "";
};

const navigate = (r: any) => {
    results.value = [];
    query.value = "";
    searched.value = false;
    if (r.type === "route") router.push(r.to);
    else if (r.type === "member") router.push(`/members/${r.id}`);
    else if (r.type === "song") router.push(`/song/${r.id}`);
    else if (r.type === "plan") router.push(`/plans/${r.id}`);
    else if (r.type === "team") router.push(`/teams/${r.id}`);
    else if (r.type === "announcement") router.push("/annonces");
    else if (r.type === "church_event") router.push("/events");
};

const goFirst = () => {
    if (results.value.length) navigate(results.value[0]);
};
const close = () => {
    clearTimeout(timeout);
    results.value = [];
    query.value = "";
    loading.value = false;
    searched.value = false;
    activeRequest += 1;
};

onBeforeUnmount(() => {
    clearTimeout(timeout);
});
</script>

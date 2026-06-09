<template>
    <div>
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            {{ $t("conflictlog.title") }}
        </h2>
        <div class="mb-4 flex gap-3">
            <div>
                <label class="text-sm text-gray-600 dark:text-gray-400 mr-2">{{
                    $t("conflictlog.filter_plan")
                }}</label>
                <select
                    v-model="planId"
                    class="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                    <option :value="null" class="bg-white dark:bg-gray-800">
                        {{ $t("conflictlog.all") }}
                    </option>
                    <option
                        v-for="p in plans"
                        :key="p.id"
                        :value="p.id"
                        class="bg-white dark:bg-gray-800"
                    >
                        {{ p.date }} — {{ p.theme || p.id }}
                    </option>
                </select>
            </div>
            <div>
                <label class="text-sm text-gray-600 dark:text-gray-400 mr-2">{{
                    $t("conflictlog.filter_member")
                }}</label>
                <input
                    v-model="memberQuery"
                    :placeholder="$t('conflictlog.placeholder_member')"
                    class="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full bg-white dark:bg-gray-900 rounded shadow">
                <thead class="bg-gray-50 dark:bg-gray-900/50">
                    <tr
                        class="text-left border-b border-gray-200 dark:border-gray-700"
                    >
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.date") }}
                        </th>
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.service") }}
                        </th>
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.member") }}
                        </th>
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.assignment") }}
                        </th>
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.forced_by") }}
                        </th>
                        <th class="p-2 text-gray-600 dark:text-gray-300">
                            {{ $t("conflictlog.note") }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="r in rows"
                        :key="r.id"
                        class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{ r.created_at }}
                        </td>
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{ r.plan_id }}
                        </td>
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{ r.first_name }} {{ r.last_name }}
                        </td>
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{
                                r.existing_team_name || $t("conflictlog.dash")
                            }}
                            ({{ $t("conflictlog.scheduled") }}
                            {{ r.existing_scheduled_id }})
                        </td>
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{ r.forced_by }}
                        </td>
                        <td class="p-2 text-gray-800 dark:text-gray-200">
                            {{ r.note || $t("conflictlog.dash") }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex items-center gap-3">
            <button
                @click="prev"
                class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200"
            >
                {{ $t("conflictlog.prev") }}
            </button>
            <span class="text-gray-500 dark:text-gray-400"
                >{{ $t("conflictlog.page") }} {{ page }}</span
            >
            <button
                @click="next"
                class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200"
            >
                {{ $t("conflictlog.next") }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../utils/api";

const { t } = useI18n();

const rows = ref<any[]>([]);
const plans = ref<any[]>([]);
const planId = ref<number | null>(null);
const memberQuery = ref("");
const page = ref(1);
const per = ref(25);

async function load() {
    const res = await api.getConflictLogs({
        plan_id: planId.value || undefined,
        page: page.value,
        per: per.value,
        member_query: memberQuery.value || undefined,
    });
    // server response: { rows, page, per }
    if ((res as any).rows) {
        rows.value = (res as any).rows;
        page.value = (res as any).page || 1;
    } else {
        rows.value = res as any;
    }
}

onMounted(async () => {
    plans.value = await api.getPlans();
    await load();
});

watch([planId, memberQuery], () => {
    page.value = 1;
    load();
});

function prev() {
    if (page.value > 1) {
        page.value--;
        api.getConflictLogs({ plan_id: planId.value || undefined });
        load();
    }
}
function next() {
    page.value++;
    load();
}
</script>

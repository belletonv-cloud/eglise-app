<template>
    <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4"
    >
        <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">
                {{ $t("planChecklist.title") }}
            </h3>
            <button
                @click="addFromTemplate"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
            >
                {{ $t("planChecklist.add_template") }}
            </button>
        </div>

        <div
            v-if="items.length === 0"
            class="text-center py-4 text-sm text-gray-400 dark:text-gray-500"
        >
            {{ $t("planChecklist.no_items") }}
        </div>

        <div class="space-y-1">
            <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
            >
                <input
                    type="checkbox"
                    :checked="!!item.done"
                    @change="toggle(item)"
                    class="rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <div class="flex-1">
                    <span
                        :class="
                            item.done
                                ? 'line-through text-gray-400'
                                : 'text-gray-700 dark:text-gray-300'
                        "
                        class="text-sm"
                        >{{ item.label }}</span
                    >
                    <span
                        v-if="item.position"
                        class="text-xs text-gray-400 ml-2"
                        >[{{ item.position }}]</span
                    >
                </div>
                <button
                    @click="remove(item)"
                    class="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                    ✕
                </button>
            </div>
        </div>

        <div class="mt-3 flex gap-2">
            <input
                v-model="newLabel"
                @keyup.enter="addCustom"
                :placeholder="$t('planChecklist.new_task')"
                class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            />
            <input
                v-model="newPosition"
                :placeholder="$t('planChecklist.position')"
                class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            />
            <button
                @click="addCustom"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            >
                +
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../utils/api";

const props = defineProps<{ planId: number; serviceTypeId?: number | null }>();
const emit = defineEmits<{ changed: [] }>();
const { t } = useI18n();

const items = ref<any[]>([]);
const newLabel = ref("");
const newPosition = ref("");

const load = async () => {
    try {
        { const r = await api.getPlanChecklist(props.planId); items.value = r.data ?? r; }
    } catch {
        /* ignore */
    }
};

const addFromTemplate = async () => {
    if (!props.serviceTypeId) return;
    try {
        const r = await api.getChecklistTemplates({ service_type_id: props.serviceTypeId });
        const templates = r.data ?? r;
        for (const tpl of templates) {
            for (const ti of (tpl as { items?: any[] }).items || []) {
                await api.addPlanChecklistItem(props.planId, {
                    position: tpl.position,
                    label: ti.label,
                });
            }
        }
        await load();
    } catch {
        /* ignore */
    }
};

const addCustom = async () => {
    if (!newLabel.value) return;
    try {
        await api.addPlanChecklistItem(props.planId, {
            position: newPosition.value || t("planChecklist.general"),
            label: newLabel.value,
        });
        newLabel.value = "";
        newPosition.value = "";
        await load();
    } catch {
        /* ignore */
    }
};

const toggle = async (item: any) => {
    try {
        const updated = await api.updatePlanChecklist(item.id, {
            done: !item.done,
        });
        Object.assign(item, updated);
    } catch {
        /* ignore */
    }
};

const remove = async (item: any) => {
    try {
        await api.deletePlanChecklist(item.id);
        items.value = items.value.filter((i: any) => i.id !== item.id);
    } catch {
        /* ignore */
    }
};

onMounted(load);
</script>

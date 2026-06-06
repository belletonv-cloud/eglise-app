<template>
    <div class="max-w-5xl mx-auto dark:text-gray-100">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {{ $t("adminContent.title") }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ $t("adminContent.description") }}
        </p>

        <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >{{ $t("adminContent.filter") }} :</label
            >
            <select
                v-model="selectedCategory"
                class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
                <option value="">{{ $t("adminContent.all") }}</option>
                <option
                    v-for="(label, key) in categories"
                    :key="key"
                    :value="key"
                >
                    {{ label }}
                </option>
            </select>
            <span class="text-sm text-gray-400 dark:text-gray-500"
                >{{ filteredKeys.length }} clés</span
            >
            <span
                v-if="overridesCount > 0"
                class="text-sm text-amber-600 dark:text-amber-400 font-medium"
                >{{ overridesCount }} override(s)</span
            >
        </div>

        <div
            v-if="filteredKeys.length === 0"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500"
        >
            {{ $t("adminContent.no_keys") }}
        </div>

        <div
            v-else
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            <table class="w-full text-sm">
                <thead
                    class="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700"
                >
                    <tr>
                        <th
                            class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-64"
                        >
                            {{ $t("adminContent.key") }}
                        </th>
                        <th
                            class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300"
                        >
                            {{ $t("adminContent.current") }}
                        </th>
                        <th
                            class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300"
                        >
                            {{ $t("adminContent.override") }}
                        </th>
                        <th
                            class="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-24"
                        >
                            {{ $t("adminContent.reset") }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr
                        v-for="key in filteredKeys"
                        :key="key"
                        :class="{
                            'bg-amber-50 dark:bg-amber-900/20':
                                hasOverride(key),
                        }"
                    >
                        <td
                            class="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 align-top whitespace-nowrap"
                        >
                            {{ key }}
                        </td>
                        <td
                            class="px-4 py-3 text-gray-800 dark:text-gray-200 align-top"
                        >
                            {{ currentValue(key) }}
                        </td>
                        <td class="px-4 py-3 align-top">
                            <textarea
                                :value="getOverride(key)"
                                @input="
                                    setOverride(
                                        key,
                                        ($event.target as HTMLTextAreaElement)
                                            .value,
                                    )
                                "
                                rows="2"
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                :class="{
                                    'border-amber-400 ring-1 ring-amber-200':
                                        hasOverride(key),
                                }"
                            ></textarea>
                        </td>
                        <td class="px-4 py-3 text-center align-top">
                            <button
                                v-if="hasOverride(key)"
                                @click="resetKey(key)"
                                class="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline cursor-pointer"
                            >
                                {{ $t("adminContent.reset") }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="savedMessage"
            class="mt-4 text-sm text-green-600 dark:text-green-400 font-medium"
        >
            {{ $t("adminContent.saved") }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import _frMessages from "../locales/fr";
const frMessages = _frMessages as Record<string, any>;

const { t } = useI18n();

const STORAGE_KEY = "i18n-overrides";
const overrides = ref<Record<string, string>>({});
const selectedCategory = ref("");
const savedMessage = ref(false);

const categories = computed(() => {
    const cats: Record<string, string> = {};
    for (const key of Object.keys(frMessages)) {
        if (
            typeof frMessages[key] === "object" &&
            !Array.isArray(frMessages[key]) &&
            frMessages[key] !== null
        ) {
            const catLabel = t(`adminContent.categories.${key}`) || key;
            cats[key] = catLabel;
        }
    }
    return cats;
});

function flattenKeys(obj: Record<string, any>, prefix = ""): string[] {
    let keys: string[] = [];
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (
            typeof obj[key] === "object" &&
            !Array.isArray(obj[key]) &&
            obj[key] !== null
        ) {
            keys = keys.concat(flattenKeys(obj[key], fullKey));
        } else if (typeof obj[key] === "string") {
            keys.push(fullKey);
        }
    }
    return keys;
}

const allKeys = ref<string[]>([]);

onMounted(() => {
    allKeys.value = flattenKeys(frMessages);
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) overrides.value = JSON.parse(stored);
    } catch {
        /* ignore */
    }
});

const filteredKeys = computed(() => {
    if (!selectedCategory.value) return allKeys.value;
    return allKeys.value.filter((k) =>
        k.startsWith(selectedCategory.value + "."),
    );
});

function currentValue(key: string): string {
    const val = t(key);
    return val || getValueByPath(frMessages, key) || "";
}

function getValueByPath(obj: any, path: string): string | null {
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
            current = current[part];
        } else {
            return null;
        }
    }
    return typeof current === "string" ? current : null;
}

function getOverride(key: string): string {
    return overrides.value[key] || "";
}

function hasOverride(key: string): boolean {
    return key in overrides.value && overrides.value[key] !== "";
}

function setOverride(key: string, value: string) {
    if (value) {
        overrides.value[key] = value;
    } else {
        delete overrides.value[key];
    }
    saveOverrides();
}

function resetKey(key: string) {
    delete overrides.value[key];
    saveOverrides();
}

function saveOverrides() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides.value));
    savedMessage.value = true;
    setTimeout(() => {
        savedMessage.value = false;
    }, 2000);
}

const overridesCount = computed(() => Object.keys(overrides.value).length);
</script>

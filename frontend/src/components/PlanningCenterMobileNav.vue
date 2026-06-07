<template>
    <div
        class="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur"
    >
        <div
            class="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2 text-[11px] text-gray-700 dark:text-gray-300"
        >
            <button
                v-for="item in items"
                :key="item.key"
                class="flex flex-col items-center gap-1 rounded-lg py-1"
                @click="router.push(item.to)"
            >
                <span
                    :class="
                        isActive(item.key)
                            ? 'text-[#2ECC71]'
                            : 'text-gray-700 dark:text-gray-300'
                    "
                >
                    {{ item.icon }}
                </span>
                <span
                    :class="
                        isActive(item.key) ? 'font-semibold text-[#2ECC71]' : ''
                    "
                >
                    {{ item.label }}
                </span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
    active: "schedule" | "plans" | "songs" | "media" | "people";
}>();

const router = useRouter();

const items = computed(() => [
    { key: "schedule", label: "Schedule", icon: "📅", to: "/serving-schedule" },
    { key: "plans", label: "Plans", icon: "🧾", to: "/services-center" },
    { key: "songs", label: "Songs", icon: "🎵", to: "/music-stand-app" },
    { key: "media", label: "Media", icon: "📺", to: "/youtube" },
    { key: "people", label: "People", icon: "👥", to: "/members" },
]);

function isActive(key: string) {
    return props.active === key;
}
</script>

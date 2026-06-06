<template>
    <div class="max-w-6xl mx-auto p-4">
        <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Teams
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Band / Audio‑Visual — dashboard de préparation
                </p>
            </div>
            <router-link
                to="/services-center"
                class="text-sm text-blue-700 hover:underline shrink-0"
            >
                ← Services Center
            </router-link>
        </div>

        <div class="mt-4">
            <TeamsDashboardPanel />
        </div>

        <div class="mt-5 text-xs text-gray-400">
            Données réelles : basé sur les Teams existantes (/api/teams +
            /api/teams/:id) et les positions assignées.
        </div>
    </div>
</template>

<script setup lang="ts">
import TeamsDashboardPanel from "../components/TeamsDashboardPanel.vue";
</script>

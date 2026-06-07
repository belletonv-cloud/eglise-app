<template>
    <div class="max-w-4xl mx-auto dark:text-gray-100">
        <div class="mb-6">
            <router-link to="/" class="text-blue-600 hover:underline text-sm">{{
                $t("about.back")
            }}</router-link>
        </div>

        <div
            class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-6"
        >
            <div class="text-center mb-8">
                <h1
                    class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3"
                >
                    {{ $t("about.welcome") }}
                </h1>
                <p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {{ $t("about.subtitle") }}
                </p>
            </div>

            <h2
                class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6"
            >
                {{ $t("about.modules_title") }}
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <router-link
                    to="/compare"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors md:col-span-2"
                >
                    <span class="text-3xl mt-1">🧾</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            Comparatif des fonctionnalités
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            Tableau Planning Center vs Église App + vision
                            "modules standalone".
                        </p>
                    </div>
                </router-link>
                <router-link
                    to="/plans"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    <span class="text-3xl mt-1">📋</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ $t("about.module_services") }}
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            {{ $t("about.module_services_desc") }}
                        </p>
                    </div>
                </router-link>

                <router-link
                    to="/members"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    <span class="text-3xl mt-1">👥</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ $t("about.module_members") }}
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            {{ $t("about.module_members_desc") }}
                        </p>
                    </div>
                </router-link>

                <router-link
                    to="/songs"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    <span class="text-3xl mt-1">🎵</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ $t("about.module_music") }}
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            {{ $t("about.module_music_desc") }}
                        </p>
                    </div>
                </router-link>

                <router-link
                    to="/email"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    <span class="text-3xl mt-1">📧</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ $t("about.module_communication") }}
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            {{ $t("about.module_communication_desc") }}
                        </p>
                    </div>
                </router-link>

                <router-link
                    to="/admin"
                    class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors md:col-span-2"
                >
                    <span class="text-3xl mt-1">⚙️</span>
                    <div>
                        <h3
                            class="font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ $t("about.module_admin") }}
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-300 mt-1"
                        >
                            {{ $t("about.module_admin_desc") }}
                        </p>
                    </div>
                </router-link>
            </div>
        </div>

        <div
            class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-400 dark:text-gray-500"
        >
            <p>{{ $t("about.version") }}: 1.0.0</p>
            <p class="mt-1">{{ $t("about.credits") }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

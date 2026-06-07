<template>
    <div class="login">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {{ $t("login.title") }}
            </h2>
            <div class="flex items-center gap-2">
                <button
                    @click="toggleLang"
                    class="px-2 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    :title="lang === 'fr' ? 'English' : 'Français'"
                >
                    {{ lang === "fr" ? "EN" : "FR" }}
                </button>
                <button
                    @click="toggleDarkMode"
                    class="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    :title="isDark ? $t('app.light_mode') : $t('app.dark_mode')"
                >
                    <svg
                        v-if="isDark"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="12" r="5" stroke-linecap="round" />
                        <path
                            stroke-linecap="round"
                            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                        />
                    </svg>
                    <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                        />
                    </svg>
                </button>
            </div>
        </div>
        <div class="login-form">
            <input
                v-model="email"
                type="email"
                :placeholder="$t('login.email')"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
            <input
                v-model="password"
                type="password"
                :placeholder="$t('login.password')"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
            <button
                @click="handleEmailLogin"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
                {{ $t("login.email_button") }}
            </button>
            <button
                @click="handleGoogleLogin"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
            >
                {{ $t("login.google_button") }}
            </button>

            <p
                v-if="error"
                class="error text-red-500 dark:text-red-400 dark:text-red-400 text-sm text-center"
            >
                {{ error }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { loginWithEmail, loginWithGoogle } from "../stores/auth";

const { locale } = useI18n();
const lang = ref(locale.value);

const isDark = ref(localStorage.getItem("dark-mode") === "true");
if (isDark.value) document.documentElement.classList.add("dark");

function toggleLang() {
    const newLang = lang.value === "fr" ? "en" : "fr";
    lang.value = newLang;
    locale.value = newLang;
    localStorage.setItem("locale", newLang);
}

function toggleDarkMode() {
    isDark.value = !isDark.value;
    localStorage.setItem("dark-mode", String(isDark.value));
    document.documentElement.classList.toggle("dark", isDark.value);
}

const email = ref("");
const password = ref("");
const error = ref("");

const handleEmailLogin = async () => {
    try {
        await loginWithEmail(email.value, password.value);
    } catch (err: any) {
        error.value = err.message;
    }
};

const handleGoogleLogin = async () => {
    try {
        await loginWithGoogle();
    } catch (err: any) {
        error.value = err.message;
    }
};

onMounted(() => {
    if (localStorage.getItem("dark-mode") === "true") {
        document.documentElement.classList.add("dark");
    }
});
</script>

<style scoped>
.login {
    max-width: 400px;
    margin: 50px auto;
    padding: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
}
.dark .login {
    background: #1f2937;
    border-color: #374151;
}
.login-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>

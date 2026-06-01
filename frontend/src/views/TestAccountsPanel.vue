<template>
    <div class="max-w-3xl mx-auto">
        <div
            v-if="!isDemoMode"
            class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center"
        >
            <p class="text-amber-700 font-medium">Mode démo inactif</p>
            <p class="text-amber-600 text-sm mt-1">
                Ajoute
                <code class="bg-amber-100 px-2 py-0.5 rounded">?demo=1</code> à
                l'URL pour activer les comptes de test.
            </p>
        </div>

        <template v-else>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">
                {{ $t("testAccounts.title") }}
            </h1>
            <p class="text-gray-500 mb-6">
                {{ $t("testAccounts.description") }}
            </p>

            <div
                v-if="activePersona"
                class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
                <p class="text-sm text-blue-700">
                    {{ $t("testAccounts.current") }} :
                    <strong>{{ getPersonaLabel(activePersona) }}</strong>
                    <span class="text-blue-500">
                        ({{ getUserEmail(activePersona) }})</span
                    >
                </p>
                <button
                    v-if="isImpersonating"
                    @click="stopCurrentPersona"
                    class="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 cursor-pointer transition-colors"
                >
                    ← {{ $t("demoPersona.stop") || "Arrêter" }}
                </button>
            </div>

            <div class="grid grid-cols-1 gap-4">
                <div
                    v-for="(persona, key) in personas"
                    :key="key"
                    class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between"
                    :class="{ 'ring-2 ring-blue-400': activePersona === key }"
                >
                    <div>
                        <h3 class="font-semibold text-gray-800">
                            {{ getPersonaLabel(key as string) }}
                        </h3>
                        <p class="text-sm text-gray-500">{{ persona.email }}</p>
                        <p class="text-xs text-gray-400 mt-1">
                            {{ getPersonaDesc(key as string) }}
                        </p>
                    </div>
                    <button
                        @click="switchPersona(key as string)"
                        class="px-4 py-2 text-sm rounded-lg font-medium cursor-pointer transition-colors"
                        :class="
                            activePersona === key
                                ? 'bg-blue-100 text-blue-700 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        "
                        :disabled="activePersona === key"
                    >
                        {{
                            activePersona === key
                                ? "✓ " + $t("testAccounts.current")
                                : $t("testAccounts.switch")
                        }}
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
    user,
    isAuthenticated,
    isDemoMode,
    isImpersonating,
    startImpersonating,
    stopImpersonating,
} from "../stores/auth";
import { member, loadCurrentMember } from "../stores/member";

const { t } = useI18n();

const STORAGE_KEY = "demo-persona";

interface Persona {
    email: string;
    role: string;
    displayName: string;
}

const personas: Record<string, Persona> = {
    admin: { email: "admin@demo.church", role: "admin", displayName: "Admin" },
    scheduler: {
        email: "scheduler@demo.church",
        role: "scheduler",
        displayName: "Planificateur",
    },
    editor: {
        email: "editor@demo.church",
        role: "editor",
        displayName: "Éditeur",
    },
    member: {
        email: "member@demo.church",
        role: "member",
        displayName: "Membre",
    },
    guest: { email: "guest@demo.church", role: "guest", displayName: "Invité" },
};

const activePersona = ref<string | null>(null);

onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in personas) {
        activePersona.value = stored;
        applyPersona(stored);
    }
});

function getPersonaLabel(key: string): string {
    return (
        t(`testAccounts.personas.${key}.name`) ||
        personas[key]?.displayName ||
        key
    );
}

function getUserEmail(key: string): string {
    return personas[key]?.email || "";
}

function getPersonaDesc(key: string): string {
    return t(`testAccounts.personas.${key}.desc`) || "";
}

function switchPersona(key: string) {
    if (activePersona.value === key) return;
    activePersona.value = key;
    localStorage.setItem(STORAGE_KEY, key);
    applyPersona(key);
}

function applyPersona(key: string) {
    const p = personas[key];
    if (!p) return;

    const personaUser = {
        email: p.email,
        uid: `demo-${key}`,
        displayName: p.displayName,
    };
    const personaMember = {
        id: `demo-${key}`,
        email: p.email,
        first_name: p.displayName,
        last_name: "",
        role: p.role,
    };

    if (!isDemoMode.value) {
        startImpersonating(personaUser);
    } else {
        user.value = personaUser;
        // In demo mode, still set isImpersonating so UI shows the stop button
        if (!isImpersonating.value) {
            isImpersonating.value = true;
        }
    }
    isAuthenticated.value = true;
    member.value = personaMember;
}

function stopCurrentPersona() {
    activePersona.value = null;
    localStorage.removeItem(STORAGE_KEY);
    if (!isDemoMode.value) {
        stopImpersonating();
        loadCurrentMember();
    } else {
        // In demo mode, reset to original admin demo user
        user.value = {
            email: "admin@demo.church",
            uid: "demo123",
            displayName: "Admin Démo",
        };
        isImpersonating.value = false;
        // Keep isAuthenticated true en demo mode
        member.value = {
            id: "demo123",
            email: "admin@demo.church",
            first_name: "Admin",
            last_name: "Démo",
            role: "admin",
        };
    }
}
</script>

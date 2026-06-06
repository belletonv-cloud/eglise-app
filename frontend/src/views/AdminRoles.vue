<template>
    <div class="admin-roles">
        <h2 class="text-2xl font-bold mb-6">Gestion des rôles</h2>

        <div v-if="loading" class="text-center py-8">Chargement...</div>

        <div v-else-if="error" class="text-red-600 py-4">{{ error }}</div>

        <div v-else class="space-y-4">
            <div
                v-for="member in members"
                :key="member.id"
                class="border rounded-lg p-4 flex items-center justify-between"
            >
                <div>
                    <h3 class="font-semibold">
                        {{ member.first_name }} {{ member.last_name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ member.email }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">
                        Rôle actuel: {{ member.role || "member" }}
                    </p>
                </div>

                <select
                    v-model="member.newRole"
                    class="px-3 py-1 border rounded-lg text-sm"
                >
                    <option value="admin">Admin</option>
                    <option value="scheduler">Planificateur</option>
                    <option value="editor">Éditeur</option>
                    <option value="music_director">Music Director</option>
                    <option value="volunteer">Bénévole</option>
                    <option value="viewer">Observateur</option>
                    <option value="guest">Invité</option>
                </select>

                <button
                    @click="updateRole(member)"
                    :disabled="member.newRole === member.role"
                    class="ml-3 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                    Mettre à jour
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../utils/api";

interface Member {
    id: number | string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    newRole: string;
}

const members = ref<Member[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function normalizeListResponse(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object") {
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.members)) return res.members;
    }
    return [];
}

async function loadMembers() {
    try {
        error.value = null;
        const res = await api.getMembers({ page: 1, size: 100 });
        const list = normalizeListResponse(res);
        members.value = list.map((m: any) => ({
            ...m,
            newRole: m.role || "member",
        }));
    } catch (e: any) {
        console.error(e);
        error.value = e?.message || "Erreur lors du chargement";
    } finally {
        loading.value = false;
    }
}

async function updateRole(member: Member) {
    try {
        error.value = null;
        await api.updateMemberRole(member.id, { role: member.newRole });
        member.role = member.newRole;
    } catch (e: any) {
        console.error(e);
        error.value = e?.message || "Erreur lors de la mise à jour";
    }
}

onMounted(loadMembers);
</script>

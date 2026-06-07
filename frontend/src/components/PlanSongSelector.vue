<template>
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="$emit('close')"
    >
        <div
            class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-xl shadow-xl max-h-[80vh] flex flex-col"
        >
            <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Ajouter un chant
            </h3>

            <input
                v-model="search"
                placeholder="Rechercher un chant..."
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            />

            <div
                v-if="loading"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
                Chargement...
            </div>
            <div v-else class="flex-1 overflow-y-auto space-y-2">
                <div
                    v-for="song in filteredSongs"
                    :key="song.id"
                    @click="selectSong(song)"
                    class="p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                    :class="{
                        'border-blue-400 bg-blue-50 dark:bg-blue-900/20':
                            selected?.id === song.id,
                    }"
                >
                    <div class="font-medium text-gray-800 dark:text-gray-100">
                        {{ song.title }}
                    </div>
                    <div
                        v-if="song.author"
                        class="text-sm text-gray-500 dark:text-gray-400"
                    >
                        {{ song.author }}
                    </div>
                    <div
                        v-if="
                            selected?.id === song.id &&
                            song.arrangements?.length
                        "
                        class="mt-2"
                    >
                        <label
                            class="text-sm font-medium text-gray-600 dark:text-gray-300"
                            >Arrangement</label
                        >
                        <select
                            v-model="selectedArrangementId"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 mt-1 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                        >
                            <option :value="null">Choisir...</option>
                            <option
                                v-for="a in song.arrangements"
                                :key="a.id"
                                :value="a.id"
                            >
                                {{ a.name }}
                                {{ a.key ? "(" + a.key + ")" : "" }}
                            </option>
                        </select>
                        <div
                            v-if="
                                selectedArrangementId &&
                                !selectedArrangementHasChart
                            "
                            class="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded text-sm"
                        >
                            ⚠️ L'arrangement sélectionné ne contient pas de
                            grille d'accords. Tu pourras l'ajouter quand même,
                            mais il n'y aura pas d'accords affichés dans la
                            fiche chant.
                        </div>
                        <div v-if="selectedArrangementId" class="mt-1">
                            <label
                                class="text-sm font-medium text-gray-600 dark:text-gray-300"
                                >Transposition</label
                            >
                            <input
                                v-model="transposedKey"
                                placeholder="Ex: C, Dm, G..."
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 mt-1 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                    </div>
                </div>
                <div
                    v-if="filteredSongs.length === 0"
                    class="text-center py-8 text-gray-400 dark:text-gray-500"
                >
                    Aucun chant trouvé
                </div>
            </div>

            <div
                class="flex gap-3 justify-end pt-4 border-t dark:border-gray-800 mt-4"
            >
                <button
                    @click="$emit('close')"
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                    Annuler
                </button>
                <button
                    @click="confirm"
                    :disabled="!selected || !selectedArrangementId"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Ajouter
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { api } from "../utils/api";

const emit = defineEmits<{
    close: [];
    select: [
        songId: number,
        arrangementId: number,
        transposedKey: string | null,
    ];
}>();

const search = ref("");
const songs = ref<any[]>([]);
const loading = ref(true);
const selected = ref<any>(null);
const selectedArrangementId = ref<number | null>(null);
const transposedKey = ref("");
const selectedArrangementHasChart = ref<boolean>(true);

const filteredSongs = computed(() => {
    const q = search.value.toLowerCase();
    return songs.value.filter(
        (s) =>
            !q ||
            s.title.toLowerCase().includes(q) ||
            (s.author && s.author.toLowerCase().includes(q)),
    );
});

const selectSong = async (song: any) => {
    if (selected.value?.id === song.id) {
        selected.value = null;
        selectedArrangementId.value = null;
        return;
    }
    if (!song.arrangements) {
        const full = await api.getSong(song.id);
        song.arrangements = full.arrangements;
    }
    selected.value = song;
    selectedArrangementId.value = song.arrangements?.[0]?.id || null;
    transposedKey.value = "";
    // Update whether the selected arrangement has a chord chart
    const firstArr = song.arrangements?.[0];
    selectedArrangementHasChart.value = !!(firstArr && firstArr.chord_chart);
};

const confirm = () => {
    if (!selected.value || !selectedArrangementId.value) return;
    emit(
        "select",
        selected.value.id,
        selectedArrangementId.value,
        transposedKey.value || null,
    );
};

// Watch for arrangement changes to update the alert
watch(selectedArrangementId, async (val) => {
    if (!val || !selected.value) {
        selectedArrangementHasChart.value = true;
        return;
    }
    const arr = selected.value.arrangements?.find((a: any) => a.id === val);
    if (arr) {
        selectedArrangementHasChart.value = !!arr.chord_chart;
        return;
    }
    // If arrangement data not present inline, fetch full song and check
    try {
        const full = await api.getSong(selected.value.id);
        const a = full.arrangements?.find((x: any) => x.id === val);
        selectedArrangementHasChart.value = !!a?.chord_chart;
    } catch {
        selectedArrangementHasChart.value = true;
    }
});

onMounted(async () => {
    try {
        songs.value = await api.getSongs();
    } catch {
        console.warn("PlanSongSelector getSongs failed");
    }
    loading.value = false;
});
</script>

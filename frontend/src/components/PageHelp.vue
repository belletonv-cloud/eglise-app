<template>
    <div class="page-help-root">
        <button
            class="page-help-btn"
            @click="openModal"
            aria-label="Aide/explications de la page"
            title="Aide/explications de la page"
            ref="btnRef"
        >
            <span>?</span>
        </button>

        <Teleport to="body">
            <div
                v-if="visible"
                class="page-help-modal fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            >
                <div
                    class="page-help-content bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-lg w-full relative"
                    ref="modalContentRef"
                    tabindex="0"
                >
                    <button
                        class="absolute top-4 right-6 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        @click="closeModal"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                    <div v-if="steps.length === 0">
                        <slot name="default">
                            <p class="text-gray-700 dark:text-gray-300">
                                {{ helpText }}
                            </p>
                        </slot>
                    </div>
                    <div v-else>
                        <div
                            class="font-semibold text-xl mb-3 text-gray-800 dark:text-gray-100"
                        >
                            {{ steps[stepIndex]?.title }}
                        </div>
                        <div class="mb-6 text-gray-600 dark:text-gray-300">
                            {{ steps[stepIndex]?.desc }}
                        </div>
                        <div
                            class="flex items-center gap-5 justify-between mt-8"
                        >
                            <button
                                v-if="stepIndex > 0"
                                @click="prevStep"
                                class="text-blue-500 dark:text-blue-400 hover:underline"
                            >
                                ← {{ $t("help.prev") || "Précédent" }}
                            </button>
                            <span
                                class="flex-1 text-center text-xs text-gray-400 dark:text-gray-500"
                                >{{ stepIndex + 1 }}/{{ steps.length }}</span
                            >
                            <button
                                v-if="stepIndex < steps.length - 1"
                                @click="nextStep"
                                class="text-blue-500 dark:text-blue-400 hover:underline"
                            >
                                {{ $t("help.next") || "Suivant" }} →
                            </button>
                            <button
                                v-if="stepIndex === steps.length - 1"
                                @click="closeModal"
                                class="text-green-600 dark:text-green-400 font-semibold ml-auto"
                            >
                                {{ $t("help.done") || "Terminé" }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
const props = defineProps({
    page: { type: String, required: true },
    steps: {
        type: Array as () => {
            title: string;
            desc: string;
            selector?: string;
        }[],
        default: () => [],
    },
    helpText: { type: String, default: "" },
});

const visible = ref(false);
const stepIndex = ref(0);
const steps = computed<{ title: string; desc: string; selector?: string }[]>(
    () => (props.steps as any) || [],
);
const btnRef = ref<null | HTMLButtonElement>(null);
const modalContentRef = ref<null | HTMLElement>(null);
let lastActiveElement: HTMLElement | null = null;

// Highlight state for current selector
const highlightedEl = ref<HTMLElement | null>(null);
function applyHighlight() {
    // Remove old highlight
    if (highlightedEl.value)
        highlightedEl.value.classList.remove("page-help-step-highlight");
    highlightedEl.value = null;
    const s = steps.value[stepIndex.value]?.selector;
    if (s) {
        const el = document.querySelector(s) as HTMLElement | null;
        if (el) {
            el.classList.add("page-help-step-highlight");
            highlightedEl.value = el;
            el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }
}
function cleanupHighlight() {
    if (highlightedEl.value)
        highlightedEl.value.classList.remove("page-help-step-highlight");
    highlightedEl.value = null;
}

function openModal() {
    visible.value = true;
    stepIndex.value = 0;
    lastActiveElement = document.activeElement as HTMLElement;
    nextTick(() => {
        modalContentRef.value?.focus();
        applyHighlight();
    });
}
function closeModal() {
    visible.value = false;
    cleanupHighlight();
    nextTick(() => {
        if (lastActiveElement) lastActiveElement.focus?.();
    });
}
function nextStep() {
    if (stepIndex.value < steps.value.length - 1) {
        stepIndex.value++;
        nextTick(applyHighlight);
    }
}
function prevStep() {
    if (stepIndex.value > 0) {
        stepIndex.value--;
        nextTick(applyHighlight);
    }
}

// Gestes clavier (modal ouverte uniquement)
function onKeydown(e: KeyboardEvent) {
    if (!visible.value) return;
    if (e.key === "Escape") {
        closeModal();
    } else if (e.key === "ArrowRight") {
        nextStep();
    } else if (e.key === "ArrowLeft") {
        prevStep();
    }
}

onMounted(() => {
    window.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
    cleanupHighlight();
});

watch(visible, (v) => {
    if (!v) cleanupHighlight();
});
watch(stepIndex, () => {
    if (visible.value) nextTick(applyHighlight);
});
</script>

<style scoped>
.page-help-root {
    display: inline-flex;
    z-index: 50;
}
.page-help-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #eff6ff;
    color: #2563eb;
    border: none;
    font-size: 1.5rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow:
        0 2px 8px 2px rgb(0 0 0 / 7%),
        0 0px 1px 0px rgb(0 0 0 / 5%);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background 0.2s;
}
.page-help-btn:hover {
    background: #dbeafe;
}
.page-help-btn.dark-mode {
    background: #1e3a8a;
    color: #93c5fd;
}
.page-help-btn.dark-mode:hover {
    background: #2563eb;
}
.page-help-modal {
    backdrop-filter: blur(2px);
}
.page-help-content {
    min-height: 180px;
    min-width: 320px;
    outline: none;
}

.page-help-step-highlight {
    box-shadow: 0 0 0 3px #3b82f6 !important;
    border-radius: 6px !important;
    transition: box-shadow 0.2s;
    position: relative;
    z-index: 90;
}
.page-help-step-highlight.dark-mode {
    box-shadow: 0 0 0 3px #60a5fa !important;
}
</style>

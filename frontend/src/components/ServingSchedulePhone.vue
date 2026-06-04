<template>
  <div class="px-4 pt-5 pb-3">
    <div class="text-xl font-extrabold text-gray-900 dark:text-gray-100">My Schedule</div>
    <div class="mt-2">
      <div class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
        {{ personName }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        @click="addBlockout"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        Add Blockout
      </button>
      <button
        @click="emailLeader"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        Email Leader
      </button>
    </div>

    <div v-if="loading" class="mt-6 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      Chargement…
    </div>

    <div v-else>
      <div class="mt-5">
        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending {{ pendingCount }}</div>

        <div v-if="pendingCount === 0" class="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Aucune demande en attente
        </div>
        <div
          v-for="(it, idx) in pending"
          :key="idx"
          class="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{{ it.date }}</div>
              <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ it.service }}</div>
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ it.role }}</div>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              @click="decline(idx)"
              class="rounded-lg border border-red-400 bg-white px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-600 dark:bg-gray-800 dark:text-red-400"
            >
              Decline
            </button>
            <button
              @click="accept(idx)"
              class="rounded-lg border border-[#2ECC71] bg-white px-3 py-2 text-sm font-semibold text-[#2ECC71] dark:bg-gray-800"
            >
              Accept
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 pb-4">
        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmed {{ confirmedCount }}</div>
        <div
          v-for="(it, idx) in confirmed"
          :key="idx"
          class="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ it.date }}{{ it.date ? " — " : "" }}{{ it.service
            }}<span v-if="it.role"> — {{ it.role }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api } from "../utils/api";
import { member } from "../stores/member";
import { showToast } from "../stores/toast";

const personName = computed(() => {
  if (!member.value) return "Moi";
  return member.value.first_name || member.value.email?.split("@")[0] || "Moi";
});

const loading = ref(true);
const pending = ref<any[]>([]);
const confirmed = ref<any[]>([]);

const pendingCount = computed(() => pending.value.length);
const confirmedCount = computed(() => confirmed.value.length);

function formatScheduleDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function accept(idx: number) {
  const item = pending.value.splice(idx, 1)[0];
  if (item) confirmed.value.unshift(item);
}

function decline(idx: number) {
  pending.value.splice(idx, 1);
}

function addBlockout() {
  showToast("Fonctionnalité à venir", "success");
}

function emailLeader() {
  showToast("Fonctionnalité à venir", "success");
}

onMounted(async () => {
  try {
    const rows = await api.getMySchedule();
    const items: any[] = Array.isArray(rows) ? rows : [];
    for (const r of items) {
      const card = {
        date: formatScheduleDate(r.date),
        service: r.service_type_name || r.theme || "Service",
        role: r.position || "",
        id: r.id,
      };
      if (r.status === "pending" || !r.status) pending.value.push(card);
      else confirmed.value.push(card);
    }

    if (confirmed.value.length === 0 && pending.value.length === 0) {
      confirmed.value = [{ date: "", service: "Aucun service planifié", role: "" }];
    }
  } catch {
    confirmed.value = [{ date: "", service: "Chargement impossible", role: "" }];
  } finally {
    loading.value = false;
  }
});
</script>

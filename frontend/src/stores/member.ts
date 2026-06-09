// TODO RBAC UI
// - Vérifier que seuls les rôles autorisés peuvent déclencher l'envoi d'emails

import { ref, computed } from "vue";
import type { User as FirebaseUser } from "firebase/auth";
import { user, isDemoMode } from "./auth";
import { getApiBase } from "../utils/api";

export interface Member {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  membership_type?: string;
  pco_id?: string;
  teams?: { id: number; name: string; position: string }[];
  [key: string]: unknown;
}

export const member = ref<Member | null>(null);
export const loading = ref(false);
export const error = ref<string | null>(null);

export const role = computed(() => member.value?.role ?? null);
export const isAdmin = computed(() => role.value === "admin");
export const isEditor = computed(() =>
  ["admin", "editor"].includes(role.value ?? ''),
);
export const isScheduler = computed(() =>
  ["admin", "scheduler", "music_director"].includes(role.value ?? ''),
);
export const canManageMembers = computed(() =>
  ["admin", "editor"].includes(role.value ?? ''),
);
export const canManageMusic = computed(() =>
  ["admin", "music_director"].includes(role.value ?? ''),
);

export async function loadCurrentMember() {
  // In demo mode, set a default admin member
  if (isDemoMode.value) {
    member.value = {
      id: "demo123",
      email: "admin@demo.church",
      first_name: "Admin",
      last_name: "Démo",
      role: "admin",
    };
    return;
  }
  if (!user.value) {
    member.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const token = await (user.value as FirebaseUser).getIdToken();
    const res = await fetch(`${getApiBase()}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    member.value = await res.json();
  } catch (e: any) {
    error.value = e.message;
    member.value = null;
  } finally {
    loading.value = false;
  }
}

<template>
  <div id="app">
    <Login v-if="!isAuthenticated" />
    <div v-else class="flex h-screen bg-gray-100">
      <aside class="w-64 bg-white shadow-md flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h1 class="text-lg font-bold text-gray-800">Église App</h1>
          <p class="text-sm text-gray-500 truncate">{{ user?.email }}</p>
        </div>
        <nav class="flex-1 p-2 space-y-1">
          <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>📅</span> Services
          </router-link>
          <router-link to="/members" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>👥</span> Membres
          </router-link>
          <router-link to="/teams" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>🎪</span> Équipes
          </router-link>
          <router-link to="/songs" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>🎵</span> Chants
          </router-link>
          <router-link to="/checkin" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>✅</span> Check-in
          </router-link>
          <router-link to="/house-groups" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>🏠</span> Groupes
          </router-link>
          <router-link to="/email" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700" active-class="bg-blue-50 text-blue-700 font-medium">
            <span>📧</span> Emails
          </router-link>
        </nav>
        <div class="p-3 border-t border-gray-200">
          <button @click="logout" class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            Déconnexion
          </button>
        </div>
      </aside>
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
    <Toast
      :message="toast.message"
      :type="toast.type"
      :visible="toast.visible"
      @closed="hideToast"
    />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Login from './components/Login.vue';
import { user, isAuthenticated, logout } from './stores/auth';
import { toastState, hideToast } from './stores/toast';
import Toast from './components/Toast.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';

const toast = toastState();
</script>

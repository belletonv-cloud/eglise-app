<template>
  <div class="max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {{ $t('adminHome.title') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('adminHome.subtitle') }}
      </p>
    </div>

    <div v-if="!canSeeAnything" class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <p class="text-gray-600 dark:text-gray-300">{{ $t('adminHome.no_access') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link
        v-if="canManageMembers"
        to="/admin/members"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">👥</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.admin_members') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.members_desc') }}</p>
        </div>
      </router-link>


      <router-link
        v-if="canEditContent"
        to="/admin/content"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">📝</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.content') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.content_desc') }}</p>
        </div>
      </router-link>

      <router-link
        v-if="isAdmin"
        to="/admin/test-accounts"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">🧪</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.test_accounts') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.test_accounts_desc') }}</p>
        </div>
      </router-link>

      <router-link
        v-if="isAdmin"
        to="/webhooks"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">🔗</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.webhooks') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.webhooks_desc') }}</p>
        </div>
      </router-link>

      <router-link
        v-if="isAdmin"
        to="/logs"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">📋</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.logs') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.logs_desc') }}</p>
        </div>
      </router-link>

      <router-link
        v-if="isAdmin"
        to="/pco-sync"
        class="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <span class="text-3xl mt-1">🔄</span>
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('menu.pco_sync') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('adminHome.cards.pco_desc') }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { member } from '../stores/member'
import { hasRolePermission, roleHasAnyPermission } from '../utils/rbac'

const router = useRouter()
const route = useRoute()

const role = computed(() => member.value?.role || null)

const isAdmin = computed(() => role.value === 'admin')
const canManageMembers = computed(
  () => isAdmin.value || roleHasAnyPermission(role.value, ['manage_members', 'edit_members', 'edit_teams'])
)
const canEditContent = computed(
  () => isAdmin.value || hasRolePermission(role.value, 'edit_announcements')
)

const canSeeAnything = computed(
  () => isAdmin.value || canManageMembers.value || canEditContent.value
)

// If someone opens /admin without being admin, redirect to the best permitted tool.
watch(
  [isAdmin, canManageMembers, canEditContent, role],
  () => {
    if (route.name !== 'admin') return
    if (!role.value) return
    if (isAdmin.value) return

    if (canEditContent.value) return router.replace('/admin/content')
    if (canManageMembers.value) return router.replace('/admin/members')

    return router.replace('/dashboard')
  },
  { immediate: true },
)
</script>

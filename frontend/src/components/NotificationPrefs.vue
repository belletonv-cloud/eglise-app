<template>
  <div class="notification-prefs">
    <div v-if="!isPushSupported" class="alert-info">
      {{ $t('notificationPrefs.not_supported') }}
    </div>

    <div v-else class="prefs-content">
      <div class="permission-status">
        <span class="status-label">{{ $t('notificationPrefs.label') }}</span>
        <span :class="['status-badge', permissionClass]">{{ permissionText }}</span>
      </div>

      <div class="vapid-warning" v-if="!vapidConfigured">
        {{ $t('notificationPrefs.vapid_warning') }}
      </div>

      <div class="actions" v-if="vapidConfigured">
        <button
          v-if="permission === 'default'"
          @click="requestAndSubscribe"
          class="btn-primary"
        >
          {{ $t('notificationPrefs.enable') }}
        </button>

        <button
          v-if="permission === 'granted' && !subscribed"
          @click="subscribe"
          class="btn-primary"
          :disabled="subscribing"
        >
          {{ subscribing ? $t('notificationPrefs.subscribing') : $t('notificationPrefs.subscribe') }}
        </button>

        <button
          v-if="subscribed"
          @click="unsubscribePush"
          class="btn-danger"
          :disabled="unsubscribing"
        >
          {{ unsubscribing ? $t('notificationPrefs.unsubscribing') : $t('notificationPrefs.unsubscribe') }}
        </button>
      </div>

      <div v-if="subscribed" class="subscribed-info">
        {{ $t('notificationPrefs.active') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { isPushSupported, getNotificationPermission, requestPermission, subscribeToPush, registerToken, unsubscribe, getExistingSubscription, extractFCMToken } from '../utils/notifications';

const { t } = useI18n()

const emit = defineEmits<{
  subscribed: [token: string]
  unsubscribed: []
}>();

const props = defineProps<{
  memberId: number
}>();

const vapidConfigured = !!import.meta.env.VITE_VAPID_PUBLIC_KEY;

const permission = ref<NotificationPermission>(getNotificationPermission());
const subscribed = ref(false);
const subscribing = ref(false);
const unsubscribing = ref(false);
const swRegistration = ref<ServiceWorkerRegistration | null>(null);

const isPushSupportedVal = isPushSupported();

const permissionClass = computed(() => ({
  'bg-green-100 text-green-800': permission.value === 'granted',
  'bg-yellow-100 text-yellow-800': permission.value === 'default',
  'bg-red-100 text-red-800': permission.value === 'denied',
}));

const permissionText = computed(() => {
  const map: Record<NotificationPermission, string> = {
    granted: t('notificationPrefs.granted'),
    default: t('notificationPrefs.default'),
    denied: t('notificationPrefs.denied'),
  };
  return map[permission.value] || 'Inconnu';
});

async function getSW() {
  if (swRegistration.value) return swRegistration.value;
  if ('serviceWorker' in navigator) {
    try {
      swRegistration.value = await navigator.serviceWorker.ready;
    } catch (e) { console.warn('NotificationPrefs: failed to get service worker registration', e) }
  }
  return swRegistration.value;
}

async function checkSubscription() {
  const reg = await getSW();
  if (!reg) return;
  const sub = await getExistingSubscription(reg);
  subscribed.value = !!sub;
}

async function requestAndSubscribe() {
  const result = await requestPermission();
  permission.value = result;
  if (result === 'granted') {
    await subscribe();
  }
}

async function subscribe() {
  const reg = await getSW();
  if (!reg) return;
  subscribing.value = true;
  try {
    const sub = await subscribeToPush(reg);
    if (sub) {
      await registerToken(props.memberId, sub);
      subscribed.value = true;
      emit('subscribed', extractFCMToken(sub) || '');
    }
  } finally {
    subscribing.value = false;
  }
}

async function unsubscribePush() {
  const reg = await getSW();
  if (!reg) return;
  unsubscribing.value = true;
  try {
    await unsubscribe(reg);
    subscribed.value = false;
    emit('unsubscribed');
  } finally {
    unsubscribing.value = false;
  }
}

onMounted(() => {
  checkSubscription();
});
</script>

<style scoped>
.notification-prefs {
  padding: 1rem;
}

.alert-info, .vapid-warning {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.alert-info {
  background: #dbeafe;
  color: #1e40af;
}

.vapid-warning {
  background: #fef3c7;
  color: #92400e;
  margin-top: 0.75rem;
}

.prefs-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.permission-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-label {
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subscribed-info {
  padding: 0.5rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}
</style>

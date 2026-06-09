import { api } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeToPush(swRegistration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY not configured – push subscription skipped');
    return null;
  }

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    });
    return subscription;
  } catch (e) {
    console.error('Push subscription failed:', e);
    return null;
  }
}

export function extractFCMToken(subscription: PushSubscription): string | null {
  // FCM endpoint format: https://fcm.googleapis.com/fcm/send/<TOKEN>
  // Standard Web Push endpoint: https://<base>/<token>
  const parts = subscription.endpoint.split('/');
  const candidate = parts[parts.length - 1];
  return candidate || null;
}

export async function registerToken(memberId: number, subscription: PushSubscription): Promise<void> {
  const fcmToken = extractFCMToken(subscription);
  if (!fcmToken) {
    console.warn('Could not extract FCM token from subscription endpoint');
    return;
  }
  try {
    await api.registerFCMToken({ member_id: memberId, token: fcmToken, platform: 'web' });
  } catch (e) {
    console.error('Failed to register FCM token:', e);
  }
}

export async function getExistingSubscription(swRegistration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    return await swRegistration.pushManager.getSubscription();
  } catch (e) {
    console.error('getExistingSubscription failed:', e);
    return null;
  }
}

export async function unsubscribe(swRegistration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const sub = await swRegistration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
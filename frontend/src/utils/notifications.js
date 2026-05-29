import { api } from './api';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
export function isPushSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}
export function getNotificationPermission() {
    if (!('Notification' in window))
        return 'denied';
    return Notification.permission;
}
export async function requestPermission() {
    if (!isPushSupported())
        return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
}
export async function subscribeToPush(swRegistration) {
    if (!VAPID_PUBLIC_KEY) {
        console.warn('VITE_VAPID_PUBLIC_KEY not configured – push subscription skipped');
        return null;
    }
    try {
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        return subscription;
    }
    catch (e) {
        console.error('Push subscription failed:', e);
        return null;
    }
}
export function extractFCMToken(subscription) {
    // FCM endpoint format: https://fcm.googleapis.com/fcm/send/<TOKEN>
    // Standard Web Push endpoint: https://<base>/<token>
    const parts = subscription.endpoint.split('/');
    const candidate = parts[parts.length - 1];
    return candidate || null;
}
export async function registerToken(memberId, subscription) {
    const fcmToken = extractFCMToken(subscription);
    if (!fcmToken) {
        console.warn('Could not extract FCM token from subscription endpoint');
        return;
    }
    await api.registerFCMToken(memberId, fcmToken, 'web');
}
export async function getExistingSubscription(swRegistration) {
    try {
        return await swRegistration.pushManager.getSubscription();
    }
    catch {
        return null;
    }
}
export async function unsubscribe(swRegistration) {
    try {
        const sub = await swRegistration.pushManager.getSubscription();
        if (sub) {
            await sub.unsubscribe();
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

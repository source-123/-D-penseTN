import { Platform } from 'react-native';

// ⚠️ DEBUG: expo-notifications désactivé pour isoler le crash Android
const DEBUG_DISABLE_NOTIFS = true;

let Notifications: any = null;

if (!DEBUG_DISABLE_NOTIFS && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('[notif] load failed', e);
    Notifications = null;
  }
}

export async function requestPermission(): Promise<boolean> {
  if (DEBUG_DISABLE_NOTIFS) return false;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function notify(title: string, body: string): Promise<void> {
  if (DEBUG_DISABLE_NOTIFS) return;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try { new Notification(title, { body }); } catch {}
    return;
  }
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

export async function scheduleDaily(
  hour: number,
  minute: number,
  getBody: () => Promise<string>,
): Promise<string | null> {
  if (DEBUG_DISABLE_NOTIFS) return null;
  if (Platform.OS === 'web') {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    const id = window.setTimeout(async () => {
      const body = await getBody();
      await notify('💸 DépenseTN', body);
    }, delay);
    return String(id);
  }
  if (!Notifications) return null;
  const body = await getBody();
  return await Notifications.scheduleNotificationAsync({
    content: { title: '💸 DépenseTN', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, minute,
    },
  });
}

export async function cancel(id: string): Promise<void> {
  if (DEBUG_DISABLE_NOTIFS) return;
  if (Platform.OS === 'web') {
    const n = Number(id);
    if (!isNaN(n)) clearTimeout(n);
    return;
  }
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAll(): Promise<void> {
  if (DEBUG_DISABLE_NOTIFS) return;
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

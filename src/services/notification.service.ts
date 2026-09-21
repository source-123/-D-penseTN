import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configuration du handler de notifications (natif uniquement)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function notify(title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try { new Notification(title, { body }); } catch {}
    return;
  }

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

  const body = await getBody();
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: '💸 DépenseTN', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return id;
}

export async function cancel(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const n = Number(id);
    if (!isNaN(n)) clearTimeout(n);
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAll(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

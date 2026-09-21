import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ─── Config par défaut (natif uniquement) ───
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

/**
 * Demande la permission d'afficher des notifications.
 */
export async function requestPermission(): Promise<boolean> {
  // ─── Web ───
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // ─── Natif ───
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/**
 * Affiche une notification immédiate.
 */
export async function notify(title: string, body: string): Promise<void> {
  // ─── Web ───
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch {
      // certains navigateurs exigent un service worker
    }
    return;
  }

  // ─── Natif ───
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immédiat
  });
}

/**
 * Planifie un rappel quotidien à une heure donnée.
 * Renvoie l'ID de la notif (à sauvegarder pour pouvoir l'annuler).
 */
export async function scheduleDaily(
  hour: number,
  minute: number,
  getBody: () => Promise<string>
): Promise<string | null> {
  // ─── Web ───
  if (Platform.OS === 'web') {
    // Sur web, on utilise un setTimeout simple (marche tant que l'onglet est ouvert)
    // Plus robuste avec un service worker, mais on reste simple ici.
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

  // ─── Natif ───
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
    const num = Number(id);
    if (!isNaN(num)) clearTimeout(num);
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAll(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

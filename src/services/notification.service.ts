import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ─── Config handler (notifications en foreground) ───
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // ─── Channel Android (obligatoire Android 8+) ───
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'DépenseTN',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).catch((e) => console.warn('[notif] channel failed', e));
  }
}

/**
 * Demande la permission d'afficher des notifications.
 * Sur Android 13+, c'est obligatoire avant la première notif.
 */
export async function requestPermission(): Promise<boolean> {
  // ─── Web ───
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // ─── Natif ───
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return req.granted;
  } catch (e) {
    console.warn('[notif] permission failed', e);
    return false;
  }
}

/**
 * Affiche une notification immédiate.
 */
export async function notify(title: string, body: string): Promise<void> {
  // ─── Web ───
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try { new Notification(title, { body }); } catch {}
    return;
  }

  // ─── Natif ───
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // immédiat
    });
  } catch (e) {
    console.warn('[notif] send failed', e);
  }
}

/**
 * Planifie un rappel quotidien à une heure donnée.
 */
export async function scheduleDaily(
  hour: number,
  minute: number,
  getBody: () => Promise<string>,
): Promise<string | null> {
  // ─── Web ───
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

  // ─── Natif ───
  try {
    const body = await getBody();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 DépenseTN',
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'default',
      },
    });
    return id;
  } catch (e) {
    console.warn('[notif] schedule failed', e);
    return null;
  }
}

export async function cancel(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const n = Number(id);
    if (!isNaN(n)) clearTimeout(n);
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn('[notif] cancel failed', e);
  }
}

export async function cancelAll(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[notif] cancelAll failed', e);
  }
}

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@depensetn/notif-settings';

interface NotifSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  dailyReminder: boolean;
  budgetAlert: boolean;
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number;
  notifId: string | null;
}

interface NotifState extends NotifSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<NotifSettings>) => Promise<void>;
}

const DEFAULT: NotifSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  dailyReminder: true,
  budgetAlert: true,
  lowBalanceAlert: true,
  lowBalanceThreshold: 100,
  notifId: null,
};

export const useNotifStore = create<NotifState>((set, get) => ({
  ...DEFAULT,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotifSettings>;
        set({ ...DEFAULT, ...parsed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  update: async (patch) => {
    const next = { ...get(), ...patch };
    set(patch);
    try {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({
          enabled: next.enabled,
          hour: next.hour,
          minute: next.minute,
          dailyReminder: next.dailyReminder,
          budgetAlert: next.budgetAlert,
          lowBalanceAlert: next.lowBalanceAlert,
          lowBalanceThreshold: next.lowBalanceThreshold,
          notifId: next.notifId,
        })
      );
    } catch (e) {
      console.warn('[notif.store] save failed', e);
    }
  },
}));

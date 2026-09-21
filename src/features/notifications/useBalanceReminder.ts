import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useNotifStore } from '@/store/notification.store';
import {
  requestPermission, scheduleDaily, cancel, notify,
} from '@/services/notification.service';
import { getTransactions } from '@/services/firestore.service';
import { getBudgetsForMonth } from '@/services/budget.service';
import { computeBudgetProgress } from '@/features/budgets/utils';
import { formatCurrency } from '@/utils/formatCurrency';

export function useBalanceReminder() {
  const user = useAuthStore((s) => s.user);
  const settings = useNotifStore();

  // ─── 1. Hydrater au démarrage ───
  useEffect(() => {
    settings.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 2. Replanifier le rappel quotidien ───
  useEffect(() => {
    if (!settings.hydrated || !settings.enabled || !settings.dailyReminder) {
      return;
    }

    let cancelled = false;

    (async () => {
      const ok = await requestPermission();
      if (!ok || cancelled) return;

      if (settings.notifId) await cancel(settings.notifId);

      const id = await scheduleDaily(settings.hour, settings.minute, async () => {
        if (!user) return "Ouvre l'app pour voir ton solde.";
        const txs = await getTransactions(user.uid);
        const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        return `Ton solde : ${formatCurrency(balance)}`;
      });

      if (id && !cancelled) {
        await settings.update({ notifId: id });
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.hydrated, settings.enabled, settings.dailyReminder, settings.hour, settings.minute, user?.uid]);

  // ─── 3. Vérifier alertes budget + solde bas ───
  useEffect(() => {
    if (!user || !settings.hydrated || !settings.enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const [txs, budgets] = await Promise.all([
          getTransactions(user.uid),
          getBudgetsForMonth(user.uid),
        ]);
        if (cancelled) return;

        // Solde bas
        if (settings.lowBalanceAlert) {
          const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const balance = income - expenses;
          if (balance < settings.lowBalanceThreshold && balance >= 0) {
            await notify(
              '💸 Solde bas',
              `Ton solde est de ${formatCurrency(balance)}. Attention !`
            );
          }
        }

        // Budgets
        if (settings.budgetAlert) {
          const withProgress = computeBudgetProgress(budgets, txs);
          const exceeded = withProgress.filter((b) => b.percent >= 100);
          const warning = withProgress.filter((b) => b.percent >= 80 && b.percent < 100);

          if (exceeded.length > 0) {
            const b = exceeded[0];
            await notify('⚠️ Budget dépassé', `${b.categoryId} : ${Math.round(b.percent)}% du budget`);
          } else if (warning.length > 0) {
            const b = warning[0];
            await notify('⚠️ Budget bientôt atteint', `${b.categoryId} : ${Math.round(b.percent)}% du budget`);
          }
        }
      } catch (e) {
        console.warn('[balance-reminder]', e);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, settings.hydrated, settings.enabled]);

  // ─── 4. Test manuel ───
  const testNow = async () => {
    const ok = await requestPermission();
    if (!ok) {
      return { ok: false, message: 'Permission refusée' };
    }
    let msg = 'Bien reçu, les notifications fonctionnent !';
    if (user) {
      const txs = await getTransactions(user.uid);
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      msg = `Ton solde actuel : ${formatCurrency(income - expenses)}`;
    }
    await notify('💸 Test DépenseTN', msg);
    return { ok: true, message: 'Notification envoyée ✅' };
  };

  return { testNow };
}

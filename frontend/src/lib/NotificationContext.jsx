import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useI18n } from "./i18n";
import {
  clearStoredNotifications,
  loadNotifications,
  markAllStoredRead,
  markStoredRead,
  pushStoredNotification,
  saveNotifications,
} from "./notificationsStore";

const NotificationContext = createContext(null);

function formatNotifText(t, key, vars) {
  if (!key) return "";
  return t(key, vars);
}

function playNotificationBeep() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1046; // C6-like "bing"
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.19);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* ignore audio failures */
  }
}

export function NotificationProvider({ children }) {
  const { t } = useI18n();
  const [items, setItems] = useState(() => loadNotifications());

  const persist = useCallback((list) => {
    saveNotifications(list);
    setItems(list);
  }, []);

  const addNotification = useCallback((detail) => {
    if (!detail?.type) return null;
    const entry = pushStoredNotification(detail);
    setItems(loadNotifications());
    if (document.visibilityState === "visible") playNotificationBeep();
    return entry;
  }, []);

  const markRead = useCallback((id) => {
    persist(markStoredRead(id));
  }, [persist]);

  const markAllRead = useCallback(() => {
    persist(markAllStoredRead());
  }, [persist]);

  const clearAll = useCallback(() => {
    persist(clearStoredNotifications());
  }, [persist]);

  useEffect(() => {
    const onNotif = (event) => addNotification(event.detail);
    window.addEventListener("rp:notification", onNotif);
    return () => window.removeEventListener("rp:notification", onNotif);
  }, [addNotification]);

  const enriched = useMemo(
    () =>
      items.map((n) => {
        const vars = {
          n: n.spent ?? n.credits ?? 0,
          balance: n.balance ?? 0,
          type: n.creationType || n.typeLabel || "",
        };
        const title = formatNotifText(t, n.titleKey, vars) || n.title || t("notif_default_title");
        const body = formatNotifText(t, n.bodyKey, vars) || n.body || "";
        return { ...n, title, body };
      }),
    [items, t],
  );

  const unreadCount = useMemo(() => enriched.filter((n) => !n.read).length, [enriched]);

  const value = useMemo(
    () => ({
      notifications: enriched,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
      addNotification,
    }),
    [enriched, unreadCount, markRead, markAllRead, clearAll, addNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}

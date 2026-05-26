const STORAGE_KEY = "rp_notifications_v1";
const MAX_ITEMS = 80;

export function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore quota */
  }
}

export function pushStoredNotification(item) {
  const entry = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...item,
  };
  const list = loadNotifications();
  list.unshift(entry);
  saveNotifications(list);
  return entry;
}

export function markStoredRead(id) {
  const list = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(list);
  return list;
}

export function markAllStoredRead() {
  const list = loadNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(list);
  return list;
}

export function clearStoredNotifications() {
  saveNotifications([]);
  return [];
}

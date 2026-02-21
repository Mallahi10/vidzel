export type Notification = {
  id: string;
  userId: string; // receiver (always compare as string)
  type: "invitation";
  title: string;
  message: string;
  workspaceId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
};

const STORAGE_KEY = "vidzel_notifications";

/* =========================
   GET ALL NOTIFICATIONS
========================= */
export function getNotifications(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/* =========================
   GET NOTIFICATIONS FOR USER
   ✅ FIX: normalize ID types
========================= */
export function getUserNotifications(userId: string): Notification[] {
  return getNotifications()
    .filter(
      (n) => String(n.userId) === String(userId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
}

/* =========================
   ADD NOTIFICATION
========================= */
export function addNotification(notification: Notification) {
  const all = getNotifications();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([notification, ...all])
  );
}

/* =========================
   MARK AS READ
========================= */
export function markNotificationRead(notificationId: string) {
  const updated = getNotifications().map((n) =>
    String(n.id) === String(notificationId)
      ? { ...n, isRead: true }
      : n
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

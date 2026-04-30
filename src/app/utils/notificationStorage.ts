const NOTIFICATIONS_STORAGE_KEY = 'hometask_notifications';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

function readNotifications(): AppNotification[] {
  const rawNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!rawNotifications) {
    return [];
  }

  try {
    const parsedNotifications = JSON.parse(rawNotifications);
    return Array.isArray(parsedNotifications) ? parsedNotifications : [];
  } catch {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    return [];
  }
}

function writeNotifications(notifications: AppNotification[]) {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

export function createNotification(input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
  const notification: AppNotification = {
    ...input,
    id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  writeNotifications([notification, ...readNotifications()]);
  return notification;
}

export function getNotificationsByUserId(userId?: string) {
  if (!userId) {
    return [];
  }

  return readNotifications()
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationsRead(userId?: string) {
  if (!userId) {
    return;
  }

  writeNotifications(readNotifications().map((notification) => (
    notification.userId === userId ? { ...notification, read: true } : notification
  )));
}

export function clearDemoData() {
  [
    'hometask_bookings',
    'hometask_booking_progress',
    'hometask_reviews',
    'hometask_helper_applications',
    'hometask_notifications',
    'hometask_booking_chat_messages',
  ].forEach((key) => localStorage.removeItem(key));
}

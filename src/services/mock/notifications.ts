import type { NotificationService, Notification } from "../types";

const TITLES = [
  "Issue AIO-19 was assigned to you",
  "New comment on 'Setup database and drizzle-orm'",
  "Issue AIO-23 moved to In Progress",
  "You were mentioned in AIO-10",
  "Sprint 4 started",
  "Issue AIO-22 was completed",
  "New label 'Bug' added to AIO-15",
  "Password change policy updated",
  "AIO-28 deadline is approaching",
  "Team Remco weekly digest",
];

const MOCK_NOTIFICATIONS: Notification[] = Array.from({ length: 24 }, (_, i) => ({
  id: `notif-${i}`,
  title: TITLES[i % TITLES.length],
  read: i < 5 ? false : i % 3 === 0,
  createdAt: new Date(Date.now() - i * 3600_000 * (1 + Math.random() * 5)).toISOString(),
}));

export function createMockNotificationService(): NotificationService {
  const notifications = [...MOCK_NOTIFICATIONS];

  return {
    async list() {
      return notifications.map((n) => ({ ...n }));
    },

    async getUnreadCount() {
      return notifications.filter((n) => !n.read).length;
    },

    async markAsRead(id: string) {
      const n = notifications.find((n) => n.id === id);
      if (n) n.read = true;
    },

    async markAsUnread(id: string) {
      const n = notifications.find((n) => n.id === id);
      if (n) n.read = false;
    },

    async markAllAsRead() {
      notifications.forEach((n) => (n.read = true));
    },

    async markManyAsRead(ids: string[]) {
      const idSet = new Set(ids);
      notifications.forEach((n) => {
        if (idSet.has(n.id)) n.read = true;
      });
    },

    async markManyAsUnread(ids: string[]) {
      const idSet = new Set(ids);
      notifications.forEach((n) => {
        if (idSet.has(n.id)) n.read = false;
      });
    },

    async delete(id: string) {
      const index = notifications.findIndex((n) => n.id === id);
      if (index !== -1) notifications.splice(index, 1);
    },

    async deleteMany(ids: string[]) {
      const idSet = new Set(ids);
      for (let i = notifications.length - 1; i >= 0; i--) {
        if (idSet.has(notifications[i].id)) {
          notifications.splice(i, 1);
        }
      }
    },
  };
}

import type { Notification, UnreadCountResponse } from '../types/notification'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const notificationApi = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_URL}/api/notifications`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error ?? 'Failed to fetch notifications')
    }

    return await response.json()
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error ?? 'Failed to fetch unread count')
    }

    const data: UnreadCountResponse = await response.json()
    return data.count
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error ?? 'Failed to mark notification as read')
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
      method: 'PATCH',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error ?? 'Failed to mark all notifications as read')
    }
  },
}

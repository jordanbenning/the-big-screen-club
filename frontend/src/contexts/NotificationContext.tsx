import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'

import { notificationApi } from '../api/notificationApi'
import type { Notification } from '../types/notification'

import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  refreshNotifications: () => Promise<void>

  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    )
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

const POLLING_INTERVAL = 30000 // 30 seconds

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      setIsLoading(true)
      const [notifs, count] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId)
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }, [])

  // Initial fetch and polling
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Fetch immediately
    void refreshNotifications()

    // Set up polling
    const intervalId = setInterval(() => {
      void refreshNotifications()
    }, POLLING_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [isAuthenticated, refreshNotifications])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

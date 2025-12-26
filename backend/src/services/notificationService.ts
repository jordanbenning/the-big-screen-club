import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface NotificationWithDetails {
  id: string
  type: 'CLUB_INVITATION'
  isRead: boolean
  createdAt: Date
  invitation: {
    id: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
    expiresAt: Date
    club: {
      id: string
      name: string
      description: string | null
      profilePictureUrl: string | null
    }
    invitedBy: {
      id: string
      username: string
      profilePictureUrl: string | null
    }
  }
}

export const notificationService = {
  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    type: 'CLUB_INVITATION',
    relatedId: string
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type,
        relatedId,
      },
    })
  },

  /**
   * Get all notifications for a user with related data
   */
  async getUserNotifications(
    userId: string
  ): Promise<NotificationWithDetails[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        relatedInvitation: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                description: true,
                profilePictureUrl: true,
              },
            },
            invitedBy: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      invitation: {
        id: notification.relatedInvitation.id,
        status: notification.relatedInvitation.status,
        expiresAt: notification.relatedInvitation.expiresAt,
        club: notification.relatedInvitation.club,
        invitedBy: notification.relatedInvitation.invitedBy,
      },
    }))
  },

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Verify the notification belongs to the user before marking as read
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (notification === null) {
      throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized to mark this notification as read')
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  },

  /**
   * Get notification by invitation ID
   */
  async getNotificationByInvitationId(
    invitationId: string,
    userId: string
  ): Promise<{ id: string } | null> {
    const notification = await prisma.notification.findFirst({
      where: {
        relatedId: invitationId,
        userId,
      },
      select: {
        id: true,
      },
    })

    return notification
  },
}

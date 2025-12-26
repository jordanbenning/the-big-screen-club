export type NotificationType = 'CLUB_INVITATION'

export interface ClubInvitationData {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  expiresAt: string
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

export interface Notification {
  id: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  invitation: ClubInvitationData
}

export interface UnreadCountResponse {
  count: number
}

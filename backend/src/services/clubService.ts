import { PrismaClient } from '@prisma/client'

import { notificationService } from './notificationService'

const prisma = new PrismaClient()

interface CreateClubData {
  name: string
  description?: string
  profilePictureUrl?: string
  isPublic: boolean
  createdById: string
}

interface ClubWithDetails {
  id: string
  name: string
  description: string | null
  profilePictureUrl: string | null
  isPublic: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
  memberCount: number
  role: 'ADMIN' | 'MEMBER'
}

export const clubService = {
  /**
   * Create a new club and automatically add the creator as an admin
   */
  async createClub(data: CreateClubData): Promise<ClubWithDetails> {
    // Check if club name already exists
    const existingClub = await prisma.club.findUnique({
      where: { name: data.name },
    })

    if (existingClub !== null) {
      throw new Error('A club with this name already exists')
    }

    // Create the club, add creator as admin, initialize settings, and create rotation
    const club = await prisma.club.create({
      data: {
        name: data.name,
        description: data.description,
        profilePictureUrl: data.profilePictureUrl,
        isPublic: data.isPublic,
        createdById: data.createdById,
        members: {
          create: {
            userId: data.createdById,
            role: 'ADMIN',
          },
        },
        settings: {
          create: {
            movieSuggestionsCount: 4, // Default value
          },
        },
        rotation: {
          create: {
            userId: data.createdById,
            order: 0,
          },
        },
      },
      include: {
        members: true,
      },
    })

    return {
      id: club.id,
      name: club.name,
      description: club.description,
      profilePictureUrl: club.profilePictureUrl,
      isPublic: club.isPublic,
      createdById: club.createdById,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      memberCount: club.members.length,
      role: 'ADMIN',
    }
  },

  /**
   * Get all clubs where the user is a member
   */
  async getUserClubs(userId: string): Promise<ClubWithDetails[]> {
    const memberships = await prisma.clubMember.findMany({
      where: { userId },
      include: {
        club: {
          include: {
            members: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return memberships.map((membership) => ({
      id: membership.club.id,
      name: membership.club.name,
      description: membership.club.description,
      profilePictureUrl: membership.club.profilePictureUrl,
      isPublic: membership.club.isPublic,
      createdById: membership.club.createdById,
      createdAt: membership.club.createdAt,
      updatedAt: membership.club.updatedAt,
      memberCount: membership.club.members.length,
      role: membership.role,
    }))
  },

  /**
   * Get a specific club by ID with member details
   */
  async getClubById(
    clubId: string,
    userId: string
  ): Promise<ClubWithDetails | null> {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: true,
      },
    })

    if (club === null) {
      return null
    }

    // Check if user is a member
    const membership = club.members.find((m) => m.userId === userId)
    if (membership === undefined) {
      return null // User is not a member, don't return the club
    }

    return {
      id: club.id,
      name: club.name,
      description: club.description,
      profilePictureUrl: club.profilePictureUrl,
      isPublic: club.isPublic,
      createdById: club.createdById,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      memberCount: club.members.length,
      role: membership.role,
    }
  },

  /**
   * Validate that a club hasn't exceeded the member limit
   */
  async validateMemberLimit(clubId: string): Promise<boolean> {
    const memberCount = await prisma.clubMember.count({
      where: { clubId },
    })

    return memberCount < 12
  },

  /**
   * Check if a club name is available
   */
  async isNameAvailable(name: string): Promise<boolean> {
    const club = await prisma.club.findUnique({
      where: { name },
    })

    return club === null
  },

  /**
   * Get club members with user details
   */
  async getClubMembers(
    clubId: string,
    userId: string
  ): Promise<
    Array<{
      id: string
      username: string
      email: string
      profilePictureUrl: string | null
      role: 'ADMIN' | 'MEMBER'
      joinedAt: Date
    }>
  > {
    // First check if the user is a member of the club
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Get all members
    const members = await prisma.clubMember.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    })

    return members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      email: member.user.email,
      profilePictureUrl: member.user.profilePictureUrl,
      role: member.role,
      joinedAt: member.joinedAt,
    }))
  },

  /**
   * Leave a club - removes user from club, deletes club if no members remain
   */
  async leaveClub(clubId: string, userId: string): Promise<void> {
    // Check if user is a member
    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (membership === null) {
      throw new Error('Not a member of this club')
    }

    // Delete the membership (this will cascade delete rotation entry)
    await prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    // Check if any members remain
    const remainingMemberCount = await prisma.clubMember.count({
      where: { clubId },
    })

    // If no members remain, delete the club
    if (remainingMemberCount === 0) {
      await prisma.club.delete({
        where: { id: clubId },
      })
    } else {
      // Reorder rotation to fill gaps
      const rotation = await prisma.clubRotation.findMany({
        where: { clubId },
        orderBy: { order: 'asc' },
      })

      // Update order to be sequential
      await prisma.$transaction(
        rotation.map((r, index) =>
          prisma.clubRotation.update({
            where: { id: r.id },
            data: { order: index },
          })
        )
      )
    }
  },

  /**
   * Invite a member to a club by username (admin only)
   */
  async inviteMember(
    clubId: string,
    invitedByUserId: string,
    usernameToInvite: string
  ): Promise<void> {
    // Check if the inviter is an admin
    const inviterMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: invitedByUserId,
        },
      },
    })

    if (inviterMembership === null) {
      throw new Error('Not a member of this club')
    }

    if (inviterMembership.role !== 'ADMIN') {
      throw new Error('Only admins can invite members')
    }

    // Find the user to invite
    const userToInvite = await prisma.user.findUnique({
      where: { username: usernameToInvite },
    })

    if (userToInvite === null) {
      throw new Error('User not found')
    }

    // Check if user is already a member
    const existingMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: userToInvite.id,
        },
      },
    })

    if (existingMembership !== null) {
      throw new Error('User is already a member of this club')
    }

    // Check member limit
    const canAddMember = await this.validateMemberLimit(clubId)
    if (!canAddMember) {
      throw new Error('Club has reached maximum member limit (12)')
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.clubInvitation.findFirst({
      where: {
        clubId,
        invitedUserId: userToInvite.id,
        status: 'PENDING',
      },
      include: {
        notifications: true,
      },
    })

    if (existingInvitation !== null) {
      // If the invitation exists but has no notification (orphaned), create one
      if (existingInvitation.notifications.length === 0) {
        await notificationService.createNotification(
          userToInvite.id,
          'CLUB_INVITATION',
          existingInvitation.id
        )
        return // Invitation already exists, just added the missing notification
      }
      throw new Error('User already has a pending invitation')
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.clubInvitation.create({
      data: {
        clubId,
        invitedUserId: userToInvite.id,
        invitedByUserId,
        expiresAt,
      },
    })

    // Create notification for the invited user
    await notificationService.createNotification(
      userToInvite.id,
      'CLUB_INVITATION',
      invitation.id
    )
  },

  /**
   * Accept a club invitation
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    // Get the invitation
    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
      include: {
        club: true,
      },
    })

    if (invitation === null) {
      throw new Error('Invitation not found')
    }

    // Verify the invitation is for this user
    if (invitation.invitedUserId !== userId) {
      throw new Error('This invitation is not for you')
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new Error('This invitation has already been responded to')
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      throw new Error('This invitation has expired')
    }

    // Check if user is already a member
    const existingMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: invitation.clubId,
          userId,
        },
      },
    })

    if (existingMembership !== null) {
      throw new Error('You are already a member of this club')
    }

    // Check member limit
    const canAddMember = await this.validateMemberLimit(invitation.clubId)
    if (!canAddMember) {
      throw new Error('Club has reached maximum member limit (12)')
    }

    // Get the current max order in rotation
    const maxOrderResult = await prisma.clubRotation.findFirst({
      where: { clubId: invitation.clubId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = maxOrderResult !== null ? maxOrderResult.order + 1 : 0

    // Accept the invitation: add user to club, update invitation status, and add to rotation
    await prisma.$transaction([
      prisma.clubMember.create({
        data: {
          clubId: invitation.clubId,
          userId,
          role: 'MEMBER',
        },
      }),
      prisma.clubInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.clubRotation.create({
        data: {
          clubId: invitation.clubId,
          userId,
          order: nextOrder,
        },
      }),
    ])

    // Mark the notification as read
    const notification =
      await notificationService.getNotificationByInvitationId(
        invitationId,
        userId
      )
    if (notification !== null) {
      await notificationService.markAsRead(notification.id, userId)
    }
  },

  /**
   * Reject a club invitation
   */
  async rejectInvitation(invitationId: string, userId: string): Promise<void> {
    // Get the invitation
    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
    })

    if (invitation === null) {
      throw new Error('Invitation not found')
    }

    // Verify the invitation is for this user
    if (invitation.invitedUserId !== userId) {
      throw new Error('This invitation is not for you')
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      throw new Error('This invitation has already been responded to')
    }

    // Update invitation status to rejected
    await prisma.clubInvitation.update({
      where: { id: invitationId },
      data: { status: 'REJECTED' },
    })

    // Mark the notification as read
    const notification =
      await notificationService.getNotificationByInvitationId(
        invitationId,
        userId
      )
    if (notification !== null) {
      await notificationService.markAsRead(notification.id, userId)
    }
  },

  /**
   * Remove a member from a club (admin only, can't remove self)
   */
  async removeMember(
    clubId: string,
    adminUserId: string,
    userIdToRemove: string
  ): Promise<void> {
    // Check if the requester is an admin
    const adminMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: adminUserId,
        },
      },
    })

    if (adminMembership === null) {
      throw new Error('Not a member of this club')
    }

    if (adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can remove members')
    }

    // Can't remove yourself - use leave club instead
    if (adminUserId === userIdToRemove) {
      throw new Error('Use leave club to remove yourself')
    }

    // Check if the user to remove is a member
    const memberToRemove = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: userIdToRemove,
        },
      },
    })

    if (memberToRemove === null) {
      throw new Error('User is not a member of this club')
    }

    // Remove the member (this will cascade delete rotation entry)
    await prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId: userIdToRemove,
        },
      },
    })

    // Check if any members remain
    const remainingMemberCount = await prisma.clubMember.count({
      where: { clubId },
    })

    // If no members remain, delete the club
    if (remainingMemberCount === 0) {
      await prisma.club.delete({
        where: { id: clubId },
      })
    } else {
      // Reorder rotation to fill gaps
      const rotation = await prisma.clubRotation.findMany({
        where: { clubId },
        orderBy: { order: 'asc' },
      })

      // Update order to be sequential
      await prisma.$transaction(
        rotation.map((r, index) =>
          prisma.clubRotation.update({
            where: { id: r.id },
            data: { order: index },
          })
        )
      )
    }
  },

  /**
   * Change a member's role (admin only)
   */
  async changeMemberRole(
    clubId: string,
    adminUserId: string,
    targetUserId: string,
    newRole: 'ADMIN' | 'MEMBER'
  ): Promise<void> {
    // Check if the requester is an admin
    const adminMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: adminUserId,
        },
      },
    })

    if (adminMembership === null) {
      throw new Error('Not a member of this club')
    }

    if (adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can change member roles')
    }

    // Check if the target user is a member
    const targetMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: targetUserId,
        },
      },
    })

    if (targetMembership === null) {
      throw new Error('User is not a member of this club')
    }

    // Update the role
    await prisma.clubMember.update({
      where: {
        clubId_userId: {
          clubId,
          userId: targetUserId,
        },
      },
      data: {
        role: newRole,
      },
    })
  },

  /**
   * Update club settings (admin only)
   */
  async updateClub(
    clubId: string,
    userId: string,
    updateData: {
      name?: string
      description?: string
      profilePictureUrl?: string
      isPublic?: boolean
    }
  ): Promise<ClubWithDetails> {
    // Check if the requester is an admin
    const adminMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (adminMembership === null) {
      throw new Error('Not a member of this club')
    }

    if (adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can update club settings')
    }

    // If name is being updated, check if it's available
    if (updateData.name !== undefined) {
      const existingClub = await prisma.club.findUnique({
        where: { name: updateData.name },
      })

      if (existingClub !== null && existingClub.id !== clubId) {
        throw new Error('A club with this name already exists')
      }
    }

    // Update the club
    const club = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      include: {
        members: true,
      },
    })

    return {
      id: club.id,
      name: club.name,
      description: club.description,
      profilePictureUrl: club.profilePictureUrl,
      isPublic: club.isPublic,
      createdById: club.createdById,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      memberCount: club.members.length,
      role: adminMembership.role,
    }
  },
}

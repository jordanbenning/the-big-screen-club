import { PrismaClient } from '@prisma/client'

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

    // Create the club and add creator as admin in a transaction
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

    // Delete the membership
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
    })

    if (existingInvitation !== null) {
      throw new Error('User already has a pending invitation')
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.clubInvitation.create({
      data: {
        clubId,
        invitedUserId: userToInvite.id,
        invitedByUserId,
        expiresAt,
      },
    })
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

    // Remove the member
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

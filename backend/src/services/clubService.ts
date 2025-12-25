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
}

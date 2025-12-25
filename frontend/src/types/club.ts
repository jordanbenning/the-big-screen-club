export type ClubRole = 'ADMIN' | 'MEMBER'

export interface Club {
  id: string
  name: string
  description: string | null
  profilePictureUrl: string | null
  isPublic: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  memberCount: number
  role: ClubRole
}

export interface ClubMember {
  id: string
  username: string
  email: string
  role: ClubRole
  joinedAt: string
}

export interface ClubFormData {
  name: string
  description: string
  isPublic: boolean
  profilePicture: File | null
}

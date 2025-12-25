import axios from 'axios'

import type { Club, ClubFormData, ClubMember, ClubRole } from '../types/club'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const clubApi = {
  /**
   * Create a new club
   */
  async createClub(formData: ClubFormData): Promise<Club> {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('description', formData.description)
    data.append('isPublic', formData.isPublic.toString())

    if (formData.profilePicture !== null) {
      data.append('profilePicture', formData.profilePicture)
    }

    const response = await api.post<Club>('/api/clubs', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  /**
   * Get all clubs the current user is a member of
   */
  async getUserClubs(): Promise<Club[]> {
    const response = await api.get<Club[]>('/api/clubs')
    return response.data
  },

  /**
   * Get a specific club by ID
   */
  async getClubById(id: string): Promise<Club> {
    const response = await api.get<Club>(`/api/clubs/${id}`)
    return response.data
  },

  /**
   * Get club members
   */
  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const response = await api.get<ClubMember[]>(`/api/clubs/${clubId}/members`)
    return response.data
  },

  /**
   * Leave a club
   */
  async leaveClub(clubId: string): Promise<void> {
    await api.post(`/api/clubs/${clubId}/leave`)
  },

  /**
   * Invite a member to a club by username
   */
  async inviteMember(clubId: string, username: string): Promise<void> {
    await api.post(`/api/clubs/${clubId}/invite`, { username })
  },

  /**
   * Remove a member from a club
   */
  async removeMember(clubId: string, userId: string): Promise<void> {
    await api.delete(`/api/clubs/${clubId}/members/${userId}`)
  },

  /**
   * Change a member's role
   */
  async changeMemberRole(
    clubId: string,
    userId: string,
    role: ClubRole
  ): Promise<void> {
    await api.patch(`/api/clubs/${clubId}/members/${userId}/role`, { role })
  },

  /**
   * Update club settings
   */
  async updateClub(clubId: string, formData: ClubFormData): Promise<Club> {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('description', formData.description)
    data.append('isPublic', formData.isPublic.toString())

    if (formData.profilePicture !== null) {
      data.append('profilePicture', formData.profilePicture)
    }

    const response = await api.patch<Club>(`/api/clubs/${clubId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}

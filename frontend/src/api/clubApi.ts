import axios from 'axios'

import type { Club, ClubFormData } from '../types/club'

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
}

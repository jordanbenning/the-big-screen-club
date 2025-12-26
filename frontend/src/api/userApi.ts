import axios from 'axios'

import type { UserSearchResult } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const userApi = {
  /**
   * Search for a user by username
   */
  async searchUserByUsername(username: string): Promise<UserSearchResult> {
    const response = await api.get<UserSearchResult>(
      `/api/users/search?username=${encodeURIComponent(username)}`
    )
    return response.data
  },
}

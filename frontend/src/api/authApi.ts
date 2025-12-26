import axios from 'axios'

import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
  User,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authApi = {
  async signup(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post<SignUpResponse>('/api/auth/signup', data)
    return response.data
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', data)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await api.get<{ user: User }>('/api/auth/me', {
      validateStatus: (status) => {
        // Treat both 200 and 401 as valid responses (not errors)
        return status === 200 || status === 401
      },
    })

    // If 401, user is not authenticated
    if (response.status === 401) {
      return null
    }

    // If 200, return the user data
    return response.data.user
  },

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(
      '/api/auth/forgot-password',
      data
    )
    return response.data
  },

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
      '/api/auth/reset-password',
      data
    )
    return response.data
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      '/api/auth/resend-verification',
      { email }
    )
    return response.data
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
      '/api/auth/account',
      { data: { password } }
    )
    return response.data
  },

  async updateProfile(updates: {
    username?: string
    email?: string
  }): Promise<{ message: string; user: User }> {
    const response = await api.patch<{ message: string; user: User }>(
      '/api/auth/profile',
      updates
    )
    return response.data
  },

  async updatePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(
      '/api/auth/password',
      data
    )
    return response.data
  },

  async updateProfilePicture(
    file: File
  ): Promise<{ message: string; user: User }> {
    const formData = new FormData()
    formData.append('profilePicture', file)

    const response = await api.patch<{ message: string; user: User }>(
      '/api/auth/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

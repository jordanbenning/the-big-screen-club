import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authApi } from '../authApi'

// Mock axios
vi.mock('axios')

const mockAxios = vi.mocked(axios, true)

describe('authApi - Delete Account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteAccount', () => {
    it('should send delete account request with password', async () => {
      const mockResponse = {
        data: {
          message: 'Account deleted successfully',
        },
        status: 200,
      }

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn().mockResolvedValue(mockResponse),
      })

      const result = await authApi.deleteAccount('password123')

      expect(result.message).toBe('Account deleted successfully')
    })

    it('should handle invalid password error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid password',
          },
          status: 401,
        },
      }

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn().mockRejectedValue(mockError),
      })

      await expect(authApi.deleteAccount('wrongpassword')).rejects.toEqual(
        mockError
      )
    })

    it('should handle unauthorized error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'Unauthorized',
          },
        },
      }

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn().mockRejectedValue(mockError),
      })

      await expect(authApi.deleteAccount('password123')).rejects.toEqual(
        mockError
      )
    })

    it('should send password in request data', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        data: { message: 'Success' },
        status: 200,
      })

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn(),
        get: vi.fn(),
        delete: mockDelete,
      })

      await authApi.deleteAccount('mypassword123')

      expect(mockDelete).toHaveBeenCalledWith('/api/auth/account', {
        data: { password: 'mypassword123' },
      })
    })
  })
})

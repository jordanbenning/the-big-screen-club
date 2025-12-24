import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authApi } from '../authApi';

// Mock axios
vi.mock('axios');

const mockAxios = vi.mocked(axios, true);

describe('authApi - Password Reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should send POST request to /api/auth/forgot-password', async () => {
      const mockResponse = {
        data: {
          message:
            'If an account exists with this email, a password reset link will be sent.',
        },
        status: 200,
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        get: vi.fn(),
      });

      const result = await authApi.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors for forgotPassword', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid email format',
          },
          status: 400,
        },
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      });

      await expect(
        authApi.forgotPassword({ email: 'invalid-email' })
      ).rejects.toEqual(mockError);
    });

    it('should send email in request body', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: { message: 'Success' },
        status: 200,
      });

      mockAxios.create = vi.fn().mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authApi.forgotPassword({ email: 'test@example.com' });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should send POST request to /api/auth/reset-password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        isVerified: true,
        createdAt: '2024-01-01',
      };

      const mockResponse = {
        data: {
          message: 'Password reset successful',
          user: mockUser,
        },
        status: 200,
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        get: vi.fn(),
      });

      const result = await authApi.resetPassword({
        token: 'valid-token',
        password: 'NewPassword123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle API errors for resetPassword', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid or expired reset token',
          },
          status: 400,
        },
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      });

      await expect(
        authApi.resetPassword({
          token: 'invalid-token',
          password: 'NewPassword123',
        })
      ).rejects.toEqual(mockError);
    });

    it('should send token and password in request body', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          message: 'Success',
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            isVerified: true,
            createdAt: '2024-01-01',
          },
        },
        status: 200,
      });

      mockAxios.create = vi.fn().mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authApi.resetPassword({
        token: 'valid-token-123',
        password: 'SecurePassword456',
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'valid-token-123',
        password: 'SecurePassword456',
      });
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      });

      await expect(
        authApi.resetPassword({
          token: 'valid-token',
          password: 'NewPassword123',
        })
      ).rejects.toThrow('Network Error');
    });
  });
});

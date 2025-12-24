import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authApi } from '../authApi';

// Mock axios
vi.mock('axios');

const mockAxios = vi.mocked(axios, true);

describe('authApi - Resend Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resendVerification', () => {
    it('should send resend verification request', async () => {
      const mockResponse = {
        data: {
          message: 'Verification email sent! Please check your inbox.',
        },
        status: 200,
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        get: vi.fn(),
      });

      const result = await authApi.resendVerification('test@example.com');

      expect(result.message).toBe(
        'Verification email sent! Please check your inbox.'
      );
    });

    it('should handle error response', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Email is already verified',
          },
          status: 400,
        },
      };

      mockAxios.create = vi.fn().mockReturnValue({
        post: vi.fn().mockRejectedValue(mockError),
        get: vi.fn(),
      });

      await expect(
        authApi.resendVerification('verified@example.com')
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

      await authApi.resendVerification('test@example.com');

      expect(mockPost).toHaveBeenCalledWith('/api/auth/resend-verification', {
        email: 'test@example.com',
      });
    });
  });
});

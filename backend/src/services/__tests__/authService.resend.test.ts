import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../authService';

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

describe('AuthService - Resend Verification', () => {
  let authService: AuthService;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    authService = new AuthService();
    mockPrisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('resendVerificationEmail', () => {
    it('should generate a new token for unverified user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(mockPrisma.verificationToken.deleteMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(mockPrisma.verificationToken.create).mockResolvedValue({
        id: 'token-1',
        token: 'new-verification-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result =
        await authService.resendVerificationEmail('test@example.com');

      expect(result.username).toBe('testuser');
      expect(result.token).toBeTruthy();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });

    it('should throw error if user not found', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.resendVerificationEmail('nonexistent@example.com')
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user is already verified', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true, // Already verified
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

      await expect(
        authService.resendVerificationEmail('test@example.com')
      ).rejects.toThrow('Email is already verified');
    });
  });
});

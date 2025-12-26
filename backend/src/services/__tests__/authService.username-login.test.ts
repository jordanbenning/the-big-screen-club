import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../authService'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  }
})

vi.mock('bcrypt')

describe('AuthService - Username/Email Login', () => {
  let authService: AuthService
  let mockPrisma: PrismaClient

  beforeEach(() => {
    authService = new AuthService()
    mockPrisma = new PrismaClient()
    vi.clearAllMocks()
  })

  describe('authenticateUser with email', () => {
    it('should authenticate user with email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const result = await authService.authenticateUser(
        'test@example.com',
        'password123'
      )

      expect(result.email).toBe('test@example.com')
      expect(result.username).toBe('testuser')
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should reject unverified user logging in with email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)

      await expect(
        authService.authenticateUser('test@example.com', 'password123')
      ).rejects.toThrow('Please verify your email before logging in')
    })
  })

  describe('authenticateUser with username', () => {
    it('should authenticate user with username', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const result = await authService.authenticateUser(
        'testuser',
        'password123'
      )

      expect(result.email).toBe('test@example.com')
      expect(result.username).toBe('testuser')
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      })
    })

    it('should reject unverified user logging in with username', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('Please verify your email before logging in')
    })

    it('should reject invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(
        authService.authenticateUser('testuser', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })

    it('should reject non-existent user', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null)

      await expect(
        authService.authenticateUser('nonexistent', 'password123')
      ).rejects.toThrow('Invalid credentials')
    })

    it('should authenticate user with case-insensitive username', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePictureUrl: null,
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      // Test with uppercase username
      const result = await authService.authenticateUser(
        'TestUser',
        'password123'
      )

      expect(result.email).toBe('test@example.com')
      expect(result.username).toBe('testuser')
      // Verify that the username was normalized to lowercase before query
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      })
    })

    it('should authenticate user with mixed case username', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePictureUrl: null,
      }

      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      // Test with mixed case username
      const result = await authService.authenticateUser(
        'TeStUsEr',
        'password123'
      )

      expect(result.email).toBe('test@example.com')
      expect(result.username).toBe('testuser')
      // Verify that the username was normalized to lowercase before query
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      })
    })
  })
})

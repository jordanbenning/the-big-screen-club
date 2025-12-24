import crypto from 'crypto'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

import type { UserResponse } from '../types/auth'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10
const TOKEN_EXPIRY_HOURS = 24

export class AuthService {
  async createUser(
    email: string,
    password: string,
    username: string
  ): Promise<UserResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser !== null) {
      if (existingUser.email === email) {
        throw new Error('Email already in use')
      }
      throw new Error('Username already taken')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        isVerified: false,
      },
    })

    return this.toUserResponse(user)
  }

  async generateVerificationToken(userId: string): Promise<string> {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS)

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId },
    })

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    })

    return token
  }

  async verifyToken(token: string): Promise<UserResponse> {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (verificationToken === null) {
      throw new Error('Invalid verification token')
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      throw new Error('Verification token has expired')
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isVerified: true },
    })

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { token },
    })

    return this.toUserResponse(user)
  }

  async authenticateUser(
    emailOrUsername: string,
    password: string
  ): Promise<UserResponse> {
    // Determine if input is email (contains @) or username
    const isEmail = emailOrUsername.includes('@')

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: emailOrUsername }
        : { username: emailOrUsername },
    })

    if (user === null) {
      throw new Error('Invalid credentials')
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    return this.toUserResponse(user)
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (user === null) {
      return null
    }

    return this.toUserResponse(user)
  }

  async requestPasswordReset(
    email: string
  ): Promise<{ username: string; token: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists for security
    if (user === null) {
      throw new Error(
        'If an account exists with this email, a password reset link will be sent.'
      )
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS)

    // Delete any existing tokens for this user (both verification and reset)
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    return { username: user.username, token }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<UserResponse> {
    // Find the reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (resetToken === null) {
      throw new Error('Invalid or expired reset token')
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      throw new Error('Reset token has expired')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update user's password and mark as verified
    // (they proved email access by using the reset token)
    const user = await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    })

    // Delete the reset token (one-time use)
    await prisma.verificationToken.delete({
      where: { token },
    })

    return this.toUserResponse(user)
  }

  async resendVerificationEmail(
    email: string
  ): Promise<{ username: string; token: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user === null) {
      throw new Error('User not found')
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw new Error('Email is already verified')
    }

    // Generate new verification token (this will delete any existing tokens)
    const token = await this.generateVerificationToken(user.id)

    return { username: user.username, token }
  }

  async deleteAccount(
    userId: string,
    password: string
  ): Promise<{ message: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (user === null) {
      throw new Error('User not found')
    }

    // Verify password for security
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    // Delete user (cascade will handle verification tokens)
    await prisma.user.delete({
      where: { id: userId },
    })

    return { message: 'Account deleted successfully' }
  }

  private toUserResponse(user: {
    id: string
    email: string
    username: string
    isVerified: boolean
    createdAt: Date
    password: string
    updatedAt: Date
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }
  }
}

export const authService = new AuthService()

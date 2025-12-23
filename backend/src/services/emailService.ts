import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

class EmailService {
  private transporter: Transporter | null = null;

  async initialize(): Promise<void> {
    // Check if SMTP credentials are provided in environment
    if (
      process.env.SMTP_HOST !== undefined &&
      process.env.SMTP_HOST !== '' &&
      process.env.SMTP_USER !== undefined &&
      process.env.SMTP_USER !== ''
    ) {
      // Use provided SMTP credentials (for production)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Use Ethereal Email for development
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Using Ethereal Email for development');
      console.log(`   Preview emails at: https://ethereal.email/messages`);
      console.log(`   User: ${testAccount.user}`);
    }
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    token: string
  ): Promise<void> {
    if (this.transporter === null) {
      await this.initialize();
    }

    if (this.transporter === null) {
      throw new Error('Email transporter not initialized');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify?token=${token}`;

    const info = await this.transporter.sendMail({
      from: '"The Big Screen Club" <noreply@bigscreenclub.com>',
      to,
      subject: 'Verify your email - The Big Screen Club',
      text: `Hello ${username},\n\nThank you for signing up for The Big Screen Club!\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nThe Big Screen Club Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 The Big Screen Club</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${username}!</h2>
              <p>Thank you for signing up for The Big Screen Club!</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p><small>This link will expire in 24 hours.</small></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>The Big Screen Club - Your movie club, your way</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Log preview URL for Ethereal Email (development only)
    if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST === '') {
      console.log(`📬 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    username: string,
    token: string
  ): Promise<void> {
    if (this.transporter === null) {
      await this.initialize();
    }

    if (this.transporter === null) {
      throw new Error('Email transporter not initialized');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const info = await this.transporter.sendMail({
      from: '"The Big Screen Club" <noreply@bigscreenclub.com>',
      to,
      subject: 'Reset your password - The Big Screen Club',
      text: `Hello ${username},\n\nWe received a request to reset your password.\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nThe Big Screen Club Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 The Big Screen Club</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello, ${username}!</p>
              <p>We received a request to reset your password.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><small>This link will expire in 24 hours.</small></p>
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>The Big Screen Club - Your movie club, your way</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Log preview URL for Ethereal Email (development only)
    if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST === '') {
      console.log(`📬 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }
}

export const emailService = new EmailService();

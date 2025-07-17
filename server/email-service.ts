import { randomBytes } from "crypto";

export interface EmailService {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void>;
  sendWelcomeEmail(email: string, name?: string): Promise<void>;
}

// Mock email service for development - logs emails to console
export class MockEmailService implements EmailService {
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    console.log(`
========== EMAIL VERIFICATION ==========
To: ${email}
Subject: Verify your TableTalk account

Hello ${name || 'there'},

Welcome to TableTalk! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The TableTalk Team
=======================================
    `);
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    console.log(`
========== PASSWORD RESET ==========
To: ${email}
Subject: Reset your TableTalk password

Hello ${name || 'there'},

You requested to reset your password for TableTalk. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
The TableTalk Team
===================================
    `);
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    console.log(`
========== WELCOME EMAIL ==========
To: ${email}
Subject: Welcome to TableTalk!

Hello ${name || 'there'},

Welcome to TableTalk! Your email has been verified and your account is ready to use.

You can now:
- Upload PBN files to analyze bridge games
- View and comment on bridge hands
- Practice bidding sequences
- Connect with other bridge players

Get started by uploading your first game at: ${process.env.BASE_URL || 'http://localhost:5000'}

Best regards,
The TableTalk Team
==================================
    `);
  }
}

// Generate a secure random token
export function generateEmailToken(): string {
  return randomBytes(32).toString('hex');
}

// Email validation regex
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Create email service instance
export const emailService: EmailService = new MockEmailService();
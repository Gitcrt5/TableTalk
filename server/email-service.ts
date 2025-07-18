import { randomBytes } from "crypto";
import { MailService } from '@sendgrid/mail';

export interface EmailService {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void>;
  sendWelcomeEmail(email: string, name?: string): Promise<void>;
}

// SendGrid email service for production
export class SendGridEmailService implements EmailService {
  private mailService: MailService;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = 'noreply@tabletalk.com') {
    this.mailService = new MailService();
    this.mailService.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    try {
      await this.mailService.send({
        to: email,
        from: this.fromEmail,
        subject: 'Verify your TableTalk account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to TableTalk!</h2>
            <p>Hello ${name || 'there'},</p>
            <p>Welcome to TableTalk! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The TableTalk Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('SendGrid email failed, falling back to console logging:', error);
      // Fall back to console logging for development
      console.log('\n=== EMAIL VERIFICATION (SendGrid Failed) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Verify your TableTalk account`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log(`Name: ${name || 'N/A'}`);
      console.log('==========================================\n');
    }
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    try {
      await this.mailService.send({
        to: email,
        from: this.fromEmail,
        subject: 'Reset your TableTalk password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hello ${name || 'there'},</p>
            <p>You requested to reset your password for TableTalk. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>The TableTalk Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('SendGrid email failed, falling back to console logging:', error);
      // Fall back to console logging for development
      console.log('\n=== PASSWORD RESET (SendGrid Failed) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Reset your TableTalk password`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Name: ${name || 'N/A'}`);
      console.log('=======================================\n');
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      await this.mailService.send({
        to: email,
        from: this.fromEmail,
        subject: 'Welcome to TableTalk!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to TableTalk!</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Welcome to TableTalk! Your email has been verified and your account is ready to use.</p>
          <h3>You can now:</h3>
          <ul>
            <li>Upload PBN files to analyze bridge games</li>
            <li>View and comment on bridge hands</li>
            <li>Practice bidding sequences</li>
            <li>Connect with other bridge players</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
          </div>
          <p>Best regards,<br>The TableTalk Team</p>
        </div>
      `,
    });
    } catch (error) {
      console.error('SendGrid email failed, falling back to console logging:', error);
      // Fall back to console logging for development
      console.log('\n=== WELCOME EMAIL (SendGrid Failed) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to TableTalk!`);
      console.log(`Name: ${name || 'N/A'}`);
      console.log('=======================================\n');
    }
  }
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
export const emailService: EmailService = process.env.SENDGRID_API_KEY 
  ? new SendGridEmailService(process.env.SENDGRID_API_KEY, 'craig@craigandlee.com')
  : new MockEmailService();
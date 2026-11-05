import { config } from '../config.js';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface IEmailService {
  sendEmail(message: EmailMessage): Promise<boolean>;
  sendVerificationEmail(email: string, name: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean>;
}

export class EmailService implements IEmailService {
  async sendEmail(message: EmailMessage): Promise<boolean> {
    // If SMTP host is configured, we can dispatch via SMTP/transporter
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      try {
        // Dynamic import if nodemailer is installed
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          secure: config.SMTP_SECURE,
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: config.EMAIL_FROM,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });

        return true;
      } catch (error) {
        console.error('[EmailService] Failed to send email via SMTP:', error);
        return false;
      }
    }

    // In development / test or without SMTP credentials: Log to console
    if (config.NODE_ENV !== 'test') {
      console.log(`\n================== [EMAIL DISPATCHED] ==================`);
      console.log(`To: ${message.to}`);
      console.log(`From: ${config.EMAIL_FROM}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body:\n${message.text}`);
      console.log(`========================================================\n`);
    }

    return true;
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Foodie Café',
      text: `Hello ${name},\n\nWelcome to Foodie Café! Please verify your email by clicking the link below or using this token:\n${token}\n\nLink: ${verificationUrl}\n\nThis token will expire in 24 hours.\n\nBest,\nFoodie Café Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #ea580c;">Welcome to Foodie Café, ${name}!</h2>
          <p>Please confirm your email address to activate your account and start ordering delicious food.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or use this verification code directly:</p>
          <code style="background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 16px; font-weight: bold; display: block; word-break: break-all;">${token}</code>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This link will expire in 24 hours. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Foodie Café',
      text: `Hello ${name},\n\nYou requested a password reset for your Foodie Café account. Use this token or link:\n${token}\n\nLink: ${resetUrl}\n\nThis token will expire in 1 hour. If you didn't request this, ignore this email.\n\nBest,\nFoodie Café Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #ea580c;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your Foodie Café account password.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or use this reset code directly:</p>
          <code style="background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 16px; font-weight: bold; display: block; word-break: break-all;">${token}</code>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This code will expire in 1 hour and can only be used once. If you did not request this, please secure your account immediately.</p>
        </div>
      `,
    });
  }
}

export const defaultEmailService = new EmailService();


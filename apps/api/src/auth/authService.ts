import type { PrismaClient } from '@prisma/client';
import { AppError } from '../security/errorHandler.js';
import { defaultEmailService, type IEmailService } from '../infrastructure/emailService.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_DAYS,
  generateAccessToken,
  generateSecureRandomToken,
  hashToken,
} from './tokens.js';
import { generateMfaSecret, getOtpAuthUri, verifyTotpCode } from './totp.js';
import type { AuthResult, AuthTokens, UserSessionSummary } from './types.js';
import type { LoginInput, RegisterInput } from './schemas.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly emailService: IEmailService = defaultEmailService,
  ) {}

  /**
   * Registers a new user with Argon2id password hashing and creates an email verification token.
   */
  async register(input: RegisterInput): Promise<{
    user: AuthResult['user'];
    verificationToken?: string;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email address already exists.', 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        isEmailVerified: false,
      },
    });

    // Create single-use Email Verification Token (24 hours)
    const rawToken = generateSecureRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send verification email via configured email service
    await this.emailService.sendVerificationEmail(user.email, user.name, rawToken).catch((err) => {
      console.error('[AuthService] Failed to send verification email:', err);
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled,
      },
      verificationToken: rawToken, // Returned in dev/test for immediate verification
    };
  }

  /**
   * Authenticates user credentials with brute-force protection, account lockout, and MFA check.
   */
  async login(
    input: LoginInput,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    // Check Account Lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        'ACCOUNT_LOCKED',
        `Account temporarily locked due to excessive failed attempts. Try again in ${waitMinutes} minutes.`,
        423,
      );
    }

    // Verify Password with Argon2id
    const passwordValid = await verifyPassword(user.passwordHash, input.password);
    if (!passwordValid) {
      const failedCount = user.failedLoginAttempts + 1;
      const shouldLock = failedCount >= MAX_FAILED_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      });

      if (shouldLock) {
        throw new AppError(
          'ACCOUNT_LOCKED',
          'Account locked due to 5 consecutive failed attempts. Please wait 15 minutes or reset your password.',
          423,
        );
      }

      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Check Multi-Factor Authentication (MFA)
    if (user.mfaEnabled && user.mfaSecret) {
      if (!input.mfaCode) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            mfaEnabled: true,
          },
          requiresMfa: true,
        };
      }

      const mfaValid = verifyTotpCode(input.mfaCode, user.mfaSecret);
      if (!mfaValid) {
        throw new AppError('INVALID_MFA_CODE', 'Invalid or expired 6-digit MFA code.', 401);
      }
    }

    // Issue tokens and record session
    const tokens = await this.createSession(user.id, user, meta);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  /**
   * Generates Access Token + Refresh Token, storing the hashed refresh token in the Session table.
   */
  private async createSession(
    userId: string,
    userPayload: { email: string; role: any; isEmailVerified: boolean; mfaEnabled: boolean },
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const accessToken = generateAccessToken({
      userId,
      email: userPayload.email,
      role: userPayload.role,
      isEmailVerified: userPayload.isEmailVerified,
      mfaEnabled: userPayload.mfaEnabled,
    });

    const rawRefreshToken = generateSecureRandomToken(48);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        deviceInfo: meta.userAgent?.slice(0, 250) || null,
        ipAddress: meta.ipAddress?.slice(0, 45) || null,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresInSeconds: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Refreshes access token with Refresh Token Rotation.
   * If a revoked token is presented, all user sessions are revoked to protect against session hijacking.
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<AuthTokens> {
    const tokenHash = hashToken(rawRefreshToken);

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Reuse detection
    if (!session || session.revokedAt) {
      if (session) {
        // Potential token theft: Revoke all sessions for this user!
        await this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new AppError('REFRESH_TOKEN_INVALID', 'Invalid or expired session. Please log in again.', 401);
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new AppError('REFRESH_TOKEN_EXPIRED', 'Session has expired. Please log in again.', 401);
    }

    // Revoke old session (Rotation)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create new session
    return this.createSession(session.user.id, session.user, meta);
  }

  /**
   * Logs out the current device session by revoking its refresh token.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all active sessions across all devices for a user.
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Returns list of active sessions for the user.
   */
  async getActiveSessions(userId: string, currentTokenHash?: string): Promise<UserSessionSummary[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: currentTokenHash ? s.tokenHash === currentTokenHash : false,
    }));
  }

  /**
   * Revokes a specific session by ID.
   */
  async revokeSessionById(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Requests a password reset token. Safe against user enumeration.
   */
  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If an account exists with this email, a reset token has been dispatched.' };
    }

    // Invalidate previous unused reset tokens
    await this.prisma.verificationToken.updateMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = generateSecureRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Send password reset email via configured email service
    await this.emailService.sendPasswordResetEmail(user.email, user.name, rawToken).catch((err) => {
      console.error('[AuthService] Failed to send password reset email:', err);
    });

    return {
      message: 'If an account exists with this email, a reset token has been dispatched.',
      resetToken: rawToken, // Returned in dev/test for immediate testing
    };
  }

  /**
   * Confirms password reset with single-use token enforcement and revokes all active sessions.
   */
  async confirmPasswordReset(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const record = await this.prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new AppError('RESET_TOKEN_INVALID', 'Password reset token is invalid, used, or expired.', 400);
    }

    // Enforce single-use
    await this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Hash new password with Argon2id
    const passwordHash = await hashPassword(newPassword);

    // Update password and reset lockout
    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Security best practice: revoke all active sessions on password change
    await this.logoutAllDevices(record.userId);
  }

  /**
   * Verifies user email using single-use verification token.
   */
  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const record = await this.prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new AppError('VERIFY_TOKEN_INVALID', 'Email verification token is invalid or expired.', 400);
    }

    await this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    });
  }

  /**
   * Initiates MFA setup by generating a TOTP secret and QR URI.
   */
  async setupMfa(userId: string): Promise<{ secret: string; otpAuthUri: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    }

    const secret = generateMfaSecret();
    const otpAuthUri = getOtpAuthUri(user.email, secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, otpAuthUri };
  }

  /**
   * Activates MFA after user confirms a valid 6-digit code.
   */
  async verifyAndActivateMfa(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new AppError('MFA_NOT_INITIALIZED', 'MFA setup has not been initiated.', 400);
    }

    const valid = verifyTotpCode(code, user.mfaSecret);
    if (!valid) {
      throw new AppError('INVALID_MFA_CODE', 'Invalid 6-digit authentication code.', 400);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }
}


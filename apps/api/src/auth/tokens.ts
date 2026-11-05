import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AccessTokenPayload } from './types.js';

export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

/**
 * Signs a short-lived JWT access token (15 minutes).
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    algorithm: 'HS256',
  });
}

/**
 * Verifies and decodes a JWT access token.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  }) as AccessTokenPayload;
}

/**
 * Generates a cryptographically strong random token for refresh sessions or verification.
 */
export function generateSecureRandomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Creates a deterministic SHA-256 hex hash of a raw token.
 * Tokens are stored hashed in the database so that database leaks cannot compromise active sessions.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}


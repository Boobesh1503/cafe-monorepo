export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
}

export interface UserSessionSummary {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
  };
  tokens?: AuthTokens;
  requiresMfa?: boolean;
  tempToken?: string;
}


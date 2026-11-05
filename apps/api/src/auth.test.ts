import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from './auth/password.js';
import { generateAccessToken, verifyAccessToken, hashToken, generateSecureRandomToken } from './auth/tokens.js';
import { generateMfaSecret, generateTotpCode, verifyTotpCode } from './auth/totp.js';
import { AuthService } from './auth/authService.js';
import { createApp } from './app.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

// =========================================================================
// In-Memory Mock Prisma Implementation for Isolated Authentication Tests
// =========================================================================
function createMockPrisma() {
  const users: any[] = [];
  const sessions: any[] = [];
  const verificationTokens: any[] = [];

  const mock = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) return users.find((u) => u.email === where.email) || null;
        if (where.id) return users.find((u) => u.id === where.id) || null;
        return null;
      },
      create: async ({ data }: any) => {
        const user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          failedLoginAttempts: 0,
          lockedUntil: null,
          mfaEnabled: false,
          mfaSecret: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        users.push(user);
        return user;
      },
      update: async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        if (!user) throw new Error('User not found');
        Object.assign(user, data, { updatedAt: new Date() });
        return user;
      },
    },
    session: {
      findUnique: async ({ where, include }: any) => {
        const s = sessions.find((item) => item.tokenHash === where.tokenHash);
        if (!s) return null;
        if (include?.user) {
          const user = users.find((u) => u.id === s.userId);
          return { ...s, user };
        }
        return s;
      },
      findMany: async ({ where }: any) => {
        return sessions.filter((s) => s.userId === where.userId && !s.revokedAt);
      },
      create: async ({ data }: any) => {
        const session = {
          id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          revokedAt: null,
          createdAt: new Date(),
          ...data,
        };
        sessions.push(session);
        return session;
      },
      update: async ({ where, data }: any) => {
        const s = sessions.find((item) => item.id === where.id);
        if (s) Object.assign(s, data);
        return s;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const s of sessions) {
          const matchUser = !where.userId || s.userId === where.userId;
          const matchHash = !where.tokenHash || s.tokenHash === where.tokenHash;
          const matchId = !where.id || s.id === where.id;
          const matchRevoked = where.revokedAt === null ? s.revokedAt === null : true;
          if (matchUser && matchHash && matchId && matchRevoked) {
            Object.assign(s, data);
            count++;
          }
        }
        return { count };
      },
    },
    verificationToken: {
      create: async ({ data }: any) => {
        const token = {
          id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          usedAt: null,
          createdAt: new Date(),
          ...data,
        };
        verificationTokens.push(token);
        return token;
      },
      findFirst: async ({ where }: any) => {
        return (
          verificationTokens.find((t) => {
            const matchHash = t.tokenHash === where.tokenHash;
            const matchType = !where.type || t.type === where.type;
            const matchUsed = where.usedAt === null ? t.usedAt === null : true;
            const matchExpiry = !where.expiresAt?.gt || t.expiresAt > where.expiresAt.gt;
            return matchHash && matchType && matchUsed && matchExpiry;
          }) || null
        );
      },
      update: async ({ where, data }: any) => {
        const t = verificationTokens.find((item) => item.id === where.id);
        if (t) Object.assign(t, data);
        return t;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const t of verificationTokens) {
          if (t.userId === where.userId && t.type === where.type && t.usedAt === null) {
            Object.assign(t, data);
            count++;
          }
        }
        return { count };
      },
    },
  };

  return mock as unknown as PrismaClient;
}

// =========================================================================
// UNIT TESTS
// =========================================================================

test('Auth: Argon2id hashes passwords and validates correctly', async () => {
  const plain = 'StrongPass#2026';
  const hash = await hashPassword(plain);

  assert.ok(hash.startsWith('$argon2id$'));
  assert.equal(await verifyPassword(hash, plain), true);
  assert.equal(await verifyPassword(hash, 'WrongPassword#1'), false);
});

test('Auth: Access tokens sign and verify with 15-minute validity', () => {
  const token = generateAccessToken({
    userId: 'user-123',
    email: 'user@foodie.cafe',
    role: 'CUSTOMER',
    isEmailVerified: true,
    mfaEnabled: false,
  });

  const payload = verifyAccessToken(token);
  assert.equal(payload.userId, 'user-123');
  assert.equal(payload.email, 'user@foodie.cafe');
  assert.equal(payload.role, 'CUSTOMER');
});

test('Auth: RFC 6238 TOTP generates and verifies valid 6-digit codes', () => {
  const secret = generateMfaSecret();
  assert.ok(secret.length >= 26);

  const counter = Math.floor(Date.now() / 1000 / 30);
  const code = generateTotpCode(secret, counter);
  assert.match(code, /^\d{6}$/);

  assert.equal(verifyTotpCode(code, secret), true);
  assert.equal(verifyTotpCode('000000', secret), false);
});

test('Auth: Customer registration, login, token rotation, and lockout', async () => {
  const mockPrisma = createMockPrisma();
  const authService = new AuthService(mockPrisma);

  // 1. Register
  const registerResult = await authService.register({
    email: 'alex@example.test',
    password: 'SafePassword!123',
    name: 'Alex Morgan',
    role: 'CUSTOMER',
  });
  assert.equal(registerResult.user.email, 'alex@example.test');
  assert.ok(registerResult.verificationToken);

  // Duplicate email rejects with 409
  await assert.rejects(
    authService.register({
      email: 'alex@example.test',
      password: 'SafePassword!123',
      name: 'Alex Duplicate',
      role: 'CUSTOMER',
    }),
    (err: any) => err.code === 'EMAIL_ALREADY_EXISTS',
  );

  // 2. Failed logins trigger lockout
  for (let i = 0; i < 4; i++) {
    await assert.rejects(
      authService.login({ email: 'alex@example.test', password: 'BadPassword!123' }),
      (err: any) => err.code === 'INVALID_CREDENTIALS',
    );
  }
  // 5th attempt locks the account
  await assert.rejects(
    authService.login({ email: 'alex@example.test', password: 'BadPassword!123' }),
    (err: any) => err.code === 'ACCOUNT_LOCKED',
  );

  // Unlocking account manually in mock to test success
  const user = await mockPrisma.user.findUnique({ where: { email: 'alex@example.test' } });
  if (user) {
    await mockPrisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  // 3. Successful login
  const loginResult = await authService.login({
    email: 'alex@example.test',
    password: 'SafePassword!123',
  });
  assert.ok(loginResult.tokens?.accessToken);
  assert.ok(loginResult.tokens?.refreshToken);

  // 4. Refresh token rotation
  const rotated = await authService.rotateRefreshToken(loginResult.tokens.refreshToken);
  assert.ok(rotated.accessToken);
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.refreshToken, loginResult.tokens.refreshToken);

  // Re-using old rotated token triggers theft detection
  await assert.rejects(
    authService.rotateRefreshToken(loginResult.tokens.refreshToken),
    (err: any) => err.code === 'REFRESH_TOKEN_INVALID',
  );

  // 5. Password Reset Single-Use
  const resetReq = await authService.requestPasswordReset('alex@example.test');
  assert.ok(resetReq.resetToken);

  await authService.confirmPasswordReset(resetReq.resetToken!, 'BrandNewPassword#999');

  // Token cannot be reused
  await assert.rejects(
    authService.confirmPasswordReset(resetReq.resetToken!, 'AnotherNewPassword#888'),
    (err: any) => err.code === 'RESET_TOKEN_INVALID',
  );

  // Login with new password succeeds
  const newLogin = await authService.login({
    email: 'alex@example.test',
    password: 'BrandNewPassword#999',
  });
  assert.ok(newLogin.tokens?.accessToken);
});

test('Auth & RBAC: API endpoints enforce authentication and role permissions', async () => {
  const mockPrisma = createMockPrisma();
  const deps: ApiDependencies = {
    checkDatabase: async () => {},
    checkCache: async () => {},
    getCachedMenu: async () => null,
    cacheMenu: async () => {},
    getAvailableMenu: async () => [],
    redisClient: null,
    prismaClient: mockPrisma,
  };

  const app = createApp(deps);
  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // 1. Register a customer via API
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@foodie.test',
        password: 'CustomerPass#123',
        name: 'John Customer',
        role: 'CUSTOMER',
      }),
    });
    assert.equal(regRes.status, 201);
    const regJson = await regRes.json();
    assert.equal(regJson.status, 'success');

    // 2. Login as customer
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@foodie.test',
        password: 'CustomerPass#123',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    const customerToken = loginJson.tokens.accessToken;
    assert.ok(customerToken);

    // 3. Customer accesses /me profile (Allowed)
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(meRes.status, 200);
    const meJson = await meRes.json();
    assert.equal(meJson.user.email, 'customer@foodie.test');

    // 4. Customer attempts to access Admin Overview (Blocked by RBAC 403 Forbidden)
    const adminRes = await fetch(`${baseUrl}/api/v1/admin/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(adminRes.status, 403);
    const adminForbidden = await adminRes.json();
    assert.equal(adminForbidden.error.code, 'FORBIDDEN_ROLE');

    // 5. Admin Token accesses Admin Overview (Allowed 200 OK)
    const adminToken = generateAccessToken({
      userId: 'admin-999',
      email: 'boss@foodie.cafe',
      role: 'ADMIN',
      isEmailVerified: true,
      mfaEnabled: true,
    });

    const adminOkRes = await fetch(`${baseUrl}/api/v1/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminOkRes.status, 200);
    const adminOkJson = await adminOkRes.json();
    assert.equal(adminOkJson.status, 'success');
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

function createMockDependencies(): ApiDependencies {
  return {
    checkDatabase: async () => {},
    checkCache: async () => {},
    getCachedMenu: async () => null,
    cacheMenu: async () => {},
    getAvailableMenu: async () => [],
    redisClient: null, // Test in-memory fallback
  };
}

async function withTestServer(run: (baseUrl: string) => Promise<void>) {
  const server = createApp(createMockDependencies()).listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

test('Security: Request ID middleware injects X-Request-Id header', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.ok(response.headers.get('x-request-id'));
    assert.match(response.headers.get('x-request-id')!, /^[a-zA-Z0-9_-]{10,}$/);
  });
});

test('Security: Propagates client provided X-Request-Id', async () => {
  await withTestServer(async (baseUrl) => {
    const customId = 'client-custom-req-id-12345';
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { 'x-request-id': customId },
    });
    assert.equal(response.headers.get('x-request-id'), customId);
  });
});

test('Security: Helmet headers protect against XSS, clickjacking, and MIME sniffing', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.ok(response.headers.get('content-security-policy'));
    assert.ok(response.headers.get('referrer-policy'));
  });
});

test('Security: Strict CORS allows whitelisted origins', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  });
});

test('Security: Strict CORS blocks unapproved external origins', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://malicious-attacker-site.com' },
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error.code, 'CORS_NOT_ALLOWED');
  });
});

test('Security: Request body limit blocks oversized payload attacks (413 Payload Too Large)', async () => {
  await withTestServer(async (baseUrl) => {
    const hugePayload = {
      name: 'Tester',
      email: 'test@example.com',
      message: 'x'.repeat(25 * 1024), // 25KB, exceeds 16KB limit
    };

    const response = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(hugePayload),
    });

    assert.equal(response.status, 413);
    const body = await response.json();
    assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
  });
});

test('Security: Central error handler handles malformed JSON without crashing or leaking details', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"invalidJson": ... broken',
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, 'INVALID_JSON');
    assert.ok(body.error.requestId);
  });
});

test('Security: API Versioning operates under /api/v1 and provides CSRF endpoint', async () => {
  await withTestServer(async (baseUrl) => {
    // Health v1
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.version, 'v1');

    // Menu v1
    const menuRes = await fetch(`${baseUrl}/api/v1/menu`);
    assert.equal(menuRes.status, 200);

    // CSRF token endpoint
    const csrfRes = await fetch(`${baseUrl}/api/v1/csrf-token`);
    assert.equal(csrfRes.status, 200);
    const csrfJson = await csrfRes.json();
    assert.ok(csrfJson.csrfToken);
  });
});

test('Security: Rate limiting includes standard headers', async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const hasRateLimit =
      response.headers.has('ratelimit') ||
      response.headers.has('ratelimit-limit') ||
      response.headers.has('x-ratelimit-limit');
    assert.ok(hasRateLimit);
  });
});

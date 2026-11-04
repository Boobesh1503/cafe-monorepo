import assert from 'node:assert/strict';
import test from 'node:test';
import type { MenuItem } from '@cafe/shared';
import { createApp } from './app.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

const menuItem: MenuItem = {
  id: 'test-coffee',
  name: 'Test Coffee',
  description: 'A test menu item.',
  priceCents: 450,
  category: 'coffee',
  tags: [],
  available: true,
};

function createDependencies(overrides: Partial<ApiDependencies> = {}): ApiDependencies {
  return {
    checkDatabase: async () => {},
    checkCache: async () => {},
    getCachedMenu: async () => null,
    cacheMenu: async () => {},
    getAvailableMenu: async () => [],
    ...overrides,
  };
}

async function withServer(dependencies: ApiDependencies, run: (baseUrl: string) => Promise<void>) {
  const server = createApp(dependencies).listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test('health endpoint reports healthy dependencies', async () => {
  await withServer(createDependencies(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'ok',
      service: 'cafe-api',
      dependencies: { database: 'ok', cache: 'ok' },
    });
  });
});

test('health endpoint reports dependency outages without details', async () => {
  await withServer(
    createDependencies({
      checkDatabase: async () => {
        throw new Error('connection URL containing a secret');
      },
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        status: 'degraded',
        service: 'cafe-api',
        dependencies: { database: 'unavailable', cache: 'ok' },
      });
    },
  );
});

test('menu endpoint returns database items and caches them', async () => {
  let cached: MenuItem[] | null = null;
  let reads = 0;
  await withServer(
    createDependencies({
      getCachedMenu: async () => cached,
      cacheMenu: async (items) => {
        cached = items;
      },
      getAvailableMenu: async () => {
        reads += 1;
        return [menuItem];
      },
    }),
    async (baseUrl) => {
      const first = await fetch(`${baseUrl}/api/menu`);
      const second = await fetch(`${baseUrl}/api/menu`);
      assert.deepEqual(await first.json(), [menuItem]);
      assert.deepEqual(await second.json(), [menuItem]);
      assert.equal(reads, 1);
    },
  );
});

test('menu endpoint falls back to the database when Redis is unavailable', async () => {
  await withServer(
    createDependencies({
      getCachedMenu: async () => {
        throw new Error('connection details must not be returned');
      },
      getAvailableMenu: async () => [menuItem],
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/menu`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), [menuItem]);
    },
  );
});

test('empty menu stays empty until menu items are added', async () => {
  await withServer(createDependencies(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/menu`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });
});

test('contact endpoint validates input without persisting it', async () => {
  await withServer(createDependencies(), async (baseUrl) => {
    const accepted = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Casey',
        email: 'casey@example.test',
        message: 'Hello, I would love to know your opening hours.',
      }),
    });
    assert.equal(accepted.status, 202);
    assert.deepEqual(await accepted.json(), { accepted: true });

    const rejected = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: 'short' }),
    });
    assert.equal(rejected.status, 400);
  });
});

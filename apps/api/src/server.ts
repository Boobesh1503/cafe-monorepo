import { createApp } from './app.js';
import { config } from './config.js';
import { apiDependencies } from './infrastructure/dependencies.js';
import { prisma } from './infrastructure/database.js';
import { redis } from './infrastructure/cache.js';

const app = createApp(apiDependencies);
const server = app.listen(config.API_PORT, () => {
  console.info(`Cafe API listening on http://localhost:${config.API_PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(async (error) => {
      if (error) {
        console.error('HTTP server shutdown failed.');
        process.exitCode = 1;
      }
      try {
        await prisma.$disconnect();
        redis.disconnect();
      } catch {
        console.error('Infrastructure shutdown failed; error details suppressed.');
        process.exitCode = 1;
      }
    });
  });
}

import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.API_PORT, () => {
  console.info(`Cafe API listening on http://localhost:${config.API_PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

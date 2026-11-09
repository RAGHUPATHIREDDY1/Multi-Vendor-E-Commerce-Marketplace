import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { connectCache } from './services/cacheService.js';
import { connectSearch } from './services/searchService.js';

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error(error.message);
  }
  await connectCache();
  await connectSearch();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  server.on('error', (error) => {
    console.error(`API server failed to start: ${error.message}`);
    process.exitCode = 1;
  });
}

startServer().catch(() => {
  console.error('API startup failed.');
  process.exitCode = 1;
});

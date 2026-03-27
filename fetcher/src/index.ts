import { runFetcher } from './core/fetcher';
import { logger } from './core/logger';

async function main() {
  try {
    await runFetcher();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Fetcher failed');
    process.exit(1);
  }
}

main();

import app from './app';
import { env } from './config/env';
import { pool } from './db/pool';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(env.port, () => {
      logger.info('api_started', { port: env.port, env: env.nodeEnv });
    });
  } catch (error) {
    logger.error('failed_to_start_server', { error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error });
    process.exit(1);
  }
};

void startServer();

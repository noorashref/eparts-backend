import app from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(env.port, () => {
      console.log(`API running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();

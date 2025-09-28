import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db/pool';

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

const ensureHistoryTable = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const runMigrations = async () => {
  await ensureHistoryTable();

  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const { rows } = await pool.query('SELECT 1 FROM migration_history WHERE filename = $1', [file]);

    if (rows.length > 0) {
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, 'utf8');

    console.log(`Applying migration: ${file}`);

    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO migration_history (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
};

const run = async () => {
  try {
    await runMigrations();
    console.log('Migrations complete');
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});

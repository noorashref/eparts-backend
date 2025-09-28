import { pool } from '../db/pool';
import { hashPassword } from '../utils/password';

type UserRole = 'user' | 'admin';

export type UserRecord = {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
};

export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const result = await pool.query<UserRecord>(
    'SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  return result.rows[0] ?? null;
};

export const createUser = async (email: string, password: string, role: UserRole = 'user'): Promise<UserRecord> => {
  const passwordHash = await hashPassword(password);
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, role, created_at`,
    [email.toLowerCase(), passwordHash, role]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to create user');
  }

  return row;
};

export const ensureUserRole = async (userId: number, role: UserRole): Promise<void> => {
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
};

import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../config/env';
import { comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { createUser, ensureUserRole, findUserByEmail } from '../services/userService';
import { logger } from '../utils/logger';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});

const googleClient = new OAuth2Client(env.googleClientId);

export const register = async (req: Request, res: Response) => {
  const parseResult = credentialsSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid credentials payload', errors: parseResult.error.flatten() });
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const role = env.adminEmails.includes(normalizedEmail) ? 'admin' : 'user';
  const user = await createUser(normalizedEmail, password, role);

  const token = signToken({ userId: user.id, email: user.email, role });

  logger.info('user_registered', { userId: user.id, email: user.email, role });

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role },
  });
};

export const login = async (req: Request, res: Response) => {
  const parseResult = credentialsSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid credentials payload', errors: parseResult.error.flatten() });
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.toLowerCase();

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    logger.warn('login_failed', { email: normalizedEmail, reason: 'not_found' });
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    logger.warn('login_failed', { email: normalizedEmail, reason: 'bad_password' });
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const expectedAdmin = env.adminEmails.includes(normalizedEmail);
  if (expectedAdmin && user.role !== 'admin') {
    await ensureUserRole(user.id, 'admin');
    user.role = 'admin';
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  logger.info('login_success', { userId: user.id, email: user.email, role: user.role });

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
};

export const googleSignIn = async (req: Request, res: Response) => {
  const parse = googleAuthSchema.safeParse(req.body);

  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid Google auth payload', errors: parse.error.flatten() });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parse.data.idToken,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Unable to validate Google account email' });
    }

    const normalizedEmail = payload.email.toLowerCase();

    let user = await findUserByEmail(normalizedEmail);
    const desiredRole = env.adminEmails.includes(normalizedEmail) ? 'admin' : 'user';

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await createUser(normalizedEmail, randomPassword, desiredRole);
    } else if (user.role !== desiredRole) {
      await ensureUserRole(user.id, desiredRole);
      user.role = desiredRole;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    logger.info('google_login_success', { userId: user.id, email: user.email, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      },
    });
  } catch (error) {
    logger.error('google_login_failed', { error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error });
    return res.status(401).json({ message: 'Unable to authenticate with Google' });
  }
};

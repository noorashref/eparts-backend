import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: number;
  email: string;
  role: 'user' | 'admin';
};

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};

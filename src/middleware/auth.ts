import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const isAdmin =
    req.user.role === 'admin' && env.adminEmails.includes(req.user.email.toLowerCase());

  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

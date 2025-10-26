import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;
  const child = logger.with({ method, path: originalUrl, userId: req.user?.userId, userEmail: req.user?.email });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const status = res.statusCode;
    const length = res.getHeader('content-length');
    child.info('request', { status, duration_ms: Math.round(durationMs), content_length: length ?? null });
  });

  next();
};

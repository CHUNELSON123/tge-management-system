import { rateLimit } from 'express-rate-limit';

export const API_REQUEST_LIMIT = 300;
export const API_RATE_LIMIT_WINDOW_MS = 60_000;

export function createApiRateLimiter({
  limit = API_REQUEST_LIMIT,
  windowMs = API_RATE_LIMIT_WINDOW_MS,
}: { limit?: number; windowMs?: number } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  });
}

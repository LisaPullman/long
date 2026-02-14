import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = {
  id: string;
};

type JwtClaims = {
  sub: string;
  iat?: number;
  exp?: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Misconfiguration: surface a clear error in logs, but keep response generic.
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function signAccessToken(userId: string) {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({}, secret, { subject: userId, expiresIn } as jwt.SignOptions);
}

function extractBearerToken(req: Request): string | null {
  const h = req.header('authorization') || req.header('Authorization');
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/.exec(h.trim());
  return m ? m[1] : null;
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtClaims | string;
    const sub = typeof decoded === 'string' ? undefined : decoded.sub;
    if (sub) req.user = { id: sub };
    return next();
  } catch {
    // Optional auth: ignore invalid tokens.
    return next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtClaims | string;
    const sub = typeof decoded === 'string' ? undefined : decoded.sub;
    if (!sub) return res.status(401).json({ error: '无效的登录状态' });
    req.user = { id: sub };
    return next();
  } catch {
    return res.status(401).json({ error: '无效的登录状态' });
  }
}

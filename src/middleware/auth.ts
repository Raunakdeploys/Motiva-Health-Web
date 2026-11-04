import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid) {
      return res.status(401).json({ error: 'Unauthorized: Session has no user identifier' });
    }

    decodedToken.userKey = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Auth middleware unexpected error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token session. Please sign in again.' });
  }
};

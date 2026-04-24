import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';
import User from '../models/User';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'simba_default_secret';

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: UserRole;
      branchId?: string;
    };

    // Check user still exists and is active (only if DB connected)
    try {
      const user = await User.findById(decoded.id);
      if (user && !user.isActive) {
        res.status(403).json({ success: false, message: 'Account deactivated' });
        return;
      }
    } catch (_) {
      // DB not available, proceed with token data
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'simba_default_secret';
      const decoded = jwt.verify(token, secret) as any;
      req.user = decoded;
    }
  } catch (_) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

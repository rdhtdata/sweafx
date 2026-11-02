import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please sign in.' });
      return;
    }

    // ADMIN always has universal superuser access
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`
    });
  };
};

export const requireAnyRole = (...roles: UserRole[]) => requireRole(...roles);

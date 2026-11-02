import { Request } from 'express';
import { prisma } from '../db/prisma';

export const logAuditEvent = async (
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any> | string
) => {
  try {
    if (!req.user) return;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const detailString = typeof details === 'object' ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action,
        entityType,
        entityId,
        details: detailString,
        ipAddress
      }
    });
  } catch (err) {
    console.error('Audit logging error:', err);
    // Non-blocking: audit failure should not crash main request
  }
};

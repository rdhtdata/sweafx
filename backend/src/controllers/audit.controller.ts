import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export class AuditController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch audit trail' });
    }
  }
}

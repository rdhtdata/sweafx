import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// Only ADMIN and MANAGEMENT can view full audit trail
router.get('/', authenticateJwt, requireRole(UserRole.MANAGEMENT), AuditController.list);

export default router;

import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// All internal roles can view customers
router.get('/', authenticateJwt, CustomerController.list);
router.get('/export/csv', authenticateJwt, CustomerController.exportCsv);
router.get('/:id', authenticateJwt, CustomerController.getById);

// Creation and modification restricted to SALES, MANAGEMENT, and ADMIN
router.post(
  '/',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.MANAGEMENT),
  CustomerController.create
);

router.put(
  '/:id',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.MANAGEMENT),
  CustomerController.update
);

router.post(
  '/:id/corridors',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.MANAGEMENT),
  CustomerController.addCorridor
);

export default router;

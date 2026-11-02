import { Router } from 'express';
import { RequirementController } from '../controllers/requirement.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', authenticateJwt, RequirementController.list);
router.get('/:id', authenticateJwt, RequirementController.getById);

// Assign placement vehicle and driver for handoff
router.patch(
  '/:id/assign-placement',
  authenticateJwt,
  requireRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  RequirementController.assignVehicleAndDriver
);

// Generate WhatsApp trip confirmation message preview
router.get(
  '/:id/whatsapp-preview',
  authenticateJwt,
  RequirementController.generateTripConfirmationPreview
);

export default router;

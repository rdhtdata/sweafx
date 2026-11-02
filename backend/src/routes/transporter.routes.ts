import { Router } from 'express';
import { TransporterController } from '../controllers/transporter.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// Transporters
router.get('/', authenticateJwt, TransporterController.listTransporters);
router.get('/:id', authenticateJwt, TransporterController.getTransporterById);
router.post(
  '/',
  authenticateJwt,
  requireRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  TransporterController.createTransporter
);

// Fleet Vehicles
router.get('/fleet/vehicles', authenticateJwt, TransporterController.listVehicles);
router.post(
  '/fleet/vehicles',
  authenticateJwt,
  requireRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  TransporterController.createVehicle
);

// Drivers
router.get('/fleet/drivers', authenticateJwt, TransporterController.listDrivers);
router.post(
  '/fleet/drivers',
  authenticateJwt,
  requireRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  TransporterController.createDriver
);

export default router;

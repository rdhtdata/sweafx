import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// Only ADMIN and MANAGEMENT can view internal user directory
router.get('/', authenticateJwt, requireRole(UserRole.MANAGEMENT), UserController.listUsers);

// Only ADMIN can create users, change roles, or suspend accounts
router.post('/', authenticateJwt, requireRole(UserRole.ADMIN), UserController.createUser);
router.patch('/:id/status', authenticateJwt, requireRole(UserRole.ADMIN), UserController.updateUserStatus);
router.patch('/:id/role', authenticateJwt, requireRole(UserRole.ADMIN), UserController.updateUserRole);

export default router;

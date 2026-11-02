import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticateJwt, ComplianceController.getSummary);

export default router;

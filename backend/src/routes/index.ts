import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import transporterRoutes from './transporter.routes';
import complianceRoutes from './compliance.routes';
import documentRoutes from './document.routes';
import auditRoutes from './audit.routes';
import enquiryRoutes from './enquiry.routes';
import requirementRoutes from './requirement.routes';
import searchRoutes from './search.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/transporters', transporterRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/requirements', requirementRoutes);
router.use('/search', searchRoutes);
router.use('/compliance', complianceRoutes);
router.use('/documents', documentRoutes);
router.use('/audit', auditRoutes);

export default router;

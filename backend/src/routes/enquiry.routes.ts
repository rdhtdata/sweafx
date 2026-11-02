import { Router } from 'express';
import { EnquiryController } from '../controllers/enquiry.controller';
import { QuoteController } from '../controllers/quote.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// List and view enquiries
router.get('/', authenticateJwt, EnquiryController.list);
router.get('/:id', authenticateJwt, EnquiryController.getById);

// Create enquiry: SALES, MANAGEMENT, ADMIN
router.post(
  '/',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.MANAGEMENT),
  EnquiryController.create
);

// Update enquiry status / closure reason
router.patch(
  '/:id/status',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  EnquiryController.updateStatus
);

// Convert enquiry into an active operational Requirement
router.post(
  '/:id/convert-to-requirement',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT),
  EnquiryController.convertToRequirement
);

// Vendor Quotes against this enquiry (Up to 4 quotes)
router.post(
  '/:enquiryId/quotes',
  authenticateJwt,
  requireRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT, UserRole.SALES),
  QuoteController.addOrUpdateQuote
);

// Manually select winning quote
router.post(
  '/:enquiryId/quotes/:quoteId/select',
  authenticateJwt,
  requireRole(UserRole.SALES, UserRole.MANAGEMENT, UserRole.TRAFFIC_OPS),
  QuoteController.selectWinningQuote
);

export default router;

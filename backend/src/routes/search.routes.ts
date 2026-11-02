import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.get('/crm', authenticateJwt, SearchController.crmSearch);

export default router;

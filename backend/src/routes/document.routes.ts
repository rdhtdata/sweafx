import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/document.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit per specification
});

router.post('/upload', authenticateJwt, upload.single('file'), DocumentController.upload);
router.get('/entity/:entityType/:entityId', authenticateJwt, DocumentController.listByEntity);
router.get('/stream/:folder/:filename', DocumentController.streamFile);
router.post('/verify/:id', authenticateJwt, DocumentController.verify);

export default router;

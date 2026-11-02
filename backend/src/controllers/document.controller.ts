import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { storageService } from '../services/storage.service';
import { logAuditEvent } from '../middleware/audit';
import fs from 'fs';
import { DocumentType } from '@prisma/client';

export class DocumentController {
  public static async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const { entityType, entityId, documentType } = req.body;
      if (!entityType || !entityId) {
        res.status(400).json({ success: false, message: 'entityType and entityId are required' });
        return;
      }

      const saved = await storageService.saveLocalFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        entityType.toLowerCase()
      );

      const doc = await prisma.documentAttachment.create({
        data: {
          entityType: entityType.toUpperCase(),
          entityId,
          documentType: (documentType as DocumentType) || DocumentType.OTHER,
          fileName: saved.fileName,
          fileKey: saved.fileKey,
          fileUrl: saved.fileUrl,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
          checksum: saved.checksum
        }
      });

      await logAuditEvent(req, 'UPLOAD_DOCUMENT', entityType, entityId, {
        docId: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType
      });

      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      console.error('Upload document error:', err);
      res.status(500).json({ success: false, message: 'Failed to upload document' });
    }
  }

  public static async listByEntity(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const docs = await prisma.documentAttachment.findMany({
        where: {
          entityType: entityType.toUpperCase(),
          entityId
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: docs });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to list documents' });
    }
  }

  public static async streamFile(req: Request, res: Response): Promise<void> {
    try {
      const { folder, filename } = req.params;
      const fileKey = `${folder}/${filename}`;
      const filePath = storageService.getFilePath(fileKey);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found on storage' });
        return;
      }

      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to stream document' });
    }
  }

  public static async verify(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await prisma.documentAttachment.update({
        where: { id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user?.name || 'Authorized Staff'
        }
      });

      await logAuditEvent(req, 'VERIFY_DOCUMENT', updated.entityType, updated.entityId, { docId: updated.id });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to verify document' });
    }
  }
}

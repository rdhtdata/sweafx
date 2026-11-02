import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

export interface SavedFileResult {
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.storage.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async saveLocalFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subFolder = 'documents'
  ): Promise<SavedFileResult> {
    const targetDir = path.join(this.uploadDir, subFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(originalName) || '';
    const uniqueKey = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(targetDir, uniqueKey);

    await fs.promises.writeFile(filePath, fileBuffer);

    const relativeUrl = `/api/documents/stream/${subFolder}/${uniqueKey}`;

    return {
      fileName: originalName,
      fileKey: path.join(subFolder, uniqueKey),
      fileUrl: relativeUrl,
      fileSize: fileBuffer.length,
      mimeType,
      checksum: hash
    };
  }

  public getFilePath(fileKey: string): string {
    return path.join(this.uploadDir, fileKey);
  }

  public async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const fullPath = this.getFilePath(fileKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();

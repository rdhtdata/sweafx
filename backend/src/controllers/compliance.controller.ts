import { Request, Response } from 'express';
import { complianceService } from '../services/compliance.service';

export class ComplianceController {
  public static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await complianceService.getComplianceSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (err: any) {
      console.error('Compliance summary error:', err);
      res.status(500).json({ success: false, message: 'Failed to compute compliance metrics' });
    }
  }
}

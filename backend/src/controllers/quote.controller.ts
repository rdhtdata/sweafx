import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { QuoteAvailability, EnquiryStatus } from '@prisma/client';

export class QuoteController {
  public static async addOrUpdateQuote(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId } = req.params;
      const { quoteNumber, transporterId, quotedRate, availability, vehicleNumber, quoteExpiry, notes } = req.body;

      if (!quoteNumber || !transporterId || quotedRate === undefined) {
        res.status(400).json({ success: false, message: 'quoteNumber, transporterId, and quotedRate are required' });
        return;
      }

      const enquiry = await prisma.enquiry.findUnique({
        where: { id: enquiryId },
        include: { quotes: true, requirement: true }
      });

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      const transporter = await prisma.transporter.findUnique({ where: { id: transporterId } });
      if (!transporter) {
        res.status(404).json({ success: false, message: 'Transporter not found' });
        return;
      }

      // Check if this quote slot (e.g. Quote 1, 2, 3, 4) already exists
      const existingQuote = enquiry.quotes.find((q) => q.quoteNumber === Number(quoteNumber));

      let savedQuote;
      if (existingQuote) {
        savedQuote = await prisma.vendorQuote.update({
          where: { id: existingQuote.id },
          data: {
            transporterId: transporter.id,
            transporterName: transporter.companyName,
            quotedRate: Number(quotedRate),
            availability: (availability as QuoteAvailability) || QuoteAvailability.AVAILABLE,
            vehicleNumber: vehicleNumber || null,
            quoteExpiry: quoteExpiry ? new Date(quoteExpiry) : null,
            notes: notes || null,
            createdById: req.user?.id || existingQuote.createdById,
            createdByName: req.user?.name || existingQuote.createdByName
          }
        });
      } else {
        savedQuote = await prisma.vendorQuote.create({
          data: {
            enquiryId: enquiry.id,
            requirementId: enquiry.requirement?.id || null,
            quoteNumber: Number(quoteNumber),
            transporterId: transporter.id,
            transporterName: transporter.companyName,
            quotedRate: Number(quotedRate),
            availability: (availability as QuoteAvailability) || QuoteAvailability.AVAILABLE,
            vehicleNumber: vehicleNumber || null,
            quoteExpiry: quoteExpiry ? new Date(quoteExpiry) : null,
            notes: notes || null,
            createdById: req.user?.id,
            createdByName: req.user?.name
          }
        });
      }

      // Re-evaluate "Best Rate" across all quotes for this enquiry
      const allQuotes = await prisma.vendorQuote.findMany({
        where: { enquiryId: enquiry.id }
      });

      // Find minimum quoted rate
      const minRate = Math.min(...allQuotes.map((q) => Number(q.quotedRate)));

      for (const q of allQuotes) {
        const isBest = Number(q.quotedRate) === minRate;
        if (q.isBestRate !== isBest) {
          await prisma.vendorQuote.update({
            where: { id: q.id },
            data: { isBestRate: isBest }
          });
        }
      }

      // Update Enquiry status to QUOTES_RECEIVED
      if (enquiry.status === EnquiryStatus.NEW || enquiry.status === EnquiryStatus.SENT_TO_PURCHASE) {
        await prisma.enquiry.update({
          where: { id: enquiry.id },
          data: { status: EnquiryStatus.QUOTES_RECEIVED }
        });
      }

      await logAuditEvent(req, 'SAVE_VENDOR_QUOTE', 'VENDOR_QUOTE', savedQuote.id, {
        enquiryNumber: enquiry.enquiryNumber,
        quoteNumber,
        transporter: transporter.companyName,
        quotedRate: savedQuote.quotedRate
      });

      const updatedQuotes = await prisma.vendorQuote.findMany({
        where: { enquiryId: enquiry.id },
        orderBy: { quoteNumber: 'asc' }
      });

      res.status(200).json({ success: true, data: updatedQuotes });
    } catch (err: any) {
      console.error('Save quote error:', err);
      res.status(500).json({ success: false, message: 'Failed to record vendor quote' });
    }
  }

  public static async selectWinningQuote(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId, quoteId } = req.params;

      const enquiry = await prisma.enquiry.findUnique({
        where: { id: enquiryId },
        include: { quotes: true, requirement: true }
      });

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      const targetQuote = enquiry.quotes.find((q) => q.id === quoteId);
      if (!targetQuote) {
        res.status(404).json({ success: false, message: 'Quote not found for this enquiry' });
        return;
      }

      // Mark this quote as selected and unselect others
      for (const q of enquiry.quotes) {
        await prisma.vendorQuote.update({
          where: { id: q.id },
          data: { isSelected: q.id === quoteId }
        });
      }

      // If requirement exists, update its selected vendor details and status
      if (enquiry.requirement) {
        await prisma.requirement.update({
          where: { id: enquiry.requirement.id },
          data: {
            selectedQuoteId: targetQuote.id,
            selectedTransporterId: targetQuote.transporterId,
            selectedTransporterName: targetQuote.transporterName,
            selectedVehicleNumber: targetQuote.vehicleNumber,
            selectedBy: req.user?.name || 'Authorized Staff',
            selectedAt: new Date(),
            finalStatus: 'VENDOR_SHORTLISTED'
          }
        });
      }

      // Update Enquiry status to RATE_SET
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { status: EnquiryStatus.RATE_SET }
      });

      await logAuditEvent(req, 'SELECT_WINNING_QUOTE', 'ENQUIRY', enquiry.id, {
        selectedQuoteId: targetQuote.id,
        transporterName: targetQuote.transporterName,
        agreedRate: targetQuote.quotedRate
      });

      res.status(200).json({
        success: true,
        message: `Quote by ${targetQuote.transporterName} selected as winning rate`,
        data: targetQuote
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to select winning quote' });
    }
  }
}

import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { EnquiryStatus, EnquirySourceChannel } from '@prisma/client';

export class EnquiryController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, customerId } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as EnquiryStatus;
      }
      if (customerId && typeof customerId === 'string') {
        where.customerId = customerId;
      }

      if (search && typeof search === 'string') {
        const q = search.trim();
        where.OR = [
          { enquiryNumber: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { loadingCity: { contains: q, mode: 'insensitive' } },
          { unloadingCity: { contains: q, mode: 'insensitive' } },
          { materialType: { contains: q, mode: 'insensitive' } },
          { vehicleType: { contains: q, mode: 'insensitive' } }
        ];
      }

      const enquiries = await prisma.enquiry.findMany({
        where,
        include: {
          customer: { select: { customerCode: true, companyName: true, gstin: true, city: true } },
          quotes: {
            orderBy: { quoteNumber: 'asc' },
            include: { transporter: { select: { companyName: true, phone: true, partyType: true } } }
          },
          requirement: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: enquiries });
    } catch (err: any) {
      console.error('List enquiries error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiry = await prisma.enquiry.findUnique({
        where: { id },
        include: {
          customer: true,
          quotes: {
            orderBy: { quoteNumber: 'asc' },
            include: { transporter: true }
          },
          requirement: true
        }
      });

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      res.status(200).json({ success: true, data: enquiry });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch enquiry details' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        sourceChannel,
        loadingAreaPin,
        loadingCity,
        unloadingAreaPin,
        unloadingCity,
        vehicleLength,
        vehicleType,
        materialType,
        materialWeight,
        loadingDate,
        loadingRequirement,
        targetPrice,
        notes
      } = req.body;

      if (!customerId || !loadingCity || !unloadingCity || !vehicleLength || !vehicleType || !materialType || !materialWeight) {
        res.status(400).json({ success: false, message: 'Missing required enquiry fields' });
        return;
      }

      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        res.status(404).json({ success: false, message: 'Referenced Customer does not exist' });
        return;
      }

      // Generate sequential immutable ENQ number: ENQ1001 onwards
      const count = await prisma.enquiry.count();
      const enquiryNumber = `ENQ${1001 + count}`;

      const newEnquiry = await prisma.enquiry.create({
        data: {
          enquiryNumber,
          customerId,
          customerName: customer.companyName,
          sourceChannel: (sourceChannel as EnquirySourceChannel) || EnquirySourceChannel.WHATSAPP,
          loadingAreaPin: loadingAreaPin || loadingCity,
          loadingCity: loadingCity.trim(),
          unloadingAreaPin: unloadingAreaPin || unloadingCity,
          unloadingCity: unloadingCity.trim(),
          vehicleLength: vehicleLength.trim(),
          vehicleType: vehicleType.trim(),
          materialType: materialType.trim(),
          materialWeight: materialWeight.trim(),
          loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
          loadingRequirement: loadingRequirement || 'Scheduled',
          targetPrice: targetPrice ? Number(targetPrice) : null,
          status: EnquiryStatus.NEW,
          notes: notes?.trim(),
          createdById: req.user?.id,
          createdByName: req.user?.name
        },
        include: { customer: true }
      });

      await logAuditEvent(req, 'CREATE_ENQUIRY', 'ENQUIRY', newEnquiry.id, {
        enquiryNumber,
        customerName: customer.companyName,
        route: `${newEnquiry.loadingCity} -> ${newEnquiry.unloadingCity}`,
        targetPrice: newEnquiry.targetPrice
      });

      res.status(201).json({ success: true, data: newEnquiry });
    } catch (err: any) {
      console.error('Create enquiry error:', err);
      res.status(500).json({ success: false, message: 'Failed to create enquiry' });
    }
  }

  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, closureReason, notes } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'Status is required' });
        return;
      }

      if (status === EnquiryStatus.CANCELLED_CLOSED && !closureReason) {
        res.status(400).json({ success: false, message: 'Closure reason is mandatory when closing/cancelling an enquiry' });
        return;
      }

      const updated = await prisma.enquiry.update({
        where: { id },
        data: {
          status: status as EnquiryStatus,
          closureReason: closureReason || null,
          notes: notes !== undefined ? notes : undefined
        }
      });

      await logAuditEvent(req, 'UPDATE_ENQUIRY_STATUS', 'ENQUIRY', id, { status, closureReason });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update enquiry status' });
    }
  }

  public static async convertToRequirement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tripRate, notes } = req.body;

      const enquiry = await prisma.enquiry.findUnique({
        where: { id },
        include: { quotes: true, requirement: true }
      });

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      if (enquiry.requirement) {
        res.status(409).json({ success: false, message: 'Requirement already exists for this enquiry', data: enquiry.requirement });
        return;
      }

      const reqCount = await prisma.requirement.count();
      const requirementNumber = `REQ${String(reqCount + 1).padStart(4, '0')}`;

      // Find any already selected quote
      const selectedQuote = enquiry.quotes.find((q) => q.isSelected);

      const requirement = await prisma.requirement.create({
        data: {
          requirementNumber,
          enquiryId: enquiry.id,
          enquiryNumber: enquiry.enquiryNumber,
          customerId: enquiry.customerId,
          customerName: enquiry.customerName,
          loadingAreaPin: enquiry.loadingAreaPin,
          loadingCity: enquiry.loadingCity,
          unloadingAreaPin: enquiry.unloadingAreaPin,
          unloadingCity: enquiry.unloadingCity,
          vehicleLength: enquiry.vehicleLength,
          vehicleType: enquiry.vehicleType,
          materialType: enquiry.materialType,
          materialWeight: enquiry.materialWeight,
          loadingDate: enquiry.loadingDate,
          tripRate: tripRate ? Number(tripRate) : enquiry.targetPrice,
          finalStatus: selectedQuote ? 'VENDOR_SHORTLISTED' : 'OPEN',
          selectedQuoteId: selectedQuote?.id,
          selectedTransporterId: selectedQuote?.transporterId,
          selectedTransporterName: selectedQuote?.transporterName,
          selectedVehicleNumber: selectedQuote?.vehicleNumber,
          notes: notes || enquiry.notes
        }
      });

      // Update Enquiry status to SENT_TO_PURCHASE or RATE_SET
      await prisma.enquiry.update({
        where: { id },
        data: {
          status: EnquiryStatus.SENT_TO_PURCHASE
        }
      });

      await logAuditEvent(req, 'CONVERT_ENQUIRY_TO_REQUIREMENT', 'REQUIREMENT', requirement.id, {
        enquiryNumber: enquiry.enquiryNumber,
        requirementNumber: requirement.requirementNumber
      });

      res.status(201).json({ success: true, data: requirement });
    } catch (err: any) {
      console.error('Convert to requirement error:', err);
      res.status(500).json({ success: false, message: 'Failed to convert enquiry to requirement' });
    }
  }
}

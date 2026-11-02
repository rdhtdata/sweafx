import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { RequirementFinalStatus, VerificationStatus } from '@prisma/client';

export class RequirementController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const { finalStatus, search } = req.query;

      const where: any = {};
      if (finalStatus && finalStatus !== 'ALL') {
        where.finalStatus = finalStatus as RequirementFinalStatus;
      }

      if (search && typeof search === 'string') {
        const q = search.trim();
        where.OR = [
          { requirementNumber: { contains: q, mode: 'insensitive' } },
          { enquiryNumber: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { loadingCity: { contains: q, mode: 'insensitive' } },
          { unloadingCity: { contains: q, mode: 'insensitive' } },
          { selectedTransporterName: { contains: q, mode: 'insensitive' } },
          { selectedVehicleNumber: { contains: q, mode: 'insensitive' } }
        ];
      }

      const requirements = await prisma.requirement.findMany({
        where,
        include: {
          enquiry: true,
          quotes: { orderBy: { quoteNumber: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: requirements });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch requirements' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const requirement = await prisma.requirement.findUnique({
        where: { id },
        include: {
          enquiry: {
            include: { customer: true, quotes: true }
          },
          quotes: true
        }
      });

      if (!requirement) {
        res.status(404).json({ success: false, message: 'Requirement not found' });
        return;
      }

      res.status(200).json({ success: true, data: requirement });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch requirement' });
    }
  }

  public static async assignVehicleAndDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { vehicleId, driverId, tripRate, notes } = req.body;

      const requirement = await prisma.requirement.findUnique({ where: { id } });
      if (!requirement) {
        res.status(404).json({ success: false, message: 'Requirement not found' });
        return;
      }

      let vehicle = null;
      if (vehicleId) {
        vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      }

      let driver = null;
      if (driverId) {
        driver = await prisma.driver.findUnique({ where: { id: driverId } });
      }

      const updated = await prisma.requirement.update({
        where: { id },
        data: {
          selectedVehicleId: vehicle?.id || requirement.selectedVehicleId,
          selectedVehicleNumber: vehicle?.vehicleNumber || requirement.selectedVehicleNumber,
          selectedDriverId: driver?.id || requirement.selectedDriverId,
          selectedDriverName: driver?.fullName || requirement.selectedDriverName,
          selectedDriverPhone: driver?.phone || requirement.selectedDriverPhone,
          selectedDriverDl: driver?.licenseNumber || requirement.selectedDriverDl,
          tripRate: tripRate !== undefined ? Number(tripRate) : requirement.tripRate,
          finalStatus: RequirementFinalStatus.READY_FOR_PLACEMENT,
          notes: notes !== undefined ? notes : requirement.notes
        }
      });

      await logAuditEvent(req, 'ASSIGN_PLACEMENT_DETAILS', 'REQUIREMENT', id, {
        requirementNumber: updated.requirementNumber,
        vehicleNumber: updated.selectedVehicleNumber,
        driverName: updated.selectedDriverName,
        status: updated.finalStatus
      });

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Assign placement error:', err);
      res.status(500).json({ success: false, message: 'Failed to assign placement details' });
    }
  }

  public static async generateTripConfirmationPreview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reqRecord = await prisma.requirement.findUnique({
        where: { id },
        include: { enquiry: { include: { customer: true } } }
      });

      if (!reqRecord) {
        res.status(404).json({ success: false, message: 'Requirement not found' });
        return;
      }

      // Check verification statuses of vehicle and driver
      let vehicleVerified = false;
      let driverVerified = false;
      let loadCapacity = reqRecord.materialWeight || '7 Tonnes';

      if (reqRecord.selectedVehicleId) {
        const v = await prisma.vehicle.findUnique({ where: { id: reqRecord.selectedVehicleId } });
        if (v) {
          vehicleVerified = v.verificationStatus === VerificationStatus.VERIFIED;
          if (v.passingCapacityTons) loadCapacity = `${v.passingCapacityTons} Tonnes`;
        }
      }

      if (reqRecord.selectedDriverId) {
        const d = await prisma.driver.findUnique({ where: { id: reqRecord.selectedDriverId } });
        if (d) {
          driverVerified = d.verificationStatus === VerificationStatus.VERIFIED;
        }
      }

      const vehicleBadge = vehicleVerified ? '✅' : '❌';
      const driverBadge = driverVerified ? '✅' : '❌';

      // Look up transporter GSTIN for Trans ID
      let transId = '29AAECW3533B1ZI'; // Fallback sample if not yet linked
      if (reqRecord.selectedTransporterId) {
        const t = await prisma.transporter.findUnique({ where: { id: reqRecord.selectedTransporterId } });
        if (t?.gstin) transId = t.gstin;
      }

      const tripId = reqRecord.finalTripId || `EXP${String(reqRecord.requirementNumber.replace(/\D/g, '')).padStart(4, '0')}`;

      const messageText = `SweafEx
Trip ID : ${tripId}
Party : ${reqRecord.customerName}
Driver ${reqRecord.selectedDriverName || 'Driver'} will be attending your trip
Loading : ${reqRecord.loadingCity}
Unloading : ${reqRecord.unloadingCity}
Vehicle No : ${reqRecord.selectedVehicleNumber || 'Pending'}${vehicleBadge}
Vehicle Type : ${reqRecord.vehicleLength} ${reqRecord.vehicleType}
Load Capacity : ${loadCapacity}
Driver : ${reqRecord.selectedDriverName || 'Pending'}
Number : ${reqRecord.selectedDriverPhone || '+91 9504884888'}
Driver DL : ${reqRecord.selectedDriverDl || 'Pending'}${driverBadge}
Trans ID : ${transId}
Note : Kindly Make Transit Insurance For Complete Safety of your Goods`;

      res.status(200).json({
        success: true,
        data: {
          tripId,
          party: reqRecord.customerName,
          vehicleNumber: reqRecord.selectedVehicleNumber,
          vehicleVerified,
          driverName: reqRecord.selectedDriverName,
          driverVerified,
          transId,
          formattedMessage: messageText
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to generate confirmation preview' });
    }
  }
}

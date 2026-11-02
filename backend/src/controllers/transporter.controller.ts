import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { EntityStatus, VendorPartyType, VerificationStatus } from '@prisma/client';
import { computeExpiryStatus } from '../services/compliance.service';

export class TransporterController {
  // Transporters
  public static async listTransporters(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, partyType } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as EntityStatus;
      }
      if (partyType && partyType !== 'ALL') {
        where.partyType = partyType as VendorPartyType;
      }

      if (search && typeof search === 'string') {
        const query = search.trim();
        where.OR = [
          { companyName: { contains: query, mode: 'insensitive' } },
          { transporterCode: { contains: query, mode: 'insensitive' } },
          { contactPerson: { contains: query, mode: 'insensitive' } },
          { brokerName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } }
        ];
      }

      const transporters = await prisma.transporter.findMany({
        where,
        include: {
          bankDetails: true,
          _count: {
            select: { vehicles: true, drivers: true, quotes: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = transporters.map((t) => ({
        ...t,
        vehiclesCount: t._count.vehicles,
        driversCount: t._count.drivers,
        quotesCount: t._count.quotes
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch transporters' });
    }
  }

  public static async getTransporterById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transporter = await prisma.transporter.findUnique({
        where: { id },
        include: {
          bankDetails: true,
          vehicles: true,
          drivers: true,
          quotes: { take: 10, orderBy: { quotedAt: 'desc' } }
        }
      });

      if (!transporter) {
        res.status(404).json({ success: false, message: 'Transporter not found' });
        return;
      }

      res.status(200).json({ success: true, data: transporter });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch transporter details' });
    }
  }

  public static async createTransporter(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyName,
        tradeName,
        partyType,
        gstin,
        pan,
        contactPerson,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        transportName,
        brokerName,
        truckOwnerName,
        brokerOwnerPhone,
        standardPaymentDays,
        rating,
        reliabilityRating,
        notes,
        bankDetails
      } = req.body;

      if (!companyName || !pan || !contactPerson || !phone || !address || !city || !state || !pincode) {
        res.status(400).json({ success: false, message: 'Missing required transporter fields' });
        return;
      }

      const count = await prisma.transporter.count();
      const transporterCode = `TRP-${String(count + 1).padStart(3, '0')}`;

      const transporter = await prisma.transporter.create({
        data: {
          transporterCode,
          companyName: companyName.trim(),
          tradeName: tradeName?.trim(),
          partyType: (partyType as VendorPartyType) || VendorPartyType.TRANSPORTER,
          gstin: gstin ? gstin.toUpperCase().trim() : null,
          pan: pan.toUpperCase().trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email?.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          transportName: transportName?.trim(),
          brokerName: brokerName?.trim(),
          truckOwnerName: truckOwnerName?.trim(),
          brokerOwnerPhone: brokerOwnerPhone?.trim(),
          standardPaymentDays: Number(standardPaymentDays) || 15,
          rating: rating ? Number(rating) : 4.5,
          reliabilityRating: reliabilityRating ? Number(reliabilityRating) : 4.5,
          notes: notes?.trim(),
          bankDetails: bankDetails && Array.isArray(bankDetails) ? {
            create: bankDetails.map((b: any) => ({
              accountHolderName: b.accountHolderName,
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              ifscCode: b.ifscCode.toUpperCase().trim(),
              branchName: b.branchName,
              isPrimary: b.isPrimary !== undefined ? !!b.isPrimary : true
            }))
          } : undefined
        },
        include: { bankDetails: true }
      });

      await logAuditEvent(req, 'CREATE_TRANSPORTER', 'TRANSPORTER', transporter.id, {
        transporterCode,
        companyName: transporter.companyName,
        partyType: transporter.partyType
      });

      res.status(201).json({ success: true, data: transporter });
    } catch (err: any) {
      console.error('Create transporter error:', err);
      res.status(500).json({ success: false, message: 'Failed to create transporter' });
    }
  }

  // Fleet Vehicles
  public static async listVehicles(req: Request, res: Response): Promise<void> {
    try {
      const { transporterId, search } = req.query;
      const where: any = {};

      if (transporterId && typeof transporterId === 'string') {
        where.transporterId = transporterId;
      }

      if (search && typeof search === 'string') {
        where.vehicleNumber = { contains: search.trim().toUpperCase() };
      }

      const vehicles = await prisma.vehicle.findMany({
        where,
        include: {
          transporter: { select: { companyName: true, transporterCode: true } }
        },
        orderBy: { vehicleNumber: 'asc' }
      });

      // Enhance with computed compliance status
      const enriched = vehicles.map((v) => {
        const rcComp = computeExpiryStatus(v.rcExpiryDate);
        const insComp = computeExpiryStatus(v.insuranceExpiryDate);
        const fitComp = computeExpiryStatus(v.fitnessExpiryDate);
        const taxComp = computeExpiryStatus(v.taxExpiryDate);
        const puccComp = computeExpiryStatus(v.puccExpiryDate);
        const permComp = computeExpiryStatus(v.permitExpiryDate);

        return {
          ...v,
          transporterName: v.transporter?.companyName,
          rcComplianceStatus: rcComp.status,
          insuranceComplianceStatus: insComp.status,
          fitnessComplianceStatus: fitComp.status,
          taxComplianceStatus: taxComp.status,
          puccComplianceStatus: puccComp.status,
          permitComplianceStatus: permComp.status
        };
      });

      res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to list vehicles' });
    }
  }

  public static async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const {
        vehicleNumber,
        transporterId,
        vehicleSize,
        vehicleType,
        carryingCapacityTons,
        passingCapacityTons,
        rcNumber,
        rcExpiryDate,
        insuranceNumber,
        insuranceExpiryDate,
        fitnessExpiryDate,
        taxExpiryDate,
        puccExpiryDate,
        permitNumber,
        permitExpiryDate,
        isVerified,
        verificationStatus,
        gpsInstalled,
        gpsDeviceId
      } = req.body;

      if (!vehicleNumber || !rcNumber) {
        res.status(400).json({ success: false, message: 'Vehicle number and RC number are required' });
        return;
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          transporterId: transporterId || null,
          vehicleSize: vehicleSize || '32 Feet',
          vehicleType: vehicleType || '32 FT Multi-Axle (MXL)',
          carryingCapacityTons: carryingCapacityTons ? Number(carryingCapacityTons) : 14.0,
          passingCapacityTons: passingCapacityTons ? Number(passingCapacityTons) : (carryingCapacityTons ? Number(carryingCapacityTons) : 14.0),
          rcNumber: rcNumber.trim(),
          rcExpiryDate: rcExpiryDate ? new Date(rcExpiryDate) : null,
          insuranceNumber: insuranceNumber?.trim(),
          insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
          fitnessExpiryDate: fitnessExpiryDate ? new Date(fitnessExpiryDate) : null,
          taxExpiryDate: taxExpiryDate ? new Date(taxExpiryDate) : null,
          puccExpiryDate: puccExpiryDate ? new Date(puccExpiryDate) : null,
          permitNumber: permitNumber?.trim(),
          permitExpiryDate: permitExpiryDate ? new Date(permitExpiryDate) : null,
          isVerified: !!isVerified,
          verificationStatus: (verificationStatus as VerificationStatus) || (isVerified ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED),
          gpsInstalled: !!gpsInstalled,
          gpsDeviceId: gpsDeviceId?.trim()
        }
      });

      await logAuditEvent(req, 'CREATE_VEHICLE', 'VEHICLE', vehicle.id, {
        vehicleNumber: vehicle.vehicleNumber,
        verificationStatus: vehicle.verificationStatus
      });

      res.status(201).json({ success: true, data: vehicle });
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ success: false, message: 'Vehicle number already exists in fleet' });
        return;
      }
      res.status(500).json({ success: false, message: 'Failed to create vehicle' });
    }
  }

  // Drivers
  public static async listDrivers(req: Request, res: Response): Promise<void> {
    try {
      const { transporterId, search } = req.query;
      const where: any = {};

      if (transporterId && typeof transporterId === 'string') {
        where.transporterId = transporterId;
      }

      if (search && typeof search === 'string') {
        const q = search.trim();
        where.OR = [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { licenseNumber: { contains: q.toUpperCase() } }
        ];
      }

      const drivers = await prisma.driver.findMany({
        where,
        include: {
          transporter: { select: { companyName: true } }
        },
        orderBy: { fullName: 'asc' }
      });

      const enriched = drivers.map((d) => {
        const licComp = computeExpiryStatus(d.licenseExpiryDate);
        return {
          ...d,
          transporterName: d.transporter?.companyName,
          licenseComplianceStatus: licComp.status
        };
      });

      res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to list drivers' });
    }
  }

  public static async createDriver(req: Request, res: Response): Promise<void> {
    try {
      const {
        fullName,
        phone,
        altPhone,
        licenseNumber,
        licenseExpiryDate,
        dlCompatibility,
        transporterId,
        aadhaarNumber,
        city,
        state,
        isVerified,
        verificationStatus
      } = req.body;

      if (!fullName || !phone || !licenseNumber || !licenseExpiryDate) {
        res.status(400).json({ success: false, message: 'Full name, phone, license number, and expiry date are required' });
        return;
      }

      const driver = await prisma.driver.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          altPhone: altPhone?.trim(),
          licenseNumber: licenseNumber.toUpperCase().trim(),
          licenseExpiryDate: new Date(licenseExpiryDate),
          dlCompatibility: dlCompatibility || 'HTV - Heavy Transport Vehicle',
          transporterId: transporterId || null,
          aadhaarNumber: aadhaarNumber?.trim(),
          city: city?.trim(),
          state: state?.trim(),
          isVerified: !!isVerified,
          verificationStatus: (verificationStatus as VerificationStatus) || (isVerified ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED)
        }
      });

      await logAuditEvent(req, 'CREATE_DRIVER', 'DRIVER', driver.id, {
        driverName: driver.fullName,
        phone: driver.phone,
        verificationStatus: driver.verificationStatus
      });

      res.status(201).json({ success: true, data: driver });
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ success: false, message: 'Driver with this phone or license number already exists' });
        return;
      }
      res.status(500).json({ success: false, message: 'Failed to create driver' });
    }
  }
}

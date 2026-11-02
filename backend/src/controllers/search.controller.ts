import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export class SearchController {
  public static async crmSearch(req: Request, res: Response): Promise<void> {
    try {
      const {
        vehicleNumber,
        vehicleSize,
        unloadingArea,
        vendorParty,
        vehicleType,
        tripId,
        loadingCity,
        weightPassing,
        driverName,
        unloadingCity,
        loadingArea,
        tripStatus
      } = req.query;

      // 1. Search Vehicles matching vehicle criteria
      const vehicleWhere: any = {};
      if (vehicleNumber && typeof vehicleNumber === 'string') {
        vehicleWhere.vehicleNumber = { contains: vehicleNumber.trim().toUpperCase() };
      }
      if (vehicleSize && typeof vehicleSize === 'string') {
        vehicleWhere.vehicleSize = { contains: vehicleSize.trim(), mode: 'insensitive' };
      }
      if (vehicleType && typeof vehicleType === 'string') {
        vehicleWhere.vehicleType = { contains: vehicleType.trim(), mode: 'insensitive' };
      }
      if (weightPassing && typeof weightPassing === 'string') {
        const num = parseFloat(weightPassing);
        if (!isNaN(num)) {
          vehicleWhere.OR = [
            { carryingCapacityTons: { gte: num } },
            { passingCapacityTons: { gte: num } }
          ];
        }
      }

      // 2. Search Requirements & Enquiries matching route/trip criteria
      const reqWhere: any = {};
      if (tripId && typeof tripId === 'string') {
        reqWhere.OR = [
          { finalTripId: { contains: tripId.trim(), mode: 'insensitive' } },
          { requirementNumber: { contains: tripId.trim(), mode: 'insensitive' } },
          { enquiryNumber: { contains: tripId.trim(), mode: 'insensitive' } }
        ];
      }
      if (loadingCity && typeof loadingCity === 'string') {
        reqWhere.loadingCity = { contains: loadingCity.trim(), mode: 'insensitive' };
      }
      if (loadingArea && typeof loadingArea === 'string') {
        reqWhere.loadingAreaPin = { contains: loadingArea.trim(), mode: 'insensitive' };
      }
      if (unloadingCity && typeof unloadingCity === 'string') {
        reqWhere.unloadingCity = { contains: unloadingCity.trim(), mode: 'insensitive' };
      }
      if (unloadingArea && typeof unloadingArea === 'string') {
        reqWhere.unloadingAreaPin = { contains: unloadingArea.trim(), mode: 'insensitive' };
      }
      if (vendorParty && typeof vendorParty === 'string') {
        const vp = vendorParty.trim();
        reqWhere.OR = [
          { customerName: { contains: vp, mode: 'insensitive' } },
          { selectedTransporterName: { contains: vp, mode: 'insensitive' } }
        ];
      }
      if (driverName && typeof driverName === 'string') {
        reqWhere.selectedDriverName = { contains: driverName.trim(), mode: 'insensitive' };
      }
      if (vehicleNumber && typeof vehicleNumber === 'string') {
        reqWhere.selectedVehicleNumber = { contains: vehicleNumber.trim().toUpperCase() };
      }
      if (tripStatus && typeof tripStatus === 'string' && tripStatus !== 'ALL') {
        reqWhere.finalStatus = tripStatus;
      }

      const [matchingRequirements, matchingVehicles, matchingDrivers, matchingTransporters] = await Promise.all([
        prisma.requirement.findMany({
          where: reqWhere,
          include: { enquiry: true },
          take: 50,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.vehicle.findMany({
          where: vehicleWhere,
          include: { transporter: { select: { companyName: true, phone: true } } },
          take: 50
        }),
        driverName ? prisma.driver.findMany({
          where: { fullName: { contains: (driverName as string).trim(), mode: 'insensitive' } },
          include: { transporter: { select: { companyName: true } } },
          take: 20
        }) : Promise.resolve([]),
        vendorParty ? prisma.transporter.findMany({
          where: {
            OR: [
              { companyName: { contains: (vendorParty as string).trim(), mode: 'insensitive' } },
              { brokerName: { contains: (vendorParty as string).trim(), mode: 'insensitive' } }
            ]
          },
          take: 20
        }) : Promise.resolve([])
      ]);

      res.status(200).json({
        success: true,
        data: {
          requirements: matchingRequirements,
          vehicles: matchingVehicles,
          drivers: matchingDrivers,
          transporters: matchingTransporters,
          totalMatches: matchingRequirements.length + matchingVehicles.length + matchingDrivers.length + matchingTransporters.length
        }
      });
    } catch (err: any) {
      console.error('CRM search error:', err);
      res.status(500).json({ success: false, message: 'CRM search failed' });
    }
  }
}

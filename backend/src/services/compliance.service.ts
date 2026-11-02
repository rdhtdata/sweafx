import { prisma } from '../db/prisma';

export enum ComplianceStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED'
}

export function computeExpiryStatus(date: Date | string | null | undefined): {
  status: ComplianceStatus;
  daysRemaining: number;
} {
  if (!date) {
    return { status: ComplianceStatus.EXPIRED, daysRemaining: -9999 };
  }

  const expiry = new Date(date).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: ComplianceStatus.EXPIRED, daysRemaining: diffDays };
  } else if (diffDays <= 30) {
    return { status: ComplianceStatus.EXPIRING_SOON, daysRemaining: diffDays };
  } else {
    return { status: ComplianceStatus.VALID, daysRemaining: diffDays };
  }
}

export class ComplianceService {
  public async getComplianceSummary() {
    const [vehicles, drivers] = await Promise.all([
      prisma.vehicle.findMany({
        include: { transporter: { select: { companyName: true } } }
      }),
      prisma.driver.findMany({
        include: { transporter: { select: { companyName: true } } }
      })
    ]);

    let validVehicles = 0;
    let expiringVehicles = 0;
    let expiredVehicles = 0;
    const alerts: any[] = [];

    vehicles.forEach((v) => {
      const rc = computeExpiryStatus(v.rcExpiryDate);
      const ins = computeExpiryStatus(v.insuranceExpiryDate);
      const fit = computeExpiryStatus(v.fitnessExpiryDate);
      const tax = computeExpiryStatus(v.taxExpiryDate);
      const pucc = computeExpiryStatus(v.puccExpiryDate);
      const permit = computeExpiryStatus(v.permitExpiryDate);

      const checks = [
        { type: 'RC', res: rc, date: v.rcExpiryDate },
        { type: 'INSURANCE', res: ins, date: v.insuranceExpiryDate },
        { type: 'FITNESS', res: fit, date: v.fitnessExpiryDate },
        { type: 'TAX', res: tax, date: v.taxExpiryDate },
        { type: 'PUCC', res: pucc, date: v.puccExpiryDate },
        { type: 'PERMIT', res: permit, date: v.permitExpiryDate }
      ];

      const isExpired = checks.some((x) => x.res.status === ComplianceStatus.EXPIRED && x.date);
      const isExpiring = checks.some((x) => x.res.status === ComplianceStatus.EXPIRING_SOON);

      if (isExpired) {
        expiredVehicles++;
      } else if (isExpiring) {
        expiringVehicles++;
      } else {
        validVehicles++;
      }

      checks.forEach((c) => {
        if (c.res.status !== ComplianceStatus.VALID && c.date) {
          alerts.push({
            id: `${v.id}-${c.type}`,
            entityType: 'VEHICLE',
            entityId: v.id,
            identifier: v.vehicleNumber,
            associatedTransporter: v.transporter?.companyName || 'Independent',
            documentType: c.type,
            expiryDate: c.date,
            daysRemaining: c.res.daysRemaining,
            status: c.res.status
          });
        }
      });
    });

    let validDrivers = 0;
    let expiringDrivers = 0;
    let expiredDrivers = 0;

    drivers.forEach((d) => {
      const dl = computeExpiryStatus(d.licenseExpiryDate);
      if (dl.status === ComplianceStatus.EXPIRED) {
        expiredDrivers++;
      } else if (dl.status === ComplianceStatus.EXPIRING_SOON) {
        expiringDrivers++;
      } else {
        validDrivers++;
      }

      if (dl.status !== ComplianceStatus.VALID) {
        alerts.push({
          id: `${d.id}-DL`,
          entityType: 'DRIVER',
          entityId: d.id,
          identifier: d.fullName,
          associatedTransporter: d.transporter?.companyName || 'Independent',
          documentType: 'DRIVING_LICENSE',
          expiryDate: d.licenseExpiryDate,
          daysRemaining: dl.daysRemaining,
          status: dl.status
        });
      }
    });

    // Sort alerts: expired first, then earliest expiring
    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      totalVehicles: vehicles.length,
      totalDrivers: drivers.length,
      validVehiclesCount: validVehicles,
      expiringVehiclesCount: expiringVehicles,
      expiredVehiclesCount: expiredVehicles,
      validDriversCount: validDrivers,
      expiringDriversCount: expiringDrivers,
      expiredDriversCount: expiredDrivers,
      urgentAlerts: alerts
    };
  }
}

export const complianceService = new ComplianceService();

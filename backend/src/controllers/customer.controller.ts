import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { EntityStatus } from '@prisma/client';

export class CustomerController {
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      const { search, status } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as EntityStatus;
      }

      if (search && typeof search === 'string') {
        const query = search.trim();
        where.OR = [
          { companyName: { contains: query, mode: 'insensitive' } },
          { customerCode: { contains: query, mode: 'insensitive' } },
          { gstin: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } }
        ];
      }

      const customers = await prisma.customer.findMany({
        where,
        include: {
          contacts: true,
          corridors: true,
          rateContracts: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: customers });
    } catch (err: any) {
      console.error('List customers error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          contacts: true,
          corridors: true,
          rateContracts: true
        }
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      res.status(200).json({ success: true, data: customer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch customer details' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyName,
        tradeName,
        gstin,
        pan,
        billingAddress,
        city,
        state,
        pincode,
        industry,
        paymentTermsDays,
        creditLimit,
        notes,
        contacts,
        corridors
      } = req.body;

      if (!companyName || !gstin || !pan || !billingAddress || !city || !state || !pincode) {
        res.status(400).json({ success: false, message: 'Missing required customer master fields' });
        return;
      }

      // Generate sequence customerCode like CUST-101
      const count = await prisma.customer.count();
      const customerCode = `CUST-${String(count + 1).padStart(3, '0')}`;

      const newCustomer = await prisma.customer.create({
        data: {
          customerCode,
          companyName: companyName.trim(),
          tradeName: tradeName?.trim(),
          gstin: gstin.toUpperCase().trim(),
          pan: pan.toUpperCase().trim(),
          billingAddress: billingAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          industry: industry?.trim(),
          paymentTermsDays: Number(paymentTermsDays) || 30,
          creditLimit: creditLimit ? Number(creditLimit) : 0,
          notes: notes?.trim(),
          contacts: contacts && Array.isArray(contacts) ? {
            create: contacts.map((c: any) => ({
              name: c.name,
              designation: c.designation,
              email: c.email,
              phone: c.phone,
              isPrimary: !!c.isPrimary
            }))
          } : undefined,
          corridors: corridors && Array.isArray(corridors) ? {
            create: corridors.map((corr: any) => ({
              originCity: corr.originCity,
              originState: corr.originState,
              destCity: corr.destCity,
              destState: corr.destState,
              standardVehicleType: corr.standardVehicleType,
              agreedRate: corr.agreedRate ? Number(corr.agreedRate) : null,
              billingBasis: corr.billingBasis || 'PER_TRIP'
            }))
          } : undefined
        },
        include: { contacts: true, corridors: true }
      });

      await logAuditEvent(req, 'CREATE_CUSTOMER', 'CUSTOMER', newCustomer.id, {
        customerCode,
        companyName: newCustomer.companyName
      });

      res.status(201).json({ success: true, data: newCustomer });
    } catch (err: any) {
      console.error('Create customer error:', err);
      if (err.code === 'P2002') {
        res.status(409).json({ success: false, message: 'Customer with this GSTIN or Code already exists' });
        return;
      }
      res.status(500).json({ success: false, message: 'Failed to create customer' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        companyName,
        tradeName,
        billingAddress,
        city,
        state,
        pincode,
        industry,
        paymentTermsDays,
        creditLimit,
        status,
        notes
      } = req.body;

      const updated = await prisma.customer.update({
        where: { id },
        data: {
          companyName,
          tradeName,
          billingAddress,
          city,
          state,
          pincode,
          industry,
          paymentTermsDays: paymentTermsDays !== undefined ? Number(paymentTermsDays) : undefined,
          creditLimit: creditLimit !== undefined ? Number(creditLimit) : undefined,
          status,
          notes
        }
      });

      await logAuditEvent(req, 'UPDATE_CUSTOMER', 'CUSTOMER', id, { updatedFields: req.body });

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update customer' });
    }
  }

  public static async addCorridor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { originCity, originState, destCity, destState, standardVehicleType, agreedRate, billingBasis, notes } = req.body;

      const corridor = await prisma.customerCorridor.create({
        data: {
          customerId: id,
          originCity,
          originState,
          destCity,
          destState,
          standardVehicleType,
          agreedRate: agreedRate ? Number(agreedRate) : null,
          billingBasis: billingBasis || 'PER_TRIP',
          notes
        }
      });

      await logAuditEvent(req, 'ADD_CUSTOMER_CORRIDOR', 'CUSTOMER', id, { corridorId: corridor.id, originCity, destCity });

      res.status(201).json({ success: true, data: corridor });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to add corridor' });
    }
  }

  public static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { customerCode: 'asc' },
        include: { contacts: true }
      });

      let csv = 'Customer Code,Company Name,GSTIN,PAN,City,State,Payment Terms,Credit Limit,Status\n';
      customers.forEach((c) => {
        csv += `"${c.customerCode}","${c.companyName}","${c.gstin}","${c.pan}","${c.city}","${c.state}",${c.paymentTermsDays},${c.creditLimit},"${c.status}"\n`;
      });

      await logAuditEvent(req, 'EXPORT_CUSTOMERS_CSV', 'CUSTOMER', 'ALL', `Exported ${customers.length} records`);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sweafex_customers_master.csv"');
      res.status(200).send(csv);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to export customers CSV' });
    }
  }
}

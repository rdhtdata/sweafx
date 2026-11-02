import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { logAuditEvent } from '../middleware/audit';
import { UserRole } from '@prisma/client';

export class UserController {
  public static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          department: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  public static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, department, phone } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'User with this email already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: role as UserRole,
          department: department?.trim() || null,
          phone: phone?.trim() || null,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          department: true,
          createdAt: true
        }
      });

      await logAuditEvent(req, 'CREATE_USER', 'USER', user.id, {
        userName: user.name,
        email: user.email,
        assignedRole: user.role
      });

      res.status(201).json({ success: true, data: user });
    } catch (err: any) {
      console.error('Create user error:', err);
      res.status(500).json({ success: false, message: 'Failed to create internal user' });
    }
  }

  public static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        res.status(400).json({ success: false, message: 'isActive flag is required' });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { isActive: !!isActive },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      await logAuditEvent(req, isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER', 'USER', id, {
        userName: user.name,
        newStatus: user.isActive
      });

      res.status(200).json({
        success: true,
        message: `User ${user.name} has been ${user.isActive ? 'activated' : 'suspended'}`,
        data: user
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  }

  public static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({ success: false, message: 'Role is required' });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role: role as UserRole },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      await logAuditEvent(req, 'UPDATE_USER_ROLE', 'USER', id, {
        userName: user.name,
        newRole: user.role
      });

      res.status(200).json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
  }
}

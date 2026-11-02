import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { logAuditEvent } from '../middleware/audit';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      };

      const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as any
      });

      const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as any
      });

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Record audit event
      req.user = payload;
      await logAuditEvent(req, 'USER_LOGIN', 'USER', user.id, 'Successful login');

      res.status(200).json({
        success: true,
        data: {
          user: payload,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  }

  public static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch current user' });
    }
  }

  public static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token required' });
        return;
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        res.status(401).json({ success: false, message: 'Refresh token revoked or expired' });
        return;
      }

      const user = storedToken.user;
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      };

      const newAccessToken = jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as any
      });

      res.status(200).json({
        success: true,
        data: { accessToken: newAccessToken }
      });
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  }
}

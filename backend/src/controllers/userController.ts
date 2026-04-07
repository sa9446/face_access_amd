import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { FaceMetadata } from '../services/faceService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, descriptor } = req.body;

        if (!name || !email || !descriptor) {
            return res.status(400).json({ error: 'Missing required fields: name, email, and face descriptor are all required' });
        }

        if (typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!FaceMetadata.isValidDescriptor(descriptor)) {
            return res.status(400).json({ error: 'Invalid face descriptor: must be an array of 128 numbers' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                faceDescriptor: descriptor,
            }
        });

        res.status(201).json({ success: true, user: { id: user.id, name: user.name } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    loyaltyPoints: true,
                    tier: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count()
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const [totalUsers, totalAccessEvents, successfulAccess, tierStats, recentActivity] = await Promise.all([
            prisma.user.count(),
            prisma.accessLog.count(),
            prisma.accessLog.count({ where: { success: true } }),
            prisma.user.groupBy({ by: ['tier'], _count: true }),
            prisma.accessLog.count({
                where: {
                    timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            })
        ]);

        const tierDistribution: Record<string, number> = {
            BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0
        };
        tierStats.forEach(s => { tierDistribution[s.tier] = s._count; });

        const successRate = totalAccessEvents > 0
            ? Math.round((successfulAccess / totalAccessEvents) * 100)
            : 0;

        res.json({
            totalUsers,
            totalAccessEvents,
            todayAccessEvents: recentActivity,
            successRate,
            tierDistribution
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, descriptor } = req.body;

        if (!name || !email || !descriptor) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
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
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                loyaltyPoints: true,
                tier: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const logs = await prisma.accessLog.count();
        const stats = await prisma.user.groupBy({
            by: ['tier'],
            _count: true
        });

        const tierDistribution: Record<string, number> = {
            BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0
        };
        stats.forEach(s => { tierDistribution[s.tier] = s._count; });

        res.json({
            totalUsers,
            totalAccessEvents: logs,
            tierDistribution
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

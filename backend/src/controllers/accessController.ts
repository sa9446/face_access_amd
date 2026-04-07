import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { FaceMetadata } from '../services/faceService.js';

function determineTier(points: number): string {
    if (points >= 1000) return 'PLATINUM';
    if (points >= 500) return 'GOLD';
    if (points >= 200) return 'SILVER';
    return 'BRONZE';
}

export const processAccess = async (req: Request, res: Response) => {
    try {
        const { descriptor, location = 'Main Entrance' } = req.body;

        if (!descriptor) {
            return res.status(400).json({ error: 'Descriptor is required' });
        }

        if (!FaceMetadata.isValidDescriptor(descriptor)) {
            return res.status(400).json({ error: 'Invalid face descriptor: must be an array of 128 numbers' });
        }

        // Single query to load all users with face data
        const users = await prisma.user.findMany({
            where: { faceDescriptor: { not: Prisma.DbNull } },
            select: { id: true, faceDescriptor: true }
        });

        const match = FaceMetadata.findBestMatch(descriptor, users);

        if (!match) {
            return res.json({ success: false, message: 'Face not recognized. Access denied.' });
        }

        const pointsToAdd = 10;

        // Atomic update: increment points, create access log and loyalty transaction together
        const [updated] = await prisma.$transaction([
            prisma.user.update({
                where: { id: match.userId },
                data: {
                    loyaltyPoints: { increment: pointsToAdd },
                }
            }),
            prisma.accessLog.create({
                data: {
                    userId: match.userId,
                    location,
                    success: true
                }
            }),
            prisma.loyaltyTransaction.create({
                data: {
                    userId: match.userId,
                    points: pointsToAdd,
                    description: `Access entry at ${location}`
                }
            })
        ]);

        // Update tier based on new points
        const newTier = determineTier(updated.loyaltyPoints);
        if (newTier !== updated.tier) {
            await prisma.user.update({
                where: { id: match.userId },
                data: { tier: newTier }
            });
        }

        return res.json({
            success: true,
            user: {
                name: updated.name,
                loyaltyPoints: updated.loyaltyPoints,
                tier: newTier
            },
            confidence: Math.round((1 - match.distance / 0.5) * 100),
            message: `Welcome, ${updated.name}! Access granted.`
        });
    } catch (error) {
        console.error('Access processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyFace = async (req: Request, res: Response) => {
    return processAccess(req, res);
};

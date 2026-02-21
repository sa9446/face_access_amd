import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { FaceMetadata } from '../services/faceService.js';

export const processAccess = async (req: Request, res: Response) => {
    try {
        const { descriptor, location = 'Main Entrance' } = req.body;

        if (!descriptor) {
            return res.status(400).json({ error: 'Descriptor is required' });
        }

        const users = await prisma.user.findMany({
            where: { faceDescriptor: { not: null } }
        });

        let matchedUser = null;

        for (const user of users) {
            if (user.faceDescriptor) {
                const isMatch = FaceMetadata.isMatch(descriptor, user.faceDescriptor as number[]);
                if (isMatch) {
                    matchedUser = user;
                    break;
                }
            }
        }

        if (matchedUser) {
            await prisma.accessLog.create({
                data: {
                    userId: matchedUser.id,
                    location,
                    success: true
                }
            });

            const pointsToAdd = 10;
            const newPoints = matchedUser.loyaltyPoints + pointsToAdd;

            let newTier = matchedUser.tier;
            if (newPoints >= 1000) newTier = 'PLATINUM';
            else if (newPoints >= 500) newTier = 'GOLD';
            else if (newPoints >= 200) newTier = 'SILVER';

            const updated = await prisma.user.update({
                where: { id: matchedUser.id },
                data: { loyaltyPoints: newPoints, tier: newTier }
            });

            return res.json({
                success: true,
                user: { name: updated.name, loyaltyPoints: updated.loyaltyPoints, tier: updated.tier },
                message: `Welcome, ${updated.name}! Access granted.`
            });
        }

        res.json({ success: false, message: 'Access denied' });
    } catch (error) {
        console.error('Access processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyFace = async (req: Request, res: Response) => {
    // Reuse matching logic for simple verification
    return processAccess(req, res);
};

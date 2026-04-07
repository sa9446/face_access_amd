import { Request, Response, NextFunction } from 'express';

const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(maxAttempts: number, windowMs: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = attempts.get(ip);

        if (record && now < record.resetAt) {
            if (record.count >= maxAttempts) {
                const retryAfter = Math.ceil((record.resetAt - now) / 1000);
                return res.status(429).json({
                    error: 'Too many attempts. Please try again later.',
                    retryAfter
                });
            }
            record.count++;
        } else {
            attempts.set(ip, { count: 1, resetAt: now + windowMs });
        }

        next();
    };
}

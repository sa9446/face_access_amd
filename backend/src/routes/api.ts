import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as accessController from '../controllers/accessController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// User routes
router.post('/register', rateLimiter(10, 60 * 1000), userController.registerUser);
router.get('/users', userController.getAllUsers);
router.get('/stats', userController.getUserStats);

// Access routes (limit to 20 attempts per minute to prevent brute force)
router.post('/verify', rateLimiter(20, 60 * 1000), accessController.verifyFace);
router.post('/access', rateLimiter(20, 60 * 1000), accessController.processAccess);

export default router;

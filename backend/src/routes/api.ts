import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as accessController from '../controllers/accessController.js';

const router = Router();

// User routes
router.post('/register', userController.registerUser);
router.get('/users', userController.getAllUsers);
router.get('/stats', userController.getUserStats);

// Access routes
router.post('/verify', accessController.verifyFace);
router.post('/access', accessController.processAccess);

export default router;

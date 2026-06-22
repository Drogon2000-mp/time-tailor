import express from 'express';
import { initiatePayment, verifyPayment } from '../controllers/esewaController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// NOTE: Kept for future modularity.
// Current integration uses /api/esewa/* routes.
router.post('/initiate', authenticate, initiatePayment);
router.post('/verify', verifyPayment);

export default router;


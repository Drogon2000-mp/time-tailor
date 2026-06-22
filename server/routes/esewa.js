import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { initiatePayment, verifyPayment } from '../controllers/esewaController.js';



const router = express.Router();

// @route   POST /api/esewa/initiate
// @desc    Generate eSewa payment parameters
// @access  Private
router.post('/initiate', authenticate, initiatePayment);

// @route   POST /api/esewa/verify
// @desc    Verify payment after eSewa callback (success/failure redirect endpoint)
// @access  Public (callback)
// eSewa redirects user (browser) to these URLs; backend verifies securely and redirects to frontend.
router.get('/verify', verifyPayment);

export default router;

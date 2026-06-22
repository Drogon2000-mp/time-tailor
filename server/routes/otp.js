import express from 'express';
import { body, validationResult } from 'express-validator';
import otpController from '../controllers/otpController.js';

const router = express.Router();

// @route   POST /api/otp/send
// @desc    Send OTP to phone for appointment verification
router.post('/send', [
  body('phone').notEmpty().matches(/^(98|97)\d{8}$/).withMessage('Valid Nepali phone required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  await otpController.sendOtp(req, res);
});

// @route   POST /api/otp/verify  
// @desc    Verify OTP for appointment booking
router.post('/verify', [
  body('phone').notEmpty().matches(/^(98|97)\d{8}$/).withMessage('Valid Nepali phone required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  await otpController.verifyOtp(req, res);
});

export default router;


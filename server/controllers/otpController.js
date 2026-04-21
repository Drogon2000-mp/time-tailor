import otpModel from '../models/Otp.js';
import Appointment from '../models/Appointment.js';
import twilio from 'twilio';

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with 10 min expiry
    await otpModel.findOneAndUpdate(
      { phone },
      { phone, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true }
    );

    // For now, return OTP in response (DEV ONLY - replace with SMS in production)
    console.log(`OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', otp }); // DEV: remove otp in production
  } catch (error) {
    console.error('OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await otpModel.findOne({
      phone,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await otpModel.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export default { sendOtp, verifyOtp };


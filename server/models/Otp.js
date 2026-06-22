import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0' } // Auto delete expired OTPs
  }
}, {
  timestamps: true
});

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;


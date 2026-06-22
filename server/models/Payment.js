import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  transaction_uuid: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'cod'],
    default: 'esewa'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  refId: {
    type: String
  },
  items: { type: Array }, // To store cart items for order creation after verification
  deliveryDetails: { type: Object }, // To store delivery info for order creation
  verificationResponse: {
    type: Object
  }
}, { timestamps: true });

paymentSchema.index({ userId: 1, createdAt: -1 }); // Index for user's payment history
paymentSchema.index({ paymentStatus: 1 }); // Index for filtering payments by status

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
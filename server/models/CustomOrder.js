// Custom Order Model
import mongoose from 'mongoose';

const customOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  garmentType: {
    type: String,
    enum: ['suit', 'shirt', 'trousers', 'overcoat'],
    required: true
  },
  fabric: {
    type: String,
    enum: ['Cotton', 'Wool', 'Linen'],
    required: [true, 'Fabric type required']
  },
  color: {
    type: String,
    required: [true, 'Color required']
  },
  fit: {
    type: String,
    enum: ['Slim', 'Regular', 'Loose'],
    required: [true, 'Fit type required']
  },
  measurements: {
    chest: { type: Number, required: true },
    waist: { type: Number, required: true },
    length: { type: Number, required: true },
    sleeve: { type: Number },
    shoulder: { type: Number, required: true },
    inseam: { type: Number }
  },
  styleNotes: {
    type: String,
    maxlength: [2000, 'Notes too long']
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'confirmed', 'in-progress', 'ready', 'delivered', 'cancelled'],
    default: 'draft'
  },
  images: [{
    type: String  // Cloudinary URLs
  }],
  totalPrice: {
    type: Number,
    default: 0
  },
  depositPaid: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

customOrderSchema.index({ user: 1, status: 1, createdAt: -1 });

const CustomOrder = mongoose.model('CustomOrder', customOrderSchema);
export default CustomOrder;


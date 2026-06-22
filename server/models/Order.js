import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    enum: ['suit', 'shirt', 'trouser', 'trousers', 'overcoat', 'ready-made'],
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  galleryImage: {
    imageUrl: String,
    title: String,
    category: String
  },

  // Ready-made product metadata (stored for cart->order->admin/user modals)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  fabric: {
    fabricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fabric'
    },
    name: String,
    color: String,
    colorHex: String,
    pricePerMeter: Number,
    metersUsed: {
      type: Number,
      default: 2.5
    }
  },
  buttons: {
    material: String,
    style: String,
    color: String,
    price: {
      type: Number,
      default: 0
    }
  },
  design: {
    lapelStyle: String,
    pocketStyle: String,
    ventStyle: String,
    lining: String,
    additionalNotes: String
  },
  measurements: {
    type: Map,
    of: String,
    default: {}
  },
  size: {
    type: String,
    default: ''
  },
  itemPrice: {
    type: Number,
    required: true
  },
  // Image is required for eSewa (ready-made products) order details
  image: {
    type: String,
    default: ''
  },
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  // Backward/compat fields (not required)

  fabricTotal: {
    type: Number,
    default: 0
  },
  buttonsTotal: {
    type: Number,
    default: 0
  },
  laborCost: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  advance: {
    type: Number,
    default: 0
  },
  remaining: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'delivery_pending', 'payment_pending', 'paid', 'processing', 'shipped', 'ready', 'completed', 'cancelled'], // Added 'shipped'
    default: 'pending'
  },
  deliveryDate: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  specialInstructions: {
    type: String,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'transfer', 'esewa'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  transaction_uuid: {
    type: String,
    unique: true,
    sparse: true
  },
  esewaPaymentId: String,
  deliveryAddress: {
    address: String,
    fullName: String, // Added fullName
    district: String, // Added district
    province: String, // Added province
    city: String,
    postalCode: String,
    landmark: String,
    deliveryPhone: String
  },
  deliveryLatLng: {
    lat: Number,
    lng: Number
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  
  // Requirement 10: Only recalculate costs for custom tailoring orders
  // Ready-made product orders from eSewa provide their own subtotal/total
  const hasCustomItems = this.items.some(item => item.serviceType !== 'ready-made');

  if (hasCustomItems) {
    this.fabricTotal = this.items.reduce((sum, item) => {
      if (item.fabric?.pricePerMeter && item.fabric?.metersUsed) {
        return sum + (item.fabric.pricePerMeter * item.fabric.metersUsed);
      }
      return sum;
    }, 0);
    
    this.buttonsTotal = this.items.reduce((sum, item) => {
      return sum + (item.buttons?.price || 0);
    }, 0);
    
    this.subtotal = this.fabricTotal + this.buttonsTotal + this.laborCost;
  }
  
  this.remaining = this.total - this.advance;
  
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status updated to ${this.status}`
    });
  }
  
  next();
});

orderSchema.statics.countApprovedOrders = async function() {
  return this.countDocuments({ status: { $in: ['approved', 'delivery_pending', 'payment_pending', 'paid', 'processing'] } });
};

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

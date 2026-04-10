// Fabric Model - Admin managed fabric colors with price per meter
import mongoose from 'mongoose';

const fabricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fabric name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true
  },
  colorHex: {
    type: String,
    required: [true, 'Color hex code is required'],
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  pricePerMeter: {
    type: Number,
    required: [true, 'Price per meter is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['suit', 'shirt', 'trouser', 'overcoat', 'daura', 'kurta', 'wool', 'cotton', 'silk', 'linen', 'blend', 'velvet'],
    default: 'blend'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
fabricSchema.index({ name: 'text', color: 'text' });

const Fabric = mongoose.model('Fabric', fabricSchema);

export default Fabric;


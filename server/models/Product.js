import mongoose from 'mongoose';

const productSizeSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom'],
    required: true
  },
  available: {
    type: Number,
    min: 0,
    default: 0
  },
  priceAdjustment: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['complete-suit', 'daura-suruwal', 'kurta-suruwal', 'suit-pant-shirt-overcoat'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sizes: [productSizeSchema],
  images: [{
    url: String,
    alt: String
  }],
  fabric: {
    material: String,
    color: String,
    details: String
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fast queries
productSchema.index({ category: 1 });
productSchema.index({ available: 1, featured: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;

// Gallery Image Model - Admin managed gallery photos
import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  category: {
    type: String,
    enum: ['suit', 'shirt', 'trouser', 'overcoat', 'wedding', 'formal', 'casual'],
    default: 'formal'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for category queries
galleryImageSchema.index({ category: 1, isActive: 1 });

const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);

export default GalleryImage;


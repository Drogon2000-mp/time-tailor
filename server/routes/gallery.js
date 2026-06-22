// Gallery Routes - Admin manage gallery, Users view only
import express from 'express';
import { body, validationResult } from 'express-validator';
import GalleryImage from '../models/GalleryImage.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import path from 'path';

const router = express.Router();

// @route   GET /api/gallery
// @desc    Get all active gallery images (public - users view only)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const images = await GalleryImage.find(filter)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gallery/upload
// @desc    Upload gallery image file (admin)
// @access  Private/Admin
router.post('/upload', authenticate, requireAdmin, async (req, res) => {
  try {
    // Use multer from app.locals (set in server.js)
    const upload = req.app.locals.upload;
    
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Cloudinary returns the URL in req.file.path
      const imageUrl = req.file.path;
      
      res.json({
        success: true,
        data: {
          imageUrl,
          publicId: req.file.filename,
          originalName: req.file.originalname
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gallery
// @desc    Add new gallery image (admin) - file upload or URL
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').isIn(['suit', 'shirt', 'trouser', 'overcoat', 'wedding', 'formal', 'casual'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Either imageUrl or uploadedFile must be provided
    const { imageUrl, uploadedFile, ...rest } = req.body;
    
    // If uploadedFile data came from file upload endpoint
    let finalImageUrl = imageUrl;
    if (uploadedFile) {
      finalImageUrl = uploadedFile.imageUrl || imageUrl;
    }

    if (!finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either image file or URL is required'
      });
    }

    // Validate URL format if provided
    if (finalImageUrl && !finalImageUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format'
      });
    }

    const galleryImage = await GalleryImage.create({
      imageUrl: finalImageUrl,
      ...rest,
      addedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: galleryImage
    });
  } catch (error) {
    console.error('Create gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery image (admin)
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery image (admin) - soft delete
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gallery/admin/all
// @desc    Get all gallery images (admin)
// @access  Private/Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const images = await GalleryImage.find()
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Get all gallery images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;


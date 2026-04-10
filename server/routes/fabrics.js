// Fabric Routes - Admin manage fabrics, Users view
import express from 'express';
import { body, validationResult } from 'express-validator';
import Fabric from '../models/Fabric.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// @route   POST /api/fabrics/upload
// @desc    Upload fabric image (admin)
// @access  Private/Admin
router.post('/upload', authenticate, requireAdmin, async (req, res) => {
  try {
    // Use multer from app.locals (set in server.js)
    const upload = req.app.locals.productUpload; // Reuse product storage
    
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

      res.json({
        success: true,
        data: {
          imageUrl: req.file.path,
          publicId: req.file.filename
        }
      });
    });
  } catch (error) {
    console.error('Fabric upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fabrics
// @desc    Get all active fabrics (public - for users)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const fabrics = await Fabric.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: fabrics
    });
  } catch (error) {
    console.error('Get fabrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// @route   POST /api/fabrics
// @desc    Create new fabric (admin)
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  // body('color').trim().notEmpty().withMessage('Color is required'), // Made optional
  // body('colorHex').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Valid hex color required'), // Made optional
  body('pricePerMeter').optional().isNumeric().withMessage('Price per meter must be numeric'),
  body('category').isIn(['suit', 'shirt', 'trouser', 'overcoat', 'daura', 'kurta', 'wool', 'cotton', 'silk', 'linen', 'blend', 'velvet']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const fabric = await Fabric.create(req.body);

    res.status(201).json({
      success: true,
      data: fabric
    });
  } catch (error) {
    console.error('Create fabric error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/fabrics/:id
// @desc    Update fabric (admin)
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const fabric = await Fabric.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!fabric) {
      return res.status(404).json({
        success: false,
        message: 'Fabric not found'
      });
    }

    res.json({
      success: true,
      data: fabric
    });
  } catch (error) {
    console.error('Update fabric error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/fabrics/:id
// @desc    Delete fabric (admin) - soft delete
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const fabric = await Fabric.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!fabric) {
      return res.status(404).json({
        success: false,
        message: 'Fabric not found'
      });
    }

    res.json({
      success: true,
      message: 'Fabric deleted successfully'
    });
  } catch (error) {
    console.error('Delete fabric error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const fabrics = await Fabric.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: fabrics
    });
  } catch (error) {
    console.error('Get all fabrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;


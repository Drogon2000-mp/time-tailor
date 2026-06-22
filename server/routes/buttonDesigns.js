// Button Design Routes - Admin manage, Users view
import express from 'express';
import { body, validationResult } from 'express-validator';
import ButtonDesign from '../models/ButtonDesign.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// @route   GET /api/button-designs
// @desc    Get all active button designs (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const designs = await ButtonDesign.find({ isActive: true });

    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    console.error('Get button designs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/button-designs
// @desc    Create new button design (admin)
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['material', 'style', 'color']).withMessage('Invalid type'),
  body('options').isArray({ min: 1 }).withMessage('At least one option required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const design = await ButtonDesign.create(req.body);

    res.status(201).json({
      success: true,
      data: design
    });
  } catch (error) {
    console.error('Create button design error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/button-designs/:id
// @desc    Update button design (admin)
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const design = await ButtonDesign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Button design not found'
      });
    }

    res.json({
      success: true,
      data: design
    });
  } catch (error) {
    console.error('Update button design error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/button-designs/:id
// @desc    Delete button design (admin) - soft delete
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const design = await ButtonDesign.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Button design not found'
      });
    }

    res.json({
      success: true,
      message: 'Button design deleted successfully'
    });
  } catch (error) {
    console.error('Delete button design error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/button-designs/admin/all
// @desc    Get all button designs (admin)
// @access  Private/Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const designs = await ButtonDesign.find().sort({ type: 1 });

    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    console.error('Get all button designs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;


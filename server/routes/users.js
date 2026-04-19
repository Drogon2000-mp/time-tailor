// User Routes - Profile and measurements management
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Appointment from '../models/Appointment.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'orders',
        options: { sort: { createdAt: -1 } }
      })
      .populate({
        path: 'appointments',
        options: { sort: { date: 1 } }
      });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, phone } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const user = await User.findById(req.user._id)
      .populate('orders')
      .populate('appointments');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// @route   PUT /api/users/preferences
// @desc    Save user tailoring preferences
// @access  Private
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { fabric, color, fit } = req.body;

    if (!fabric || !color || !fit) {
      return res.status(400).json({
        success: false,
        message: 'fabric, color, and fit are required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: {
          'preferences.fabric': fabric,
          'preferences.color': color,
          'preferences.fit': fit
        } 
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// Duplicate measurements handler removed to fix SyntaxError
// @desc    Get user's orders
// @access  Private
router.get('/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/appointments', authenticate, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .sort({ date: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ==================== ADMIN ROUTES ====================

// @route   GET /api/users
// @desc    Get all users (admin)
// @access  Private/Admin
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (admin)
// @access  Private/Admin
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        total: totalUsers + totalAdmins,
        customers: totalUsers,
        admins: totalAdmins,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;


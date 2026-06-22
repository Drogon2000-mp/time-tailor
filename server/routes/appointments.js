// Appointment Routes - Manage booking appointments
import express from 'express';
import { body, validationResult } from 'express-validator';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// @route   POST /api/appointments
// @desc    Book new appointment
// @access  Private
router.post('/', authenticate, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('type').isIn(['consultation', 'measurement', 'fitting', 'delivery'])
    .withMessage('Invalid appointment type'),
  body('phone').notEmpty().withMessage('Phone number is required')
    .matches(/^(98|97)\d{8}$/)
    .withMessage('Invalid Nepali phone (98/97 + 8 digits)'),
  body('email').optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('location.address').notEmpty().withMessage('Address is required')
    .isLength({ min: 10 }).withMessage('Address must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { date, time, type, notes, service, phone, email, location } = req.body;

    // Anti-spam: Max 3 bookings per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentBookings = await Appointment.countDocuments({
      phone,
      createdAt: { $gte: oneHourAgo },
      status: { $ne: 'cancelled' }
    });
    if (recentBookings >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many bookings from this phone number. Please wait 1 hour or use different number.'
      });
    }

    // Check slot availability
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    const appointment = new Appointment({
      user: req.user._id,
      date: new Date(date),
      time,
      type,
      notes,
      service,
      phone: phone || undefined,
      email: email || undefined,
      location: location || undefined
    });

    await appointment.save();

    // Add to user's appointments array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { appointments: appointment._id }
    });

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating appointment'
    });
  }
});

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { upcoming } = req.query;
    
    const filter = { user: req.user._id };
    
    if (upcoming === 'true') {
      filter.date = { $gte: new Date() };
      filter.status = 'scheduled';
    }

    const appointments = await Appointment.find(filter)
      .populate('service', 'name')
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

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('service', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment with reason
// @access  Private
router.put('/:id/cancel', authenticate, [
  body('reason').optional().isLength({ min: 5, max: 500 }).withMessage('Reason 5-500 chars')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this appointment'
      });
    }

    appointment.status = 'cancelled';
    if (req.body.reason) appointment.cancelReason = req.body.reason;
    await appointment.save();

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/appointments/slots/available
// @desc    Get available time slots
// @access  Public
router.get('/slots/available', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).select('time');

    const bookedTimes = bookedSlots.map(a => a.time);

    const allSlots = [];
    const startHour = 9;
    const endHour = 19;

    for (let hour = startHour; hour < endHour; hour++) {
      allSlots.push({
        time: `${hour}:00`,
        display: hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`,
        available: !bookedTimes.includes(`${hour}:00`)
      });
      if (hour < endHour - 1) {
        allSlots.push({
          time: `${hour}:30`,
          display: hour < 12 ? `${hour}:30 AM` : `${hour - 12}:30 PM`,
          available: !bookedTimes.includes(`${hour}:30`)
        });
      }
    }

    res.json({
      success: true,
      data: allSlots
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ==================== ADMIN ROUTES ====================

router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('user', 'name email phone')
      .populate('service', 'name')
      .sort({ date: 1, time: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'scheduled', 'completed', 'cancelled', 'rejected', 'no-show'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate('user', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

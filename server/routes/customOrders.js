// Custom Orders Routes
import express from 'express';
import CustomOrder from '../models/CustomOrder.js';
import { authenticate } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/custom-orders - Create custom order
router.post('/', authenticate, [
  body('garmentType').isIn(['suit', 'shirt', 'trousers', 'overcoat']).withMessage('Invalid garment type'),
  body('fabric').notEmpty().withMessage('Fabric required'),
  body('color').notEmpty().withMessage('Color required'),
  body('fit').isIn(['slim', 'regular', 'classic']).withMessage('Invalid fit'),
  body('measurements.chest').isFloat({ min: 20, max: 60 }).withMessage('Invalid chest measurement'),
  body('measurements.waist').isFloat({ min: 20, max: 50 }).withMessage('Invalid waist measurement'),
  body('measurements.length').isFloat({ min: 20, max: 40 }).withMessage('Invalid length measurement')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const order = new CustomOrder({
      ...req.body,
      user: req.user._id
    });

    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/custom-orders - Get user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const orders = await CustomOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/custom-orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await CustomOrder.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/custom-orders/:id/submit
router.put('/:id/submit', authenticate, async (req, res) => {
  try {
    const order = await CustomOrder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'draft' },
      { $set: { status: 'submitted' } },
      { new: true }
    );
    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found or already submitted' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


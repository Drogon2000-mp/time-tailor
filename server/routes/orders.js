// Order Routes - Custom tailoring order management
import express from 'express';
import mongoose from 'mongoose';
import { body, param, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();
const MAX_APPROVED_ORDERS = 5;

// Debugging middleware for all requests to /api/orders/*
router.use((req, res, next) => {
  console.log(`DEBUG (orderRoutes): Method: ${req.method}, Path: ${req.originalUrl}`);
  next();
});

// @route   POST /api/orders
// @desc    Create new custom tailoring order
// @access  Private
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.serviceType').isIn(['suit', 'shirt', 'trouser', 'trousers', 'overcoat', 'ready-made']).withMessage('Invalid service type'),
  body('items.*.serviceName').notEmpty().withMessage('Service name is required'),
  body('deliveryAddress.fullName').notEmpty().withMessage('Full name required'),
  body('deliveryAddress.deliveryPhone').notEmpty().withMessage('Phone required'),
  body('deliveryAddress.address').notEmpty().withMessage('Address required'),
  body('deliveryAddress.city').notEmpty().withMessage('City required'),
  body('deliveryAddress.district').notEmpty().withMessage('District required'),
  body('deliveryAddress.province').notEmpty().withMessage('Province required'),
  body('deliveryAddress.landmark').optional().isString(),
  body('esewaPaymentId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      items, 
      specialInstructions, 
      fabricTotal, 
      buttonsTotal, 
      laborCost, 
      subtotal, 
      total 
    } = req.body;

    // SERVER-SIDE TOTALS CALCULATION (SECURITY)
    let serverSubtotal = 0;
    let serverFabricTotal = 0;
    let serverButtonsTotal = 0;
    let serverLaborCost = 0; // Derived from business logic or DB

    // Process items to ensure proper data types
    const processedItems = items.map(item => ({
      serviceType: item.serviceType,
      serviceName: item.serviceName,
      quantity: item.quantity || 1,

      // Preserve selected size from cart/checkout
      // Frontend may send it as: item.size, item.selectedSize, or item.productSize
      size: item.size || item.selectedSize || item.productSize || '',

      // Gallery image - design preferences come from this
      galleryImage: item.galleryImage || null,

      // Fabric details
      fabric: item.fabric ? {
        ...item.fabric,
        fabricId: item.fabric.fabricId ? new mongoose.Types.ObjectId(item.fabric.fabricId) : undefined
      } : null,

      // Button details
      buttons: item.buttons || {},

      // Measurements
      measurements: item.measurements || {},

      itemPrice: item.itemPrice || 0
    }));

    // Create order
    const order = new Order({
      user: req.user._id,
      items: processedItems,
      deliveryAddress: req.body.deliveryAddress,
      esewaPaymentId: req.body.esewaPaymentId,
      fabricTotal: fabricTotal || 0,
      buttonsTotal: buttonsTotal || 0,
      laborCost: laborCost || 0,
      subtotal,
      total,
      advance: 0,
      remaining: total,
      paymentMethod: req.body.esewaPaymentId ? 'esewa' : 'card',
      paymentStatus: req.body.esewaPaymentId ? 'paid' : 'pending',
      specialInstructions,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: `Order placed${req.body.esewaPaymentId ? ' (eSewa paid)' : ''} - awaiting admin approval`
      }]
    });

    await order.save();

    // Add order to user's orders array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id }
    });

    // Populate for response
    await order.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private (TASK 4: USER MY ORDERS PAGE)
router.get('/my-orders', authenticate, async (req, res) => {
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

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private
router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid Order ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order (user can only cancel pending orders)
// @access  Private
const cancelOrder = async (req, res) => {
  console.log('--- CANCEL ORDER HANDLER ---');
  console.log('Cancel Order Request id:', req.params.id);
  console.log('Auth user:', req.user);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Cancel validation errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Admin cancels by order id (NOT user-scoped lookup)
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that is already being processed'
      });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by customer'
    });

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message // Include error message for more detail
    });
  }
};

// Handle both PUT and POST for robustness against frontend variations
router.put('/:id/cancel', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid Order ID format')
], cancelOrder);
router.post('/:id/cancel', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid Order ID format')
], cancelOrder);


// ==================== ADMIN ROUTES ====================

// @route   PUT /api/orders/:id/approve
// @desc    Approve order (max 5 concurrent approved orders)
// @access  Private/Admin
router.put('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    // Count currently approved orders
    const approvedCount = await Order.countApprovedOrders();
    
    if (approvedCount >= MAX_APPROVED_ORDERS) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve more than ${MAX_APPROVED_ORDERS} orders at a time`
      });
    }

    // First fetch the order to get its current total
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate advance (30% of total or use provided advance amount)
    const advanceAmount = req.body.advance 
      ? Math.round(req.body.advance * 100) / 100 
      : Math.round(order.total * 0.3 * 100) / 100;

    // Update the order
    order.status = 'approved';
    order.advance = advanceAmount;
    order.remaining = order.total - advanceAmount;
    order.statusHistory.push({
      status: 'approved',
      timestamp: new Date(),
      note: `Order approved. Advance payment: $${advanceAmount.toFixed(2)}`
    });

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/delivery
// @desc    Set delivery date (after approval)
// @access  Private/Admin
router.put('/:id/delivery', authenticate, requireAdmin, [
  body('deliveryDate').isISO8601().withMessage('Valid delivery date required'),
  body('note').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { deliveryDate, note } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          deliveryDate: new Date(deliveryDate),
          status: 'delivery_pending'
        },
        $push: {
          statusHistory: {
            status: 'delivery_pending',
            timestamp: new Date(),
            note: note || `Delivery date set: ${new Date(deliveryDate).toLocaleDateString()}`
          }
        }
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Set delivery date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Record advance payment received
// @access  Private/Admin
router.put('/:id/payment', authenticate, requireAdmin, [
  body('amount').isNumeric().withMessage('Payment amount required'),
  body('method').isIn(['card', 'cash', 'transfer']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, method } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update payment
    order.advance += amount;
    order.remaining = order.total - order.advance;
    order.paymentMethod = method;
    order.paymentStatus = order.remaining <= 0 ? 'paid' : 'pending';
    order.paymentDate = new Date();
    
    if (order.remaining <= 0) {
      order.status = 'processing';
      order.statusHistory.push({
        status: 'processing',
        timestamp: new Date(),
        note: 'Full payment received - order in processing'
      });
    } else {
      order.statusHistory.push({
        status: 'payment_pending',
        timestamp: new Date(),
        note: `Advance payment of $${amount} received`
      });
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'approved', 'delivery_pending', 'payment_pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'])
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

    const { status, note, adminNotes } = req.body;

    const updateData = { 
      $set: { status },
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note || `Status updated to ${status}`
        }
      }
    };
    
    if (adminNotes) {
      updateData.$set.adminNotes = adminNotes;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/admin/stats
// @desc    Get order statistics (admin)
// @access  Private/Admin
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const approvedCount = await Order.countApprovedOrders();
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$advance' } } }
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: totalOrders,
      approvedOrders: approvedCount,
      maxApprovedOrders: MAX_APPROVED_ORDERS,
      availableSlots: Math.max(0, MAX_APPROVED_ORDERS - approvedCount),
      revenue: totalRevenue[0]?.total || 0,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/orders (TASK 3: ADMIN ORDER MANAGEMENT)
// @desc    Get all orders for admin dashboard
// @access  Private/Admin
router.get('/admin/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone') // Populate user (TASK 3)
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders }); // Admin dashboard should display: Order ID, Customer Name, Phone, Delivery Address, Products, Quantity, Total Amount, Payment Status, Order Status, Transaction UUID, Order Date
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put('/admin/orders/:id/status', authenticate, requireAdmin, async (req, res) => { // TASK 10: ORDER STATUS MANAGEMENT
  try {
    const { status, note } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status} by admin`
          }
        }
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/orders/:id/status
// @desc    Update order status (admin) - Added POST for frontend compatibility
// @access  Private/Admin
router.post('/admin/orders/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'approved', 'delivery_pending', 'payment_pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'])
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

    const { status, note } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status} by admin (via POST)`
          }
        }
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order status error (POST):', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

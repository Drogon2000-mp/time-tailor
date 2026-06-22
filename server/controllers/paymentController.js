const Product = require('../models/Product');
const Order = require('../models/Order');
const crypto = require('crypto');
const axios = require('axios');

exports.initiateEsewa = async (req, res) => {
  try {
    const { items, deliveryDetails } = req.body;
    let totalAmount = 0;

    // 1. Server-side amount calculation
    const productDetails = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product) throw new Error(`Product ${item.id} not found`);
        const price = product.basePrice; // Simplified for logic
        totalAmount += price * item.qty;
        return { product: item.id, quantity: item.qty, price };
      })
    );

    const transactionUuid = `${Date.now()}-${req.user.id}`;

    // 2. Create Pending Order
    const order = await Order.create({
      user: req.user.id,
      items: productDetails,
      total: totalAmount,
      deliveryAddress: deliveryDetails,
      transactionUuid,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // 3. Generate eSewa Signature (V2)
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;
    // Use standard hex digest for eSewa v2 signatures
    const hash = crypto.createHmac('sha256', process.env.ESEWA_SECRET_KEY).update(signatureString).digest('base64');

    const params = {
      amount: totalAmount,
      failure_url: `${process.env.CLIENT_URL}/payment-failure`,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: process.env.ESEWA_PRODUCT_CODE,
      signature: hash,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
    };

    res.json({ success: true, data: { params, paymentUrl: process.env.ESEWA_URL } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEsewa = async (req, res) => {
  try {
    const { data } = req.query; // eSewa V2 redirects via GET with query params
    if (!data) throw new Error("No callback data found");

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    
    // 1. Server-to-Server Verification with eSewa
    // Note: ESEWA_VERIFY_URL should be https://rc-epay.esewa.com.np/api/epay/transaction/status/
    const verificationRes = await axios.get(process.env.ESEWA_VERIFY_URL, {
      params: {
        product_code: process.env.ESEWA_PRODUCT_CODE,
        total_amount: String(decoded.total_amount).replace(/,/g, ''), // Standardizing amount string
        transaction_uuid: decoded.transaction_uuid
      }
    });

    if (verificationRes.data.status === 'COMPLETE') {
      const order = await Order.findOne({ transactionUuid: decoded.transaction_uuid });
      
      if (!order || order.total !== Number(decoded.total_amount.replace(/,/g, ''))) {
        return res.status(400).json({ success: false, message: 'Invalid transaction data' });
      }

      if (order.paymentStatus === 'paid') {
        return res.json({ success: true, message: 'Already processed' });
      }

      // 2. Update Database
      order.paymentStatus = 'paid';
      order.status = 'processing';
      order.esewaPaymentId = decoded.transaction_code;
      await order.save();

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Verification failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server verification error' });
  }
};
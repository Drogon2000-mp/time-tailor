import axios from 'axios';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { generateEsewaSignature } from '../utils/esewaSignature.js';

// eSewa endpoints
const ESEWA_PAY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_VERIFY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/verify";

/**
 * Stable signed_field_names for eSewa.
 *
 * Your task explicitly requires sending:
 * - amount
 * - tax_amount
 * - total_amount
 * - transaction_uuid
 * - product_code
 * - product_service_charge
 * - product_delivery_charge
 */
function getSignedFieldNames() {
  return [
    'total_amount',
    'transaction_uuid',
    'product_code'
  ];
}

function buildEsewaFormFields({
  amount,
  tax_amount,
  total_amount,
  transaction_uuid,
  product_code,
  product_service_charge,
  product_delivery_charge,
  success_url,
  failure_url,
  signature
}) {
  return {
    amount: String(amount),
    tax_amount: String(tax_amount),
    total_amount: String(total_amount),
    transaction_uuid,
    product_code,
    product_service_charge: String(product_service_charge),
    product_delivery_charge: String(product_delivery_charge),
    success_url,
    failure_url,

    // eSewa required
    signed_field_names: getSignedFieldNames().join(','),
    signature
  };
}

// =========================
// 1) PAYMENT INITIATION
// =========================
export const initiatePayment = async (req, res) => {
  try {
    console.log("Payment Initiate Body:", req.body);
    const {
      items,
      orderId,
      deliveryDetails,
      customerPhone
    } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to initiate payment' 
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items in cart' });
    }

    // SECURITY: Recalculate total server-side
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.id || item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.id} not found` });
      }
      subtotal += product.basePrice * (item.qty || item.quantity || 1);
    }

    const parsedAmount = subtotal;
    const parsedTax = 0; // Set tax here if applicable
    const product_service_charge = "0";
    const product_delivery_charge = "0";
    const parsedTotal = parsedAmount + parsedTax + Number(product_service_charge) + Number(product_delivery_charge);

    console.log("=== ESEWA INITIATE ===");
    console.log(req.body);
    console.log("Product Code:", process.env.ESEWA_PRODUCT_CODE);
    console.log("Success URL:", process.env.ESEWA_SUCCESS_URL);
    console.log("Failure URL:", process.env.ESEWA_FAILURE_URL);

    const product_code = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    const success_url = process.env.ESEWA_SUCCESS_URL;
    const failure_url = process.env.ESEWA_FAILURE_URL;

    const configCheck = { product_code, secretKey, success_url, failure_url };
    const missing = Object.keys(configCheck).filter(k => !configCheck[k]);

    if (missing.length > 0) {
      console.error("Missing eSewa Config:", missing);
      return res.status(500).json({
        success: false,
        message: `eSewa configuration missing: ${missing.join(', ')}`
      });
    }

    // Unique transaction/order ref for replay protection
    const transaction_uuid = `TX-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // 1) Persist Pending Transaction
    const payment = await Payment.create({
      userId: req.user._id,
      orderId: orderId || undefined,
      transaction_uuid,
      amount: parsedTotal, // Fix: Save the full total amount being sent to eSewa
      paymentStatus: 'pending',
      paymentMethod: 'esewa',
      refId: undefined,
      verificationResponse: {}
    });
    
    // If no orderId provided, we can link the items to the payment temporarily 
    // or create a pending order. Here we assume Payment tracks the intent.

    // 2) Build signature message for signed form submission (eSewa V2)
    // Clean total for signature (ensure no decimals or trailing zeros if not needed)
    const signatureTotal = String(parsedTotal);
    const signatureString = `total_amount=${signatureTotal},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    // Pass the raw message string to the signature generator
    const signature = generateEsewaSignature(secretKey, signatureString);

    console.log("=== ESEWA PARAMS ===");
    const params = buildEsewaFormFields({
      amount: parsedAmount,
      tax_amount: parsedTax,
      total_amount: parsedTotal,
      transaction_uuid,
      product_code,
      product_service_charge,
      product_delivery_charge,
      success_url,
      failure_url,
      signature
    });


    // Frontend will POST these fields to eSewa
    return res.json({
      success: true,
      data: {
        paymentUrl: ESEWA_PAY_URL,
        params,
        paymentId: payment._id
      }
    });
  } catch (error) {
    console.error('eSewa initiate error:', error);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// =========================
// 2) PAYMENT VERIFICATION
// =========================
export const verifyPayment = async (req, res) => {
  try {
    console.log("=== ESEWA VERIFY START ===");
    
    // =========================
    // eSewa V2 Callback decoding
    // =========================
    const { data } = req.query;
    if (!data) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=no_data`);
    }

    // Decode Base64 data returned by eSewa
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    console.log("Decoded Callback Payload:", decodedData);

    const { transaction_uuid, total_amount, status, transaction_code } = decodedData;

    // 1. Normalize amount (remove commas and force numeric comparison later)
    // Important: total_amount in eSewa V2 callback often includes .0
    const callbackAmountString = String(total_amount).replace(/,/g, '');

    // 2. Find the payment record
    const payment = await Payment.findOne({ transaction_uuid });
    if (!payment) {
      console.error("Payment not found for UUID:", transaction_uuid);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=not_found`);
    }

    console.log("Payment Record from DB:", payment);

    if (payment.paymentStatus === 'paid') {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${transaction_uuid}`);
    }

    if (status !== 'COMPLETE') {
      payment.paymentStatus = 'failed';
      await payment.save();
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=incomplete`);
    }

    // 3. SERVER-TO-SERVER VERIFICATION
    // Note: We use the amount saved in our DB to ensure the string matches initiation expectations
    const verifyRes = await axios.get(ESEWA_VERIFY_URL, {
        params: {
            product_code: process.env.ESEWA_PRODUCT_CODE,
            total_amount: String(payment.amount), // Use normalized string from our DB
            transaction_uuid: transaction_uuid
        }
    });

    console.log("Verify API Response:", verifyRes.data);
    console.log("DB Total Amount:", payment.amount);
    console.log("Esewa API Total Amount:", verifyRes.data.total_amount);

    // Strict Security Checks
    const isStatusOk = verifyRes.data && verifyRes.data.status === 'COMPLETE';
    
    // Numeric comparison to avoid "2000.0" !== 2000 issues
    const apiAmount = Number(String(verifyRes.data.total_amount).replace(/,/g, ''));
    const dbAmount = Number(payment.amount);
    const isAmountOk = apiAmount === dbAmount;
    
    if (!isStatusOk || !isAmountOk) {
      console.error("Verification mismatch:", { 
        status: verifyRes.data?.status, 
        apiAmount, 
        dbAmount 
      });
      payment.paymentStatus = 'failed';
      await payment.save();
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failure?transaction_uuid=${encodeURIComponent(
          transaction_uuid
        )}&reason=verification_failed`
      );
    }

    // Mark paid
    payment.paymentStatus = 'paid';
    payment.refId = transaction_code;
    payment.verificationResponse = { verifyRes: verifyRes?.data, body: req.body };
    await payment.save();

    // Update Order if frontend already created one and provided orderId
    if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.esewaPaymentId = payment.refId || payment.transaction_uuid;
        order.paymentMethod = 'card';
        order.paymentStatus = 'paid';
        order.paymentDate = new Date();

        // Keep statusHistory intact (append new entry only)
        order.statusHistory.push({
          status: 'paid',
          timestamp: new Date(),
          note: 'eSewa payment verified (server)'
        });

        // Preserve existing order state machine as much as possible.
        order.status = order.remaining <= 0 ? 'processing' : 'payment_pending';
        await order.save();
      }
    }

    // Redirect to frontend success page
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${encodeURIComponent(
        transaction_uuid
      )}&refId=${encodeURIComponent(payment.refId || '')}`
    );
  } catch (error) {
    console.error('=== ESEWA VERIFY ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) console.error('API Response Error:', error.response.data);
    
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=server_error`);
  }
};

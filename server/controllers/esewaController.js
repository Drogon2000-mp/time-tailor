import axios from 'axios';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { generateEsewaSignature } from '../utils/esewaSignature.js';

// eSewa endpoints
const ESEWA_PAY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
// eSewa V2 transaction status endpoint (RC/UAT)
const ESEWA_VERIFY_URL = "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

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
    console.log("Payment Initiate Items (client->server):", JSON.stringify(items, null, 2));
    console.log("Full Payment Initiate Body:", req.body);
    console.log("Product Code:", process.env.ESEWA_PRODUCT_CODE);
    console.log("Success URL:", process.env.ESEWA_SUCCESS_URL);
    console.log("Failure URL:", process.env.ESEWA_FAILURE_URL);

    const product_code = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    const success_url = process.env.ESEWA_SUCCESS_URL;
    const failure_url = process.env.ESEWA_FAILURE_URL;
    const frontend_url = process.env.FRONTEND_URL; // Added frontend_url to check

    const configCheck = { product_code, secretKey, success_url, failure_url, frontend_url };
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

    // 1) Persist BEFORE redirect
    const payment = await Payment.create({
      userId: req.user._id,
      orderId: orderId || undefined,
      transaction_uuid,
      amount: parsedTotal,
      items: items, // Store items for later order creation
      deliveryDetails: deliveryDetails, // Store delivery details for later order creation
      paymentStatus: 'pending',
      paymentMethod: 'esewa',
      refId: undefined,
      verificationResponse: {}
    });

    // 2) Build signature message for signed form submission (eSewa V2)
    // Format must be: total_amount=100,transaction_uuid=11-001,product_code=EPAYTEST
    // Important: total_amount in signature must match the total_amount in params exactly
    const signatureTotal = String(parsedTotal);
    const signatureString = `total_amount=${signatureTotal},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    // Pass the raw message string to the signature generator
    const signature = generateEsewaSignature(secretKey, signatureString);

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

    console.log("=== FINAL ESEWA PARAMS ===");
    console.log(JSON.stringify(params, null, 2));
    console.log("=== SIGNATURE STRING ===");
    console.log(signatureString);
    console.log("=== ESEWA PAYMENT URL ===", ESEWA_PAY_URL);
    console.log("=== ESEWA PARAMS ===", params);

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
    console.log("=== RAW QUERY ===");
    console.log(req.query);

    const { data } = req.query;
    if (!data) {
      console.error("No data received in eSewa callback");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=no_data`);
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    console.log("=== DECODED DATA ===");
    console.log(decodedData);

    const { transaction_uuid, status, transaction_code } = decodedData;

    if (!transaction_uuid) {
      console.error("Missing transaction_uuid in decoded data", decodedData);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=no_transaction_uuid`);
    }

    const payment = await Payment.findOne({ transaction_uuid });
    if (!payment) {
      console.error("Payment not found for UUID:", transaction_uuid);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=not_found&transaction_uuid=${encodeURIComponent(transaction_uuid)}`);
    }

    console.log("=== PAYMENT RECORD ===", {
      userId: payment.userId?.toString?.() || payment.userId,
      amount: payment.amount,
      paymentStatus: payment.paymentStatus,
      itemsType: Array.isArray(payment.items) ? 'array' : typeof payment.items,
      items: Array.isArray(payment.items) ? payment.items : null,
      deliveryDetails: payment.deliveryDetails
    });

    if (payment.paymentStatus === 'paid') {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${encodeURIComponent(transaction_uuid)}&refId=${encodeURIComponent(payment.refId || '')}`);
    }

    if (status !== 'COMPLETE') {
      console.error("Callback status not COMPLETE:", status);
      payment.paymentStatus = 'failed';
      await payment.save();
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=incomplete&transaction_uuid=${encodeURIComponent(transaction_uuid)}`);
    }

    // Server-to-server verify with eSewa
    const verifyRes = await axios.get(ESEWA_VERIFY_URL, {
      params: {
        product_code: process.env.ESEWA_PRODUCT_CODE,
        total_amount: String(payment.amount),
        transaction_uuid: transaction_uuid
      }
    });

    console.log("=== ESEWA VERIFY API RESPONSE ===");
    console.log(verifyRes.data);

    // eSewa RC/UAT transaction status response may not return total_amount as a number.
    // Prefer status check; validate amount when present.
    const verifyStatus = verifyRes.data?.status;
    const apiAmountRaw = verifyRes.data?.total_amount;

    const isStatusOk = verifyStatus === 'COMPLETE';
    const dbAmount = Number(payment.amount);

    let amountOk = true;
    if (apiAmountRaw !== undefined && apiAmountRaw !== null && String(apiAmountRaw).trim() !== '') {
      const apiAmount = Number(String(apiAmountRaw).replace(/,/g, ''));
      amountOk = apiAmount === dbAmount;
      if (!amountOk) {
        console.error("Verification amount mismatch:", { apiAmount, dbAmount });
      }
    }

    if (!isStatusOk || !amountOk) {
      console.error("Verification mismatch:", { status: verifyStatus, apiAmountRaw, dbAmount });
      payment.paymentStatus = 'failed';
      await payment.save();
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?transaction_uuid=${encodeURIComponent(transaction_uuid)}&reason=verification_failed`);
    }


    // Mark paid
    payment.paymentStatus = 'paid';
    payment.refId = transaction_code;
    payment.verificationResponse = verifyRes.data;
    await payment.save();

    // Duplicate protection
    const existingOrder = await Order.findOne({ transaction_uuid });
    if (existingOrder) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${encodeURIComponent(transaction_uuid)}&refId=${encodeURIComponent(payment.refId || '')}`);
    }

    // Hard-validate for Order schema
    if (!payment.userId) throw new Error('Missing payment.userId');
    if (payment.amount == null) throw new Error('Missing payment.amount');

    const total = Number(payment.amount);
    if (!Number.isFinite(total)) throw new Error(`Invalid payment.amount: ${payment.amount}`);

    if (!Array.isArray(payment.items) || payment.items.length === 0) throw new Error('Missing/empty payment.items');

    if (!payment.deliveryDetails || typeof payment.deliveryDetails !== 'object' || Object.keys(payment.deliveryDetails).length === 0) {
      throw new Error('Missing/empty payment.deliveryDetails');
    }

    // Build orderItems
    const orderItems = [];
    for (const cartItem of payment.items) {
      const productId = cartItem?.id || cartItem?.productId;
      const quantityRaw = cartItem?.qty ?? cartItem?.quantity ?? 1;

      const quantity = Number(quantityRaw);
      if (!productId) throw new Error('payment.items entry missing id/productId');
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Invalid quantity for product ${productId}: ${quantityRaw}`);

      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product ${productId} not found while building orderItems`);

      const itemPrice = product.basePrice;
      if (!product.name) throw new Error(`Missing product.name for ${productId}`);
      if (itemPrice == null) throw new Error(`Missing product.basePrice for ${productId}`);

      const itemImage = product?.images?.[0]?.url || product?.image || '/images/product-placeholder.jpg';

      const size = cartItem?.size || cartItem?.selectedSize || cartItem?.productSize || cartItem?.itemSize || cartItem?.sizeValue || '';

      // Prefer cartItem.description if provided; fallback to product.description
      const description = (cartItem?.description || product.description || '');
      const category = product.category || cartItem?.category || '';

      // Extra hardening: log once per item if missing
      if (!size || !description) {
        console.log('WARN(order build): missing size/description from payment.items item:', {
          productId,
          sizeFromCart: cartItem?.size,
          descriptionFromCart: cartItem?.description,
          productDescription: product.description
        });
      }

      orderItems.push({
        serviceType: 'ready-made',
        productId,
        serviceName: product.name,
        image: itemImage || cartItem?.image || '',
        description,
        category,
        quantity,
        size,
        itemPrice: Number(itemPrice)
      });
    }

    const orderPayload = {
      user: payment.userId,
      items: orderItems,
      subtotal: total,
      total,
      paymentMethod: 'esewa',
      paymentStatus: 'paid',
      status: 'processing',
      paymentDate: new Date(),
      esewaPaymentId: payment.refId,
      transaction_uuid: payment.transaction_uuid,
      deliveryAddress: {
        fullName: payment.deliveryDetails?.fullName,
        address: payment.deliveryDetails?.address,
        city: payment.deliveryDetails?.city,
        district: payment.deliveryDetails?.district,
        province: payment.deliveryDetails?.province,
        postalCode: payment.deliveryDetails?.postalCode,
        landmark: payment.deliveryDetails?.landmark,
        deliveryPhone: payment.deliveryDetails?.deliveryPhone
      },
      statusHistory: [
        {
          status: 'processing',
          timestamp: new Date(),
          note: 'Order created after successful eSewa payment'
        }
      ]
    };

    console.log('ORDER PAYLOAD PRE-SAVE:', JSON.stringify(orderPayload, null, 2));

    const order = await Order.create(orderPayload);
    console.log('ORDER CREATED:', order._id);

    payment.orderId = order._id;
    await payment.save();

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${encodeURIComponent(transaction_uuid)}&refId=${encodeURIComponent(payment.refId || '')}`
    );
  } catch (error) {
    console.error('eSewa verify error:', error);

    const details = error?.response?.data ? 'eSewa API Error' : (error?.message || 'server_error');
    const errorMessage = encodeURIComponent(details);

    return res.redirect(`${process.env.FRONTEND_URL}/payment-failure?reason=server_error&details=${errorMessage}`);
  }
};


const crypto = require('crypto');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const User = require('../models/User');
const axios = require('axios');
const { createNotification } = require('./notification.controller');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ESCROW_STATUS,
  PLATFORM_FEE_PCT,
  LISTING_STATUS,
  PAGINATION,
} = require('../config/constants');

// ─── Paystack Helpers ──────────────────────────────────────────────────────────

const PAYSTACK_BASE = 'https://api.paystack.co';

/**
 * Returns Paystack Authorization headers using the secret key from env.
 */
const paystackHeaders = () => ({
  Authorization: `Bearer ${(process.env.PAYSTACK_SECRET_KEY || '').trim()}`,
  'Content-Type': 'application/json',
});

// ─── Shared populate options for order queries ─────────────────────────────────
const ORDER_POPULATE = [
  {
    path: 'buyer',
    select: 'firstName lastName avatarUrl university whatsappNumber',
    options: { strictPopulate: false },
  },
  {
    path: 'seller',
    select: 'firstName lastName avatarUrl university whatsappNumber payoutDetails',
    options: { strictPopulate: false },
  },
  {
    path: 'listing',
    select: 'title price currency images type category status pickupLocation whatsappNumber',
    options: { strictPopulate: false },
  },
];

// ─── POST /api/orders ─────────────────────────────────────────────────────────
/**
 * Create a new order.
 * Body: { listingId, paymentMethod: 'paystack' | 'cash' }
 * - 100% of the price is paid by the buyer into marketplace escrow.
 * - 3% platform commission is calculated.
 * - 97% is allocated for the seller's net payout.
 */
const createOrder = async (req, res, next) => {
  try {
    const { listingId, paymentMethod } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required.' });
    }

    if (!paymentMethod || !Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod must be one of: ${Object.values(PAYMENT_METHOD).join(', ')}`,
      });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.sellerId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot purchase your own listing.',
      });
    }

    // 3% Platform Fee, 97% Seller Net Payout
    const totalAmount = listing.price;
    const feePct = PLATFORM_FEE_PCT || 3.0;
    const platformFeeAmount = parseFloat((totalAmount * (feePct / 100)).toFixed(2));
    const sellerPayoutAmount = parseFloat((totalAmount - platformFeeAmount).toFixed(2));

    // Reuse existing PENDING_PAYMENT order if buyer already initiated checkout for this listing
    const existingPendingOrder = await Order.findOne({
      buyerId: req.user._id,
      listingId: listing._id,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
    });

    if (existingPendingOrder) {
      existingPendingOrder.paymentMethod = paymentMethod;
      existingPendingOrder.amount = totalAmount;
      existingPendingOrder.totalAmount = totalAmount;
      existingPendingOrder.platformFeePct = feePct;
      existingPendingOrder.platformFeeAmount = platformFeeAmount;
      existingPendingOrder.platformFee = platformFeeAmount;
      existingPendingOrder.sellerPayoutAmount = sellerPayoutAmount;
      await existingPendingOrder.save();
      await existingPendingOrder.populate(ORDER_POPULATE);
      return res.json({
        success: true,
        message: 'Resumed existing pending order.',
        data: existingPendingOrder,
      });
    }

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return res.status(409).json({
        success: false,
        message: 'This listing is no longer available for purchase.',
      });
    }

    const order = await Order.create({
      buyerId: req.user._id,
      sellerId: listing.sellerId,
      listingId: listing._id,
      amount: totalAmount,
      totalAmount,
      currency: listing.currency || 'GHS',
      platformFeePct: feePct,
      platformFee: platformFeeAmount,
      platformFeeAmount,
      sellerPayoutAmount,
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      escrowStatus: ESCROW_STATUS.HOLDING,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
    });

    // Only pause listing immediately if payment method is cash.
    // For Paystack, listing remains ACTIVE until payment is verified so unpaid attempts don't hide the listing.
    if (paymentMethod === PAYMENT_METHOD.CASH) {
      listing.status = LISTING_STATUS.PAUSED;
      await listing.save();
    }

    await order.populate(ORDER_POPULATE);

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────
/**
 * Get orders for the authenticated user (both as buyer and seller).
 * Query: { role: 'buying' | 'selling', status, page, limit }
 */
const getOrders = async (req, res, next) => {
  try {
    const {
      role,
      status,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role === 'buying') {
      filter.buyerId = req.user._id;
    } else if (role === 'selling') {
      filter.sellerId = req.user._id;
    } else {
      filter.$or = [{ buyerId: req.user._id }, { sellerId: req.user._id }];
    }

    if (status && Object.values(ORDER_STATUS).includes(status)) {
      filter.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate(ORDER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
/**
 * Get a single order by ID.
 * Only the buyer, seller, or an admin may view it.
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isParty =
      order.buyerId.toString() === req.user._id.toString() ||
      order.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isParty && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.',
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/orders/:id/initiate-payment ────────────────────────────────────
/**
 * Initialize a Paystack transaction for the given order.
 * Returns { reference, access_code, authorization_url } from Paystack.
 * Only the buyer may initiate payment.
 * Only valid for orders with paymentMethod = 'paystack' and status = PENDING_PAYMENT.
 */
const initiatePayment = async (req, res, next) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured. Please contact support.',
      });
    }

    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can initiate payment.',
      });
    }

    if (order.paymentMethod !== PAYMENT_METHOD.PAYSTACK) {
      return res.status(400).json({
        success: false,
        message: 'This order is not configured for online payment.',
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PENDING_PAYMENT) {
      return res.status(409).json({
        success: false,
        message: `Cannot initiate payment for an order with status '${order.orderStatus}'.`,
      });
    }

    // Customer pays 100% of listing price (pesewas for GHS → 1 GHS = 100 pesewas)
    const amountInPesewas = Math.round(order.amount * 100);

    const callbackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout?orderId=${order._id}`;

    const payload = {
      email: req.user.email,
      amount: amountInPesewas,
      currency: order.currency || 'GHS',
      reference: `SMH-${order._id}-${Date.now()}`,
      callback_url: callbackUrl,
      metadata: {
        orderId: order._id.toString(),
        listingId: order.listingId?.toString(),
        buyerId: req.user._id.toString(),
        cancel_action: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout`,
      },
    };

    let paystackRes;
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE}/transaction/initialize`,
        payload,
        { headers: paystackHeaders() }
      );
      paystackRes = response.data;
    } catch (paystackErr) {
      if (paystackErr.response?.data?.code === 'unsupported_currency') {
        console.warn('[Paystack Warning]: GHS currency not enabled on merchant account. Retrying with merchant default currency...');
        delete payload.currency;
        const fallbackResponse = await axios.post(
          `${PAYSTACK_BASE}/transaction/initialize`,
          payload,
          { headers: paystackHeaders() }
        );
        paystackRes = fallbackResponse.data;
      } else {
        throw paystackErr;
      }
    }

    if (!paystackRes?.status) {
      return res.status(502).json({
        success: false,
        message: paystackRes?.message || 'Paystack failed to initialize transaction. Please try again.',
      });
    }

    res.json({
      success: true,
      data: {
        reference: paystackRes.data.reference,
        access_code: paystackRes.data.access_code,
        authorization_url: paystackRes.data.authorization_url,
        orderId: order._id,
      },
    });
  } catch (error) {
    if (error.response?.data) {
      console.error('[Paystack API Error]:', error.response.data);
      return res.status(502).json({
        success: false,
        message: error.response.data.message || 'Payment gateway error.',
      });
    }
    next(error);
  }
};

// ─── GET /api/orders/verify-payment ──────────────────────────────────────────
/**
 * Verify a Paystack transaction after the user returns from the payment page.
 * Query: { reference, orderId }
 * On success:
 * - 100% funds held in platform escrow (`paymentStatus` → HELD, `escrowStatus` → HOLDING).
 * - 3% Platform Commission deducted (`platformFeeAmount`).
 * - 97% allocated for seller payout (`sellerPayoutAmount`).
 * - 24-Hour countdown begins (`payoutEligibleAt = paidAt + 24h`).
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { reference, orderId: queryOrderId } = req.query;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required.' });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured.',
      });
    }

    // Verify with Paystack
    const { data: paystackRes } = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: paystackHeaders() }
    );

    if (!paystackRes.status || paystackRes.data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Transaction was not successful.',
        paystackStatus: paystackRes.data?.status,
      });
    }

    // Resolve orderId — prefer metadata from Paystack, fall back to query param
    const orderId = paystackRes.data.metadata?.orderId || queryOrderId;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Could not link transaction to an order.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Idempotency — if already paid, just return success
    if (order.orderStatus === ORDER_STATUS.PAID) {
      await order.populate(ORDER_POPULATE);
      return res.json({ success: true, message: 'Payment already verified.', data: order });
    }

    // Verify buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Verify amount matches (with 5 pesewas tolerance)
    const expectedPesewas = Math.round(order.amount * 100);
    if (Math.abs(paystackRes.data.amount - expectedPesewas) > 5) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch. Payment amount does not match order total.',
      });
    }

    // Calculate 3% fee and 97% net
    const total = order.amount || order.totalAmount;
    const feePct = PLATFORM_FEE_PCT || 3.0;
    const platformFee = parseFloat((total * (feePct / 100)).toFixed(2));
    const sellerNet = parseFloat((total - platformFee).toFixed(2));

    const now = new Date();
    // Default 24 hours (or configurable via env for dev testing)
    const holdHours = process.env.ESCROW_HOLD_HOURS ? parseFloat(process.env.ESCROW_HOLD_HOURS) : 24;
    const eligibleAfter = new Date(now.getTime() + holdHours * 60 * 60 * 1000);

    // Update order into Escrow
    order.orderStatus = ORDER_STATUS.PAID;
    order.paymentStatus = PAYMENT_STATUS.HELD;
    order.escrowStatus = ESCROW_STATUS.HOLDING;
    order.totalAmount = total;
    order.platformFeePct = feePct;
    order.platformFee = platformFee;
    order.platformFeeAmount = platformFee;
    order.sellerPayoutAmount = sellerNet;
    order.paidAt = now;
    order.payoutEligibleAt = eligibleAfter;
    order.hasComplaint = false;
    order.paymentReference = reference;
    await order.save();

    // Mark listing as PAUSED/Reserved upon confirmed payment
    await Listing.findByIdAndUpdate(order.listingId, { status: LISTING_STATUS.PAUSED });

    await order.populate(ORDER_POPULATE);

    // Notify seller
    const listingTitle = order.listing?.title || 'your item';
    createNotification({
      userId: order.sellerId,
      type: 'payment_received',
      title: 'Payment Received (Escrow)',
      message: `GH₵${total.toLocaleString()} received into secure escrow for "${listingTitle}". Net payout of GH₵${sellerNet.toLocaleString()} will transfer to your Mobile Money/Bank in 24 hours.`,
      data: { orderId: order._id, listingId: order.listingId },
    });

    res.json({
      success: true,
      message: 'Payment received. Funds placed in secure 24h escrow.',
      data: order,
      payoutEligibleAt: order.payoutEligibleAt,
    });
  } catch (error) {
    if (error.response?.data) {
      return res.status(502).json({
        success: false,
        message: error.response.data.message || 'Payment gateway error during verification.',
      });
    }
    next(error);
  }
};

// ─── POST /api/orders/:id/confirm ─────────────────────────────────────────────
/**
 * Buyer confirms receipt of goods/service.
 * Marks order COMPLETED, accelerates escrow payout eligibility, and marks listing SOLD.
 */
const confirmOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can confirm receipt of this order.',
      });
    }

    const confirmableStatuses = [
      ORDER_STATUS.PAID,
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.READY,
    ];
    if (!confirmableStatuses.includes(order.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Cannot confirm an order with status '${order.orderStatus}'.`,
      });
    }

    order.orderStatus = ORDER_STATUS.COMPLETED;
    order.paymentStatus = PAYMENT_STATUS.RELEASED;
    order.completedAt = new Date();

    // If order was in 24h hold without dispute, buyer confirmation matures it immediately for next payout cycle
    if (order.escrowStatus === ESCROW_STATUS.HOLDING && !order.hasComplaint) {
      order.escrowStatus = ESCROW_STATUS.ELIGIBLE_FOR_PAYOUT;
      order.payoutEligibleAt = new Date();
    }

    await order.save();

    await Listing.findByIdAndUpdate(order.listingId, { status: LISTING_STATUS.SOLD });
    await order.populate(ORDER_POPULATE);

    const listingTitle2 = order.listing?.title || 'your item';
    createNotification({
      userId: order.sellerId,
      type: 'order_update',
      title: 'Order Confirmed by Buyer',
      message: `The buyer confirmed receipt of "${listingTitle2}". Payout is ready for transfer.`,
      data: { orderId: order._id, listingId: order.listingId },
    });

    res.json({
      success: true,
      message: 'Order confirmed. Thank you for your purchase!',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/orders/:id/dispute ─────────────────────────────────────────────
/**
 * Buyer or seller raises a dispute within the 24-hour escrow window.
 * Freezes automated seller payout (`hasComplaint = true`, `escrowStatus = DISPUTED`).
 * Body: { reason, evidence?: [{ type, content }] }
 */
const disputeOrder = async (req, res, next) => {
  try {
    const { reason, evidence } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A dispute reason is required.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isParty =
      order.buyerId.toString() === req.user._id.toString() ||
      order.sellerId.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to dispute this order.',
      });
    }

    if (order.escrowStatus === ESCROW_STATUS.PAID_OUT) {
      return res.status(400).json({
        success: false,
        message: 'Payout has already been executed for this order.',
      });
    }

    const nonDisputableStatuses = [
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.REFUNDED,
      ORDER_STATUS.DISPUTED,
    ];
    if (nonDisputableStatuses.includes(order.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Cannot open a dispute on an order with status '${order.orderStatus}'.`,
      });
    }

    // Freeze automated escrow payout
    order.orderStatus = ORDER_STATUS.DISPUTED;
    order.escrowStatus = ESCROW_STATUS.DISPUTED;
    order.hasComplaint = true;
    order.disputeReason = reason.trim();
    order.disputeFiledBy = req.user._id;
    order.disputedAt = new Date();

    if (Array.isArray(evidence) && evidence.length > 0) {
      order.disputeEvidence = evidence.map((item) => ({
        type: item.type || 'text',
        content: item.content || '',
      }));
    }

    await order.save();
    await order.populate(ORDER_POPULATE);

    // Notify the other party
    const isDisputerBuyer = order.buyerId.toString() === req.user._id.toString();
    const otherPartyId = isDisputerBuyer ? order.sellerId : order.buyerId;
    const listingTitle3 = order.listing?.title || 'an item';
    createNotification({
      userId: otherPartyId,
      type: 'dispute_update',
      title: 'Dispute Raised (Payout Frozen)',
      message: `A complaint was raised on "${listingTitle3}". Escrow payout is on hold pending admin review.`,
      data: { orderId: order._id },
    });

    res.json({
      success: true,
      message: 'Complaint registered. Payout is frozen pending review.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/orders/paystack-webhook ────────────────────────────────────────
/**
 * Paystack Webhook endpoint.
 * Handles 'charge.success', 'transfer.success', 'transfer.failed', 'transfer.reversed'.
 * Validates the HMAC SHA512 signature using PAYSTACK_SECRET_KEY.
 */
const paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Paystack secret key is missing.' });
    }

    // Verify Paystack HMAC SHA512 signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
      .digest('hex');

    const paystackSignature = req.headers['x-paystack-signature'];
    if (hash !== paystackSignature) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 1. Charge Success Event
    if (event.event === 'charge.success') {
      const data = event.data;
      const orderId = data.metadata?.orderId;
      const reference = data.reference;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.orderStatus !== ORDER_STATUS.PAID) {
          const total = order.amount || order.totalAmount;
          const feePct = PLATFORM_FEE_PCT || 3.0;
          const platformFee = parseFloat((total * (feePct / 100)).toFixed(2));
          const sellerNet = parseFloat((total - platformFee).toFixed(2));

          const now = new Date();
          const holdHours = process.env.ESCROW_HOLD_HOURS ? parseFloat(process.env.ESCROW_HOLD_HOURS) : 24;
          const eligibleAfter = new Date(now.getTime() + holdHours * 60 * 60 * 1000);

          order.orderStatus = ORDER_STATUS.PAID;
          order.paymentStatus = PAYMENT_STATUS.HELD;
          order.escrowStatus = ESCROW_STATUS.HOLDING;
          order.totalAmount = total;
          order.platformFeePct = feePct;
          order.platformFee = platformFee;
          order.platformFeeAmount = platformFee;
          order.sellerPayoutAmount = sellerNet;
          order.paidAt = now;
          order.payoutEligibleAt = eligibleAfter;
          order.hasComplaint = false;
          order.paymentReference = reference;
          await order.save();

          await Listing.findByIdAndUpdate(order.listingId, { status: LISTING_STATUS.PAUSED });
          await order.populate(ORDER_POPULATE);

          const listingTitle = order.listing?.title || 'your item';
          createNotification({
            userId: order.sellerId,
            type: 'payment_received',
            title: 'Payment Received (Escrow)',
            message: `GH₵${total.toLocaleString()} placed in escrow for "${listingTitle}". 24h countdown started for MoMo payout.`,
            data: { orderId: order._id, listingId: order.listingId },
          });
        }
      }
    }

    // 2. Transfer Succeeded Event
    if (event.event === 'transfer.success') {
      const transferCode = event.data?.transfer_code;
      if (transferCode) {
        console.log(`[PAYSTACK WEBHOOK] Transfer ${transferCode} completed successfully.`);
        await Order.findOneAndUpdate(
          { paystackTransferReference: transferCode },
          {
            escrowStatus: ESCROW_STATUS.PAID_OUT,
            paymentStatus: PAYMENT_STATUS.RELEASED,
            payoutProcessedAt: new Date(),
          }
        );
      }
    }

    // 3. Transfer Failed / Reversed Event (Freeze & alert admin)
    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const transferCode = event.data?.transfer_code;
      if (transferCode) {
        console.error(`[PAYSTACK WEBHOOK ALERT] Transfer ${transferCode} failed or reversed!`);
        await Order.findOneAndUpdate(
          { paystackTransferReference: transferCode },
          { escrowStatus: ESCROW_STATUS.HOLDING } // Revert to holding for investigation
        );
      }
    }

    res.status(200).json({ status: true });
  } catch (error) {
    console.error('[Paystack Webhook Error]:', error);
    res.status(200).json({ status: true });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  initiatePayment,
  verifyPayment,
  paystackWebhook,
  confirmOrder,
  disputeOrder,
};

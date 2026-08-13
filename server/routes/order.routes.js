const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  initiatePayment,
  verifyPayment,
  paystackWebhook,
  confirmOrder,
  disputeOrder,
} = require('../controllers/order.controller');

// POST   /api/orders                         — create a new order
router.post('/', protect, createOrder);

// POST   /api/orders/paystack-webhook        — Paystack webhook (public, signature verified)
router.post('/paystack-webhook', paystackWebhook);

// GET    /api/orders                         — list user's orders (?role=buying|selling&status=)
router.get('/', protect, getOrders);

// GET    /api/orders/verify-payment          — verify Paystack transaction (?reference=xxx)
// NOTE: must be defined BEFORE /:id to avoid 'verify-payment' matching as an id
router.get('/verify-payment', protect, verifyPayment);

// GET    /api/orders/:id                     — get single order detail
router.get('/:id', protect, getOrderById);

// POST   /api/orders/:id/initiate-payment    — initialize Paystack transaction
router.post('/:id/initiate-payment', protect, initiatePayment);

// POST   /api/orders/:id/confirm             — buyer confirms receipt (→ COMPLETED)
router.post('/:id/confirm', protect, confirmOrder);

// POST   /api/orders/:id/dispute             — raise a dispute (→ DISPUTED)
router.post('/:id/dispute', protect, disputeOrder);

module.exports = router;


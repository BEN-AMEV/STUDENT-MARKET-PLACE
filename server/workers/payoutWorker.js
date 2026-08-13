const cron = require('node-cron');
const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../controllers/notification.controller');
const { ESCROW_STATUS, PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');

const PAYSTACK_BASE = 'https://api.paystack.co';

const paystackHeaders = () => ({
  Authorization: `Bearer ${(process.env.PAYSTACK_SECRET_KEY || '').trim()}`,
  'Content-Type': 'application/json',
});

/**
 * Scan database and execute automated 24-hour payouts for eligible escrow orders.
 */
const processAutomatedPayouts = async () => {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  const now = new Date();

  console.log(`[PAYOUT CRON] ⏱️  Scanning for matured escrow orders at ${now.toISOString()}...`);

  try {
    // Find orders where:
    // 1. Funds are held in escrow or marked eligible
    // 2. 24-hour window has elapsed (payoutEligibleAt <= now)
    // 3. No complaints/disputes filed (hasComplaint === false)
    const eligibleOrders = await Order.find({
      escrowStatus: { $in: [ESCROW_STATUS.HOLDING, ESCROW_STATUS.ELIGIBLE_FOR_PAYOUT] },
      hasComplaint: false,
      payoutEligibleAt: { $lte: now },
      orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] },
    }).populate('seller', 'firstName lastName email payoutDetails');

    if (eligibleOrders.length === 0) {
      console.log('[PAYOUT CRON] ✨ No pending escrow orders due for payout.');
      return;
    }

    console.log(`[PAYOUT CRON] 💰 Found ${eligibleOrders.length} order(s) eligible for automated seller payout.`);

    for (const order of eligibleOrders) {
      const seller = order.seller;
      const payoutAmountGHS = order.sellerPayoutAmount || (order.amount ? +(order.amount * 0.97).toFixed(2) : 0);
      const payoutAmountInPesewas = Math.round(payoutAmountGHS * 100);

      if (!seller) {
        console.warn(`[PAYOUT CRON] ⚠️  Order ${order._id} has no valid seller attached. Skipping.`);
        continue;
      }

      const recipientCode = seller.payoutDetails?.paystackRecipientCode;

      // If seller has not set up their payout recipient code
      if (!recipientCode) {
        console.warn(`[PAYOUT CRON] ⚠️  Seller ${seller._id} (${seller.firstName}) has not configured a Paystack Recipient Code for order ${order._id}.`);
        createNotification({
          userId: seller._id,
          type: 'order_update',
          title: 'Payout Account Required',
          message: `Your payout of GH₵${payoutAmountGHS.toLocaleString()} for Order #${order._id.toString().slice(-6)} is ready! Please configure your Mobile Money/Bank payout details in your Profile to receive your funds.`,
          data: { orderId: order._id },
        });
        continue;
      }

      // If no live Paystack key is set, mock payout success for development
      if (!secretKey || secretKey.startsWith('mock_')) {
        console.log(`[PAYOUT CRON MOCK] 💳 Processed mock transfer of GH₵${payoutAmountGHS} to ${seller.payoutDetails.accountNumber} (${seller.payoutDetails.bankCode}) for Order ${order._id}`);
        order.escrowStatus = ESCROW_STATUS.PAID_OUT;
        order.paymentStatus = PAYMENT_STATUS.RELEASED;
        order.payoutProcessedAt = new Date();
        order.paystackTransferReference = `TRF_MOCK_${Date.now()}`;
        await order.save();

        createNotification({
          userId: seller._id,
          type: 'order_update',
          title: 'Payout Transferred 🎉',
          message: `GH₵${payoutAmountGHS.toLocaleString()} has been transferred to your ${seller.payoutDetails.bankCode} account (${seller.payoutDetails.accountNumber}) for Order #${order._id.toString().slice(-6)}.`,
          data: { orderId: order._id },
        });
        continue;
      }

      // Execute live Paystack Transfer
      try {
        const transferRes = await axios.post(
          `${PAYSTACK_BASE}/transfer`,
          {
            source: 'balance', // Debited from Paystack merchant balance
            amount: payoutAmountInPesewas, // 97% net
            recipient: recipientCode,
            reason: `Payout for Order #${order._id.toString().slice(-6)} (Campus Marketplace)`,
          },
          { headers: paystackHeaders() }
        );

        const transferData = transferRes.data?.data;
        const transferCode = transferData?.transfer_code || transferData?.reference || 'TRF_SUCCESS';

        order.escrowStatus = ESCROW_STATUS.PAID_OUT;
        order.paymentStatus = PAYMENT_STATUS.RELEASED;
        order.payoutProcessedAt = new Date();
        order.paystackTransferReference = transferCode;
        await order.save();

        console.log(`[PAYOUT CRON SUCCESS] ✅ Transferred GH₵${payoutAmountGHS} to Seller ${seller.firstName} (Ref: ${transferCode}) for Order #${order._id}`);

        createNotification({
          userId: seller._id,
          type: 'order_update',
          title: 'Payout Transferred 🎉',
          message: `GH₵${payoutAmountGHS.toLocaleString()} has been sent to your ${seller.payoutDetails.bankCode} account (${seller.payoutDetails.accountNumber}). Transfer ref: ${transferCode}.`,
          data: { orderId: order._id },
        });
      } catch (transferErr) {
        console.error(
          `[PAYOUT CRON ERROR] ❌ Failed transfer for Order ${order._id}:`,
          transferErr.response?.data || transferErr.message
        );
      }
    }
  } catch (err) {
    console.error('[PAYOUT CRON UNCAUGHT ERROR]:', err.message);
  }
};

/**
 * Initialize the cron scheduler.
 * Runs every 10 minutes by default (or every minute in development if configured).
 */
const initPayoutWorker = () => {
  const cronExpression = process.env.PAYOUT_CRON_SCHEDULE || '*/10 * * * *';
  console.log(`[PAYOUT WORKER] 🚀 Initialized with schedule: "${cronExpression}"`);

  cron.schedule(cronExpression, () => {
    processAutomatedPayouts();
  });

  // Run an initial scan on startup (after 5 seconds)
  setTimeout(() => {
    processAutomatedPayouts();
  }, 5000);
};

module.exports = {
  initPayoutWorker,
  processAutomatedPayouts,
};

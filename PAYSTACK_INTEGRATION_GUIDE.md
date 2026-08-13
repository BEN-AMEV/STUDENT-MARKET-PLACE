# Paystack Integration Guide: Escrow & Automated 24-Hour Seller Payout System

This guide provides an end-to-end blueprint for implementing Paystack in an **Online Student Marketplace** with:
1. **100% Inflow to Main Marketplace Account** (Funds held in secure escrow).
2. **3% Platform Commission Deduction** upon successful payment.
3. **Automated 24-Hour Escrow Hold Window** for dispute resolution / buyer-seller protection.
4. **Automatic Seller Payout via Paystack Transfers API** (Mobile Money / Bank) once 24 hours elapse without complaint.
5. **Dispute & Hold Mechanism** to freeze payouts if a buyer or seller files a complaint.

---

## Table of Contents
1. [System Architecture & Escrow Lifecycle](#1-system-architecture--escrow-lifecycle)
2. [Database Schema (Orders, Payouts, Disputes, Sellers)](#2-database-schema)
3. [Step 1: Seller Onboarding & Paystack Transfer Recipient](#step-1-seller-onboarding--paystack-transfer-recipient)
4. [Step 2: Customer Checkout & Payment Collection (100% to Platform)](#step-2-customer-checkout--payment-collection)
5. [Step 3: Server Verification & Scheduling 24-Hour Escrow](#step-3-server-verification--scheduling-24-hour-escrow)
6. [Step 4: Complaint & Dispute Window (Freeze Payouts)](#step-4-complaint--dispute-window)
7. [Step 5: Automated 24-Hour Cron Job (Paystack Transfer Payout)](#step-5-automated-24-hour-cron-job)
8. [Step 6: Webhook Handling (`charge.success` & `transfer.success`)](#step-6-webhook-handling)
9. [Ghana Mobile Money / Bank Codes Reference](#9-ghana-mobile-money--bank-codes-reference)
10. [Testing & Sandboxing Instructions](#10-testing--sandboxing-instructions)

---

## 1. System Architecture & Escrow Lifecycle

```
[Student Buyer]                 [Marketplace Platform]                [Student Seller]
       │                                  │                                  │
       │─── 1. Pays Total (e.g. GH₵100) ─>│                                  │
       │    (Held in Escrow on Paystack)  │                                  │
       │                                  │── Platform Fee: 3% (GH₵3)        │
       │                                  │── Seller Net: 97% (GH₵97)        │
       │                                  │── Start 24h Countdown Timer      │
       │                                  │                                  │
       │ <─────── 24-HOUR DISPUTE / COMPLAINT WINDOW ────────>               │
       │                                  │                                  │
       │ [Case A: Complaint Raised]       │                                  │
       │─── File complaint within 24h ───>│── Set status: DISPUTED / ON_HOLD │
       │                                  │── Freeze payout for Admin Review │
       │                                  │                                  │
       │ [Case B: No Complaint (Default)] │                                  │
       │                                  │── 24 Hours Elapse ──────────────>│
       │                                  │── Automated Cron Worker triggers │
       │                                  │── Paystack Transfers API ───────>│
       │                                  │   (Sends GH₵97 to MoMo/Bank)     │
       │                                  │                                  │
```

---

## 2. Database Schema

Here is the recommended schema model (e.g. Mongoose/MongoDB, PostgreSQL, or MySQL) to support the escrow workflow:

### A. User / Seller Schema
```javascript
// models/User.js
const userSchema = {
    name: String,
    email: String,
    role: { type: String, enum: ['BUYER', 'SELLER', 'ADMIN'], default: 'BUYER' },
    
    // Seller Payout Information
    payoutDetails: {
        paymentType: { type: String, enum: ['mobile_money', 'nuban'], default: 'mobile_money' },
        accountNumber: String, // e.g. "024XXXXXXX" (MoMo number)
        bankCode: String,      // e.g. "MTN", "VOD", "ATL", or Bank Code
        accountName: String,
        paystackRecipientCode: String // e.g. "RCP_2x4t5..." (Created via Paystack API)
    }
};
```

### B. Order & Escrow Schema
```javascript
// models/Order.js
const orderSchema = {
    buyer: { type: ObjectId, ref: 'User' },
    seller: { type: ObjectId, ref: 'User' },
    items: [{
        product: { type: ObjectId, ref: 'Product' },
        quantity: Number,
        unitPrice: Number
    }],
    totalAmount: Number,        // e.g. 100.00
    platformFeePct: { type: Number, default: 3.0 }, // 3%
    platformFeeAmount: Number,  // e.g. 3.00
    sellerPayoutAmount: Number, // e.g. 97.00

    paymentStatus: { 
        type: String, 
        enum: ['PENDING', 'PAID', 'REFUNDED'], 
        default: 'PENDING' 
    },
    paystackReference: String,
    
    // Escrow & Payout Controls
    escrowStatus: {
        type: String,
        enum: ['HOLDING', 'ELIGIBLE_FOR_PAYOUT', 'DISPUTED', 'PAID_OUT', 'CANCELLED'],
        default: 'HOLDING'
    },
    paidAt: Date,
    payoutEligibleAt: Date, // Exactly 24 hours after payment/delivery
    payoutProcessedAt: Date,
    paystackTransferReference: String,

    hasComplaint: { type: Boolean, default: false },
    disputeReason: String,
    disputeFiledBy: { type: ObjectId, ref: 'User' }
};
```

---

## 3. Step 1: Seller Onboarding & Paystack Transfer Recipient

Before a student can sell products, create a **Paystack Transfer Recipient** for their Mobile Money or Bank account. This generates an `RCP_...` code used for one-click automated transfers.

```javascript
// server/controllers/sellerController.js
const axios = require('axios');
const User = require('../models/User');

exports.setupSellerPayout = async (req, res) => {
    try {
        const { accountNumber, bankCode, accountName } = req.body;
        const sellerId = req.user.id;

        // 1. Create Transfer Recipient on Paystack
        const response = await axios.post(
            'https://api.paystack.co/transferrecipient',
            {
                type: "mobile_money", // or "nuban" for regular bank accounts
                name: accountName,
                account_number: accountNumber,
                bank_code: bankCode, // "MTN", "VOD", "ATL" in Ghana
                currency: "GHS"     // or "NGN"
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const recipientCode = response.data.data.recipient_code; // e.g. RCP_67xxyyzz...

        // 2. Save recipient code in Seller profile
        await User.findByIdAndUpdate(sellerId, {
            role: 'SELLER',
            'payoutDetails.paymentType': 'mobile_money',
            'payoutDetails.accountNumber': accountNumber,
            'payoutDetails.bankCode': bankCode,
            'payoutDetails.accountName': accountName,
            'payoutDetails.paystackRecipientCode': recipientCode
        });

        res.json({ success: true, message: 'Seller payout account connected successfully', recipientCode });
    } catch (err) {
        console.error('Paystack Recipient Error:', err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Failed to configure seller payout account' });
    }
};
```

---

## 4. Step 2: Customer Checkout & Payment Collection

The customer pays 100% of the total amount into the marketplace's primary Paystack account.

### Frontend Checkout (`checkout.js`):
```javascript
async function payForOrder(orderId, studentEmail, totalAmountGHS) {
    const handler = PaystackPop.setup({
        key: 'pk_test_YOUR_PUBLIC_KEY',
        email: studentEmail,
        amount: Math.round(totalAmountGHS * 100), // Convert GHS to Pesewas
        currency: 'GHS',
        ref: 'MKT_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        metadata: {
            custom_fields: [
                { display_name: "Order ID", variable_name: "order_id", value: orderId }
            ]
        },
        callback: async function (response) {
            // Inform server to verify payment and begin 24h countdown
            const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: response.reference, orderId: orderId })
            });

            const result = await verifyRes.json();
            if (result.success) {
                window.location.href = `/order-status.html?orderId=${orderId}`;
            } else {
                alert('Payment verification failed: ' + result.message);
            }
        },
        onClose: function () {
            alert('Payment window closed.');
        }
    });

    handler.openIframe();
}
```

---

## 5. Step 3: Server Verification & Scheduling 24-Hour Escrow

When payment succeeds, calculate the **3% fee** and set the `payoutEligibleAt` timestamp to **24 hours in the future**.

```javascript
// server/controllers/paymentController.js
const axios = require('axios');
const Order = require('../models/Order');

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, orderId } = req.body;

        // 1. Verify with Paystack API
        const paystackRes = await axios.get(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
            }
        );

        const data = paystackRes.data.data;

        if (data.status === 'success') {
            const order = await Order.findById(orderId);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            if (order.paymentStatus !== 'PAID') {
                const total = order.totalAmount;
                const platformFee = +(total * 0.03).toFixed(2); // 3% Platform Fee
                const sellerNet = +(total - platformFee).toFixed(2); // 97% Seller Net

                const now = new Date();
                const eligibleAfter24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

                order.paymentStatus = 'PAID';
                order.platformFeeAmount = platformFee;
                order.sellerPayoutAmount = sellerNet;
                order.escrowStatus = 'HOLDING';
                order.paidAt = now;
                order.payoutEligibleAt = eligibleAfter24Hours;
                order.paystackReference = reference;

                await order.save();
            }

            return res.json({ 
                success: true, 
                message: 'Payment received. Funds placed in 24h escrow.',
                payoutEligibleAt: order.payoutEligibleAt
            });
        }

        res.status(400).json({ success: false, message: 'Transaction unverified' });
    } catch (err) {
        console.error('Verification error:', err.message);
        res.status(500).json({ success: false, message: 'Verification error' });
    }
};
```

---

## 6. Step 4: Complaint & Dispute Window

If either buyer or seller files a complaint within 24 hours, the payout is automatically frozen:

```javascript
// server/controllers/disputeController.js
const Order = require('../models/Order');

exports.fileComplaint = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.escrowStatus === 'PAID_OUT') {
            return res.status(400).json({ success: false, message: 'Payout has already been executed for this order' });
        }

        // Freeze escrow payout
        order.hasComplaint = true;
        order.escrowStatus = 'DISPUTED';
        order.disputeReason = reason;
        order.disputeFiledBy = userId;
        await order.save();

        // Notify admins for arbitration
        console.log(`[ALERT] Dispute filed on Order ${orderId}: ${reason}`);

        res.json({ success: true, message: 'Complaint registered. Payout is on hold pending resolution.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
```

---

## 7. Step 5: Automated 24-Hour Cron Job

Use `node-cron` to scan the database periodically (e.g. every 10 minutes) for orders whose 24-hour hold period has expired without complaint.

### Install `node-cron`:
```bash
npm install node-cron
```

### Background Payout Worker (`server/workers/payoutWorker.js`):
```javascript
const cron = require('node-cron');
const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');

// Runs every 10 minutes: '*/10 * * * *'
cron.schedule('*/10 * * * *', async () => {
    console.log('[CRON] Scanning for orders eligible for 24-hour seller payout...');

    try {
        const now = new Date();

        // Find all orders where:
        // 1. Payment is PAID
        // 2. Escrow status is HOLDING
        // 3. 24 hours have passed (payoutEligibleAt <= now)
        // 4. No complaints filed (hasComplaint === false)
        const eligibleOrders = await Order.find({
            paymentStatus: 'PAID',
            escrowStatus: 'HOLDING',
            hasComplaint: false,
            payoutEligibleAt: { $lte: now }
        }).populate('seller');

        console.log(`[CRON] Found ${eligibleOrders.length} eligible orders for payout.`);

        for (const order of eligibleOrders) {
            const seller = order.seller;

            if (!seller || !seller.payoutDetails?.paystackRecipientCode) {
                console.error(`[CRON ERROR] Seller for order ${order._id} has no Paystack Recipient Code.`);
                continue;
            }

            const payoutAmountInPesewas = Math.round(order.sellerPayoutAmount * 100);

            try {
                // Execute Paystack Transfer
                const transferRes = await axios.post(
                    'https://api.paystack.co/transfer',
                    {
                        source: 'balance', // Debited from your Paystack account balance
                        amount: payoutAmountInPesewas, // 97% of total
                        recipient: seller.payoutDetails.paystackRecipientCode,
                        reason: `Payout for Order #${order._id} (Campus Marketplace)`
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const transferData = transferRes.data.data;

                // Update Order status
                order.escrowStatus = 'PAID_OUT';
                order.payoutProcessedAt = new Date();
                order.paystackTransferReference = transferData.transfer_code;
                await order.save();

                console.log(`[CRON SUCCESS] Transferred GH₵${order.sellerPayoutAmount} to Seller (${seller.name}) for Order #${order._id}`);

            } catch (transferErr) {
                console.error(`[CRON TRANSFER FAILED] Order ${order._id}:`, transferErr.response?.data || transferErr.message);
            }
        }
    } catch (err) {
        console.error('[CRON ERROR]', err);
    }
});
```

---

## 8. Step 6: Webhook Handling

Paystack sends webhooks for transfer statuses (`transfer.success`, `transfer.failed`, `transfer.reversed`).

```javascript
// server/routes/webhook.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Order = require('../models/Order');

router.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // 1. Verify HMAC Signature
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(req.body)
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString());

    // 2. Transfer Succeeded Event
    if (event.event === 'transfer.success') {
        const transferCode = event.data.transfer_code;
        console.log(`[WEBHOOK] Transfer ${transferCode} completed successfully.`);
    }

    // 3. Transfer Failed / Reversed Event (Retry / Alert Admin)
    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
        const transferCode = event.data.transfer_code;
        console.error(`[WEBHOOK ALERT] Transfer ${transferCode} failed or reversed!`);
        await Order.findOneAndUpdate(
            { paystackTransferReference: transferCode },
            { escrowStatus: 'HOLDING' } // Revert so it can be investigated or retried
        );
    }

    res.sendStatus(200);
});

module.exports = router;
```

---

## 9. Ghana Mobile Money / Bank Codes Reference

When creating a Transfer Recipient on Paystack in Ghana:

| Provider | `bank_code` | `type` |
| :--- | :--- | :--- |
| **MTN Mobile Money** | `MTN` | `mobile_money` |
| **Telecel Cash (Vodafone)** | `VOD` | `mobile_money` |
| **AirtelTigo Money** | `ATL` | `mobile_money` |
| **Commercial Banks (GCB, Ecobank, CalBank, etc.)** | Use Paystack Bank List API (`GET https://api.paystack.co/bank?country=ghana`) | `nuban` |

---

## 10. Testing & Sandboxing Instructions

### 1. Paystack Transfers in Test Mode:
- In test mode, Paystack gives your balance fictitious test funds so you can execute test transfers without real money.
- Go to **Paystack Dashboard -> Settings -> Preferences -> Transfers** and disable OTP requirements for automated transfers in test mode.

### 2. Fast-Forwarding 24 Hours in Development:
During testing, you don't need to wait 24 real hours. In your test environment, configure an environment variable or change:
```javascript
// Test mode: 1 minute hold instead of 24 hours
const holdDurationMs = process.env.NODE_ENV === 'production' 
    ? 24 * 60 * 60 * 1000 
    : 60 * 1000; // 1 minute in dev

order.payoutEligibleAt = new Date(now.getTime() + holdDurationMs);
```

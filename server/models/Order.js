const mongoose = require('mongoose');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ESCROW_STATUS,
  PLATFORM_FEE_PCT,
} = require('../config/constants');

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
    },
    platformFeePct: {
      type: Number,
      default: PLATFORM_FEE_PCT || 3.0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
    },
    sellerPayoutAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
    },

    // ─── Escrow & 24-Hour Payout Lifecycle ─────────────────────────
    escrowStatus: {
      type: String,
      enum: Object.values(ESCROW_STATUS),
      default: ESCROW_STATUS.HOLDING,
    },
    payoutEligibleAt: {
      type: Date,
    },
    payoutProcessedAt: {
      type: Date,
    },
    paystackTransferReference: {
      type: String,
      default: '',
    },

    // ─── Complaint & Dispute Mechanism ─────────────────────────────
    hasComplaint: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
      default: '',
    },
    disputeFiledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disputeEvidence: [
      {
        type: { type: String, enum: ['text', 'image'] },
        content: String,
      },
    ],
    disputeResolution: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Timestamps for status transitions
    paidAt: Date,
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    disputedAt: Date,
    resolvedAt: Date,

    // Admin fields
    adminNote: { type: String, default: '' },

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for populating related data
orderSchema.virtual('buyer', {
  ref: 'User',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true,
});

orderSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true,
});

orderSchema.virtual('listing', {
  ref: 'Listing',
  localField: 'listingId',
  foreignField: '_id',
  justOne: true,
});

// Indexes
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);

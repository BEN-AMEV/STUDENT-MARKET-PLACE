const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Flexible data payload for linking to related entities
    data: {
      listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

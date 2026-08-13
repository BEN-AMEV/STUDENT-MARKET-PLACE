const mongoose = require('mongoose');
const {
  LISTING_TYPE,
  LISTING_CONDITION,
  LISTING_STATUS,
} = require('../config/constants');

const listingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
    },
    type: {
      type: String,
      enum: Object.values(LISTING_TYPE),
      required: true,
    },
    condition: {
      type: String,
      enum: Object.values(LISTING_CONDITION),
      default: LISTING_CONDITION.NOT_APPLICABLE,
    },
    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
      index: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public ID for deletion
        thumbnail: { type: String },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Campus-specific tagging
    university: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    campus: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: function () {
        // 30 days from creation
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
    },
    moderationNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for full-text search
listingSchema.index({ title: 'text', description: 'text' });

// Compound indexes for common queries
listingSchema.index({ university: 1, category: 1, status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ sellerId: 1, status: 1 });

// Virtual: populate seller info
listingSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true,
});

// Check if listing is expired
listingSchema.methods.isExpired = function () {
  return this.expiresAt && new Date() > this.expiresAt;
};

module.exports = mongoose.model('Listing', listingSchema);

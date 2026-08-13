const mongoose = require('mongoose');
const { TAG_TYPE } = require('../config/constants');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: Object.values(TAG_TYPE),
      required: true,
    },
    university: {
      type: String,
      trim: true,
      default: '', // Empty = global tag
    },
    parentTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true, // System tags are auto-approved; custom tags need approval
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

tagSchema.index({ name: 1, university: 1 }, { unique: true });
tagSchema.index({ type: 1, isApproved: 1 });
tagSchema.index({ usageCount: -1 });

// Pre-save: generate slug from name
tagSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Tag', tagSchema);

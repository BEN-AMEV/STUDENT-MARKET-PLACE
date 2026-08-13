const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, VERIFICATION_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },

    // Seller Payout Information (Paystack Transfer Recipient for MoMo / Bank)
    payoutDetails: {
      paymentType: {
        type: String,
        enum: ['mobile_money', 'nuban'],
        default: 'mobile_money',
      },
      accountNumber: {
        type: String,
        trim: true,
        default: '',
      },
      bankCode: {
        type: String,
        trim: true,
        default: 'MTN',
      },
      accountName: {
        type: String,
        trim: true,
        default: '',
      },
      paystackRecipientCode: {
        type: String,
        trim: true,
        default: '',
      },
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
      select: false,
    },
    emailOtpExpiry: {
      type: Date,
      select: false,
    },

    // Student ID verification
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.NOT_SUBMITTED,
    },
    studentIdImageUrl: {
      type: String,
      default: '',
    },
    verificationNote: {
      type: String,
      default: '',
    },

    // Account status
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: '',
    },

    // Ratings
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
      select: false,
    },

    // Refresh token
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.emailOtp;
        delete ret.emailOtpExpiry;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpiry;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: is verified (email + student ID)
userSchema.virtual('isVerified').get(function () {
  return this.isEmailVerified && this.verificationStatus === VERIFICATION_STATUS.APPROVED;
});

// Pre-save: hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

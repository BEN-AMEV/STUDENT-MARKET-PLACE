const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { VERIFICATION_STATUS, LISTING_STATUS } = require('../config/constants');
const path = require('path');
const fs = require('fs');

// Cloudinary support (optional — only if env vars are set)
let cloudinary = null;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Helper: upload a file — either to Cloudinary or serve it locally.
 * Returns the public URL of the uploaded file.
 */
const uploadFile = async (file, folder = 'avatars') => {
  if (cloudinary) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `student-marketplace/${folder}`,
      transformation: folder === 'avatars'
        ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        : [{ width: 800, quality: 'auto' }],
    });
    // Remove temp file after Cloudinary upload
    fs.unlink(file.path, () => {});
    return result.secure_url;
  }

  // Local fallback — file is already saved by multer to uploads/<folder>
  const relativePath = path.posix.join('/uploads', folder, file.filename);
  return relativePath;
};

// ─── GET  /api/users/me ────────────────────────────────────────
// Get current user profile (already partly handled by auth middleware)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── PUT  /api/users/me ────────────────────────────────────────
// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'department', 'year', 'bio', 'whatsappNumber'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── POST /api/users/me/avatar ─────────────────────────────────
// Upload / update avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const avatarUrl = await uploadFile(req.file, 'avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    );

    res.json({ success: true, message: 'Avatar updated.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed.', error: error.message });
  }
};

// ─── POST /api/users/me/verify-student ─────────────────────────
// Submit student ID for verification
const verifyStudent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No student ID image provided.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Don't allow re-submission if already approved
    if (user.verificationStatus === VERIFICATION_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Your student ID is already verified.',
      });
    }

    const studentIdImageUrl = await uploadFile(req.file, 'student-ids');

    user.studentIdImageUrl = studentIdImageUrl;
    user.verificationStatus = VERIFICATION_STATUS.PENDING;
    user.verificationNote = '';
    await user.save();

    res.json({
      success: true,
      message: 'Student ID submitted for verification.',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed.', error: error.message });
  }
};

// ─── POST /api/users/me/payout-account ────────────────────────
// Setup or update seller's Paystack Transfer Recipient (Mobile Money or Bank Account)
const setupPayoutAccount = async (req, res) => {
  try {
    const axios = require('axios');
    const { accountNumber, bankCode = 'MTN', accountName, paymentType = 'mobile_money' } = req.body;

    if (!accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'Account number and account name are required.',
      });
    }

    let recipientCode = '';
    const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();

    if (secretKey) {
      try {
        const response = await axios.post(
          'https://api.paystack.co/transferrecipient',
          {
            type: paymentType, // 'mobile_money' or 'nuban'
            name: accountName.trim(),
            account_number: accountNumber.trim(),
            bank_code: bankCode.trim(),
            currency: 'GHS',
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        recipientCode = response.data?.data?.recipient_code || '';
      } catch (paystackErr) {
        console.error('Paystack Recipient Creation Error:', paystackErr.response?.data || paystackErr.message);
        const errMsg = paystackErr.response?.data?.message || 'Failed to create Paystack Transfer Recipient.';
        return res.status(400).json({
          success: false,
          message: errMsg,
        });
      }
    } else {
      // Mock recipient code for local dev/testing without Paystack key
      recipientCode = `RCP_MOCK_${Date.now()}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        'payoutDetails.paymentType': paymentType,
        'payoutDetails.accountNumber': accountNumber.trim(),
        'payoutDetails.bankCode': bankCode.trim(),
        'payoutDetails.accountName': accountName.trim(),
        'payoutDetails.paystackRecipientCode': recipientCode,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Seller payout account configured successfully.',
      data: {
        payoutDetails: updatedUser.payoutDetails,
        recipientCode,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── GET /api/users/me/payout-account ─────────────────────────
// Get current user's payout account details
const getPayoutAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('payoutDetails');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      data: user.payoutDetails || {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── GET  /api/users/:id ──────────────────────────────────────
// Get public profile of another user
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'firstName lastName university department year avatarUrl bio avgRating reviewCount verificationStatus whatsappNumber createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── GET  /api/users/:id/listings ──────────────────────────────
// Get a user's active listings
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      sellerId: req.params.id,
      status: LISTING_STATUS.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── GET  /api/users/:id/reviews ───────────────────────────────
// Get reviews received by a user
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      revieweeId: req.params.id,
      isHidden: false,
    })
      .populate('reviewerId', 'firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── DELETE /api/users/me ──────────────────────────────────────
// Delete current user's account and all associated data
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lazy-require models to avoid circular dependency issues
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');

    // Delete all data associated with this user
    await Promise.all([
      Listing.deleteMany({ sellerId: userId }),
      Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] }),
      Order.deleteMany({ $or: [{ buyerId: userId }, { sellerId: userId }] }),
      Notification.deleteMany({ userId }),
    ]);

    // Delete the user itself
    await User.findByIdAndDelete(userId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account.', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  verifyStudent,
  setupPayoutAccount,
  getPayoutAccount,
  getPublicProfile,
  getUserListings,
  getUserReviews,
  deleteAccount,
};

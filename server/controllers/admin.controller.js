const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const { createNotification } = require('./notification.controller');
const { VERIFICATION_STATUS, LISTING_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * GET /api/admin/verifications
 * Fetch all users with pending student ID verification.
 */
const getPendingVerifications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    // Allow filtering by status (pending, approved, rejected, not_submitted)
    const validStatuses = Object.values(VERIFICATION_STATUS);
    const filterStatus = validStatuses.includes(status) ? status : 'pending';

    const users = await User.find({ verificationStatus: filterStatus })
      .select(
        'firstName lastName email university department year studentId studentIdImageUrl verificationStatus verificationNote createdAt updatedAt'
      )
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/verifications/:id
 * Approve or reject a student's verification.
 * Body: { action: 'approve' | 'reject', note?: string }
 */
const reviewVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'reject'.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.verificationStatus !== VERIFICATION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Cannot review — user verification status is '${user.verificationStatus}', not 'pending'.`,
      });
    }

    if (action === 'approve') {
      user.verificationStatus = VERIFICATION_STATUS.APPROVED;
      user.isEmailVerified = true;
      user.verificationNote = note || 'Verified by admin.';
    } else {
      user.verificationStatus = VERIFICATION_STATUS.REJECTED;
      user.verificationNote = note || 'Verification rejected.';
    }

    await user.save();

    res.json({
      success: true,
      message: `User verification ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationStatus: user.verificationStatus,
        verificationNote: user.verificationNote,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * List all users with optional search & filter.
 * Query params: search, university, role, suspended, page, limit
 */
const getUsers = async (req, res, next) => {
  try {
    const {
      search,
      university,
      role,
      suspended,
      verificationStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (university) filter.university = university;
    if (role) filter.role = role;
    if (suspended !== undefined) filter.isSuspended = suspended === 'true';
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          'firstName lastName email university department year role verificationStatus isSuspended suspensionReason avgRating reviewCount createdAt'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
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

/**
 * PATCH /api/admin/users/:id
 * Suspend or unsuspend a user.
 * Body: { action: 'suspend' | 'unsuspend', reason?: string }
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action || !['suspend', 'unsuspend'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'suspend' or 'unsuspend'.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent suspending another admin
    if (user.role === 'admin' && action === 'suspend') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend another admin account.',
      });
    }

    user.isSuspended = action === 'suspend';
    user.suspensionReason = action === 'suspend' ? (reason || 'Suspended by admin.') : '';
    await user.save();

    res.json({
      success: true,
      message: `User ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully.`,
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/listings
 * Paginated list of all listings (any status) for moderation.
 * Query params: status, university, search, page, limit
 */
const getAdminListings = async (req, res, next) => {
  try {
    const {
      status,
      university,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    // Exclude hard-deleted unless explicitly requested
    if (!status) filter.status = { $ne: LISTING_STATUS.DELETED };
    if (university) filter.university = university;
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'firstName lastName email university verificationStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: listings,
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

/**
 * PATCH /api/admin/listings/:id
 * Moderate a listing: flag, approve (re-activate), or remove.
 * Body: { action: 'approve' | 'flag' | 'remove' }
 */
const moderateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const validActions = ['approve', 'flag', 'remove'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const statusMap = {
      approve: LISTING_STATUS.ACTIVE,
      flag: LISTING_STATUS.PAUSED,
      remove: LISTING_STATUS.DELETED,
    };

    listing.status = statusMap[action];
    if (reason) listing.moderationNote = reason;
    await listing.save();

    res.json({
      success: true,
      message: `Listing ${action}d successfully.`,
      data: { _id: listing._id, status: listing.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics/overview
 * Quick platform stats for the admin dashboard.
 */
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      totalListings,
      activeListings,
      newUsersThisMonth,
      newListingsThisMonth,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ verificationStatus: VERIFICATION_STATUS.APPROVED }),
      User.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
      Listing.countDocuments({ status: { $ne: LISTING_STATUS.DELETED } }),
      Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Listing.countDocuments({
        createdAt: { $gte: startOfMonth },
        status: { $ne: LISTING_STATUS.DELETED },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        totalListings,
        activeListings,
        newUsersThisMonth,
        newListingsThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingVerifications,
  reviewVerification,
  getUsers,
  updateUserStatus,
  getAdminListings,
  moderateListing,
  getAnalytics,
  getDisputes,
  resolveDispute,
};

// ─────────────────────────────────────────────────────────────
// DISPUTE MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/disputes
 * Returns all DISPUTED orders, newest first.
 * Query: { page, limit }
 */
async function getDisputes(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || 1));
    const limit  = Math.min(50, parseInt(req.query.limit || 20));
    const skip   = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      Order.find({ orderStatus: ORDER_STATUS.DISPUTED })
        .populate('buyerId',  'firstName lastName email avatarUrl university')
        .populate('sellerId', 'firstName lastName email avatarUrl university')
        .populate('listingId', 'title price images')
        .sort({ disputedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ orderStatus: ORDER_STATUS.DISPUTED }),
    ]);

    // Normalise populated fields to friendly names
    const data = disputes.map(o => ({
      ...o,
      buyer:   o.buyerId,
      seller:  o.sellerId,
      listing: o.listingId,
    }));

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/disputes/:id
 * Resolve a dispute.
 * Body: { resolution: 'refund_buyer' | 'release_to_seller', note? }
 *
 * refund_buyer    → order REFUNDED, listing back to ACTIVE
 * release_to_seller → order COMPLETED, listing SOLD
 */
async function resolveDispute(req, res, next) {
  try {
    const { resolution, note = '' } = req.body;

    if (!['refund_buyer', 'release_to_seller'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'resolution must be “refund_buyer” or “release_to_seller”.',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('buyerId',  'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .populate('listingId', 'title');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.orderStatus !== ORDER_STATUS.DISPUTED) {
      return res.status(409).json({ success: false, message: 'Order is not currently disputed.' });
    }

    const listingTitle = order.listingId?.title || 'the item';

    const { ESCROW_STATUS } = require('../config/constants');

    if (resolution === 'refund_buyer') {
      order.orderStatus   = ORDER_STATUS.REFUNDED;
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      order.escrowStatus  = ESCROW_STATUS.CANCELLED;
      order.hasComplaint  = false;
      order.adminNote     = note.trim();
      order.resolvedAt    = new Date();
      await order.save();

      // Restore listing to ACTIVE
      await Listing.findByIdAndUpdate(order.listingId, { status: LISTING_STATUS.ACTIVE });

      // Notify both parties
      createNotification({
        userId: order.buyerId._id,
        type: 'dispute_update',
        title: 'Dispute Resolved — Refund Approved',
        message: `Your dispute for “${listingTitle}” was reviewed. A refund has been approved. GHS ${(order.amount + (order.platformFee || 0)).toLocaleString()} will be returned to your account.`,
        data: { orderId: order._id },
      });
      createNotification({
        userId: order.sellerId._id,
        type: 'dispute_update',
        title: 'Dispute Resolved',
        message: `The dispute for “${listingTitle}” was resolved in the buyer’s favour. The listing has been relisted.${note ? ` Admin note: ${note}` : ''}`,
        data: { orderId: order._id },
      });
    } else {
      order.orderStatus   = ORDER_STATUS.COMPLETED;
      order.paymentStatus = PAYMENT_STATUS.RELEASED;
      order.escrowStatus  = ESCROW_STATUS.ELIGIBLE_FOR_PAYOUT;
      order.payoutEligibleAt = new Date();
      order.hasComplaint  = false;
      order.adminNote     = note.trim();
      order.resolvedAt    = new Date();
      await order.save();

      await Listing.findByIdAndUpdate(order.listingId, { status: LISTING_STATUS.SOLD });

      createNotification({
        userId: order.sellerId._id,
        type: 'dispute_update',
        title: 'Dispute Resolved — Payment Released',
        message: `The dispute for “${listingTitle}” was reviewed and resolved in your favour. Funds have been released.`,
        data: { orderId: order._id },
      });
      createNotification({
        userId: order.buyerId._id,
        type: 'dispute_update',
        title: 'Dispute Resolved',
        message: `The dispute for “${listingTitle}” was resolved in the seller’s favour.${note ? ` Admin note: ${note}` : ''}`,
        data: { orderId: order._id },
      });
    }

    res.json({
      success: true,
      message: `Dispute resolved: ${resolution.replace('_', ' ')}.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

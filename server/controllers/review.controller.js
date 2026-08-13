const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('./notification.controller');
const { ORDER_STATUS, PAGINATION } = require('../config/constants');

// ─── Shared populate ───────────────────────────────────────────────────────────
const REVIEW_POPULATE = [
  {
    path: 'reviewer',
    select: 'firstName lastName avatarUrl university',
    options: { strictPopulate: false },
  },
  {
    path: 'reviewee',
    select: 'firstName lastName avatarUrl university avgRating reviewCount',
    options: { strictPopulate: false },
  },
];

// ─── Helper: recalculate and persist avgRating + reviewCount on a User ────────
const recalcUserRating = async (userId) => {
  const stats = await Review.aggregate([
    { $match: { revieweeId: userId, isHidden: false } },
    {
      $group: {
        _id: '$revieweeId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const { avgRating = 0, reviewCount = 0 } = stats[0] || {};
  await User.findByIdAndUpdate(userId, {
    avgRating: parseFloat(avgRating.toFixed(2)),
    reviewCount,
  });
};

// ─── POST /api/reviews ─────────────────────────────────────────────────────────
/**
 * Leave a review for a seller after a completed order.
 * Body: { orderId, rating (1-5), comment? }
 * Rules:
 *   - Order must be COMPLETED
 *   - Reviewer must be the buyer on that order
 *   - One review per buyer per order (enforced by unique index)
 */
const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5.' });
    }

    // Verify the order exists and is completed
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.orderStatus !== ORDER_STATUS.COMPLETED) {
      return res.status(403).json({
        success: false,
        message: 'You can only review a seller after the order is completed.',
      });
    }
    // Only the buyer may leave a review
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can leave a review for this order.',
      });
    }

    const review = await Review.create({
      reviewerId: req.user._id,
      revieweeId: order.sellerId,
      orderId,
      rating: Number(rating),
      comment: comment?.trim() || '',
    });

    // Update seller's aggregate rating
    await recalcUserRating(order.sellerId);
    await review.populate(REVIEW_POPULATE);

    // Notify the seller about the new review
    createNotification({
      userId: order.sellerId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${req.user.firstName} left you a ${rating}-star review. Check your profile to respond.`,
      data: { userId: req.user._id },
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: review,
    });
  } catch (error) {
    // Duplicate review (unique index violation)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already left a review for this order.',
      });
    }
    next(error);
  }
};

// ─── GET /api/reviews/user/:userId ────────────────────────────────────────────
/**
 * Get all visible reviews received by a user (their seller reviews).
 * Query: { page, limit }
 */
const getUserReviews = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      revieweeId: req.params.userId,
      isHidden: false,
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate(REVIEW_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Compute aggregate stats for the response header
    const stats = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          dist: {
            $push: '$rating',
          },
        },
      },
    ]);

    const ratingStats = stats[0] || { avgRating: 0, count: 0, dist: [] };
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratingStats.dist.filter((r) => r === star).length,
    }));

    res.json({
      success: true,
      data: reviews,
      stats: {
        avgRating: parseFloat((ratingStats.avgRating || 0).toFixed(2)),
        total: ratingStats.count,
        distribution,
      },
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

// ─── POST /api/reviews/:id/respond ────────────────────────────────────────────
/**
 * Seller responds to a review.
 * Body: { response }
 * Rules:
 *   - Only the reviewee (seller) may respond
 *   - One response per review (cannot overwrite)
 */
const respondToReview = async (req, res, next) => {
  try {
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ success: false, message: 'A response message is required.' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Only the reviewee (seller) may respond
    if (review.revieweeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewed seller can respond to this review.',
      });
    }

    if (review.sellerResponse) {
      return res.status(409).json({
        success: false,
        message: 'You have already responded to this review.',
      });
    }

    review.sellerResponse = response.trim();
    review.sellerRespondedAt = new Date();
    await review.save();

    await review.populate(REVIEW_POPULATE);

    res.json({
      success: true,
      message: 'Response submitted.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reviews/order/:orderId/mine ──────────────────────────────────────
/**
 * Check if the current user has already reviewed a specific order.
 * Returns { reviewed: bool, review: Review|null }
 */
const getMyReviewForOrder = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      reviewerId: req.user._id,
      orderId: req.params.orderId,
    }).lean();

    res.json({
      success: true,
      data: { reviewed: !!review, review: review || null },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
  respondToReview,
  getMyReviewForOrder,
};

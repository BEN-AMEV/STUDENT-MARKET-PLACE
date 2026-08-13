const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getUserReviews,
  respondToReview,
  getMyReviewForOrder,
} = require('../controllers/review.controller');

// POST   /api/reviews                          — leave a review (buyer, after completed order)
router.post('/', protect, createReview);

// GET    /api/reviews/user/:userId             — get reviews received by a user (public)
router.get('/user/:userId', getUserReviews);

// GET    /api/reviews/order/:orderId/mine      — check if current user reviewed this order
router.get('/order/:orderId/mine', protect, getMyReviewForOrder);

// POST   /api/reviews/:id/respond             — seller responds to a review
router.post('/:id/respond', protect, respondToReview);

module.exports = router;


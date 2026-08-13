const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getPendingVerifications,
  reviewVerification,
  getUsers,
  updateUserStatus,
  getAdminListings,
  moderateListing,
  getAnalytics,
  getDisputes,
  resolveDispute,
} = require('../controllers/admin.controller');

// All admin routes require authentication + admin role
router.use(protect, authorize(ROLES.ADMIN));

// ─── Verification Management ─────────────────────────────────────────
// GET /api/admin/verifications — List verifications (default: pending)
router.get('/verifications', getPendingVerifications);

// PATCH /api/admin/verifications/:id — Approve or reject a verification
router.patch('/verifications/:id', reviewVerification);

// ─── User Management ──────────────────────────────────────────────────
// GET /api/admin/users — Paginated list of all users
router.get('/users', getUsers);

// PATCH /api/admin/users/:id — Suspend or unsuspend a user
router.patch('/users/:id', updateUserStatus);

// ─── Listing Moderation ───────────────────────────────────────────────
// GET /api/admin/listings — All listings for moderation
router.get('/listings', getAdminListings);

// PATCH /api/admin/listings/:id — Flag, approve, or remove a listing
router.patch('/listings/:id', moderateListing);

// ─── Disputes ────────────────────────────────────────────────
// GET  /api/admin/disputes          — list all disputed orders
router.get('/disputes', getDisputes);

// PATCH /api/admin/disputes/:id     — resolve a dispute
router.patch('/disputes/:id', resolveDispute);

// ─── Analytics ────────────────────────────────────────────────────────
// GET /api/admin/analytics/overview — Platform stats
router.get('/analytics/overview', getAnalytics);

module.exports = router;

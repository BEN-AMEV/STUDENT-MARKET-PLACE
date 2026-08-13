const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, requireVerified, optionalAuth } = require('../middleware/auth');
const {
  validate,
  validateQuery,
  createListingSchema,
  updateListingSchema,
} = require('../middleware/validate');
const { UPLOAD } = require('../config/constants');
const {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
  updateListingStatus,
} = require('../controllers/listing.controller');

// ─── Multer Configuration (same pattern as user.routes.js) ────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', 'listings');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
});

// ─── Routes ───────────────────────────────────────────────────────────

// POST /api/listings — Create new listing (verified sellers only)
router.post(
  '/',
  protect,
  requireVerified,
  upload.array('images', UPLOAD.MAX_LISTING_IMAGES),
  validate(createListingSchema),
  createListing
);

// GET /api/listings — Browse / search listings (public)
router.get('/', optionalAuth, getListings);

// GET /api/listings/mine — Get authenticated user's own listings (verified sellers only)
router.get('/mine', protect, requireVerified, getMyListings);

// GET /api/listings/:id — Get single listing detail
router.get('/:id', optionalAuth, getListingById);

// PUT /api/listings/:id — Update listing (verified seller + owner only)
router.put('/:id', protect, requireVerified, validate(updateListingSchema), updateListing);

// DELETE /api/listings/:id — Soft-delete listing (verified seller + owner only)
router.delete('/:id', protect, requireVerified, deleteListing);

// PATCH /api/listings/:id/status — Update listing status (verified seller + owner only)
router.patch('/:id/status', protect, requireVerified, updateListingStatus);

module.exports = router;

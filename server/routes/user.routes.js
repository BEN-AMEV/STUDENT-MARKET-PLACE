const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../middleware/validate');
const {
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
} = require('../controllers/user.controller');
const { UPLOAD } = require('../config/constants');

// ─── Multer Configuration ─────────────────────────────────────────────
// Store files in uploads/<subfolder>/ — subfolders created dynamically.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.uploadFolder || 'misc';
    const dest = path.join(__dirname, '..', 'uploads', subfolder);
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

// Middleware to set the upload subfolder
const setUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────

// GET /api/users/me — Get current user profile
router.get('/me', protect, getProfile);

// PUT /api/users/me — Update profile
router.put('/me', protect, validate(updateProfileSchema), updateProfile);

// DELETE /api/users/me — Delete account
router.delete('/me', protect, deleteAccount);

// POST /api/users/me/avatar — Upload avatar
router.post('/me/avatar', protect, setUploadFolder('avatars'), upload.single('avatar'), uploadAvatar);

// POST /api/users/me/verify-student — Submit student ID
router.post('/me/verify-student', protect, setUploadFolder('student-ids'), upload.single('studentId'), verifyStudent);

// GET /api/users/me/payout-account — Get seller payout details
router.get('/me/payout-account', protect, getPayoutAccount);

// POST /api/users/me/payout-account — Setup Paystack Transfer Recipient for MoMo / Bank
router.post('/me/payout-account', protect, setupPayoutAccount);

// GET /api/users/:id — Get public profile
router.get('/:id', getPublicProfile);

// GET /api/users/:id/listings — Get user's listings
router.get('/:id/listings', getUserListings);

// GET /api/users/:id/reviews — Get user's reviews
router.get('/:id/reviews', getUserReviews);

module.exports = router;

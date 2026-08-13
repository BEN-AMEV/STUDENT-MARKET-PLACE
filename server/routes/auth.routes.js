const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validate');

// Apply auth rate limiting to all auth endpoints
router.use(authLimiter);

// POST /api/auth/register — Register new student
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/verify-email — Verify email with OTP
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// POST /api/auth/resend-otp — Resend verification OTP
router.post('/resend-otp', authController.resendOtp);

// POST /api/auth/login — Login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/google — Google Sign-In & Auto Sign-Up
router.post('/google', authController.googleAuth);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout — Logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password — Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password — Reset password with token
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;

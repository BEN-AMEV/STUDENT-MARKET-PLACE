const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware — verifies JWT access token
 * and attaches the user to the request object.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (exclude password)
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user not found.',
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token.',
    });
  }
};

/**
 * Authorization middleware — restricts access to specific roles.
 * Must be used AFTER the `protect` middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

/**
 * Verified seller middleware — restricts access to users whose
 * email is verified AND student ID verification is approved.
 * Must be used AFTER the `protect` middleware.
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized.',
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before selling.',
    });
  }

  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'You must be a verified seller to perform this action. Please submit your student ID for verification.',
    });
  }

  next();
};

/**
 * Optional auth middleware — attaches user if token is present,
 * but does not block the request if no token is provided.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    }
  } catch (error) {
    // Silently ignore — user remains unauthenticated
  }

  next();
};

module.exports = { protect, authorize, requireVerified, optionalAuth };

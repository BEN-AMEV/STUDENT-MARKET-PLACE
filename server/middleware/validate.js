const Joi = require('joi');

/**
 * Generic validation middleware factory.
 * Validates req.body against a Joi schema.
 *
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // Replace body with validated + sanitized values
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters against a schema.
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters.',
        errors,
      });
    }

    req.query = value;
    next();
  };
};

// ─── Auth Validation Schemas ──────────────────────────────────────────

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters.',
    'any.required': 'Password is required.',
  }),
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'any.required': 'First name is required.',
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    'any.required': 'Last name is required.',
  }),
  university: Joi.string().trim().min(1).max(200).required().messages({
    'any.required': 'University is required.',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be exactly 6 digits.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required(),
});

// ─── User Validation Schemas ──────────────────────────────────────────

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50),
  lastName: Joi.string().trim().min(1).max(50),
  department: Joi.string().trim().max(100).allow(''),
  year: Joi.string().trim().max(20).allow(''),
  bio: Joi.string().trim().max(500).allow(''),
  whatsappNumber: Joi.string().trim().max(20).allow(''),
});

// ─── Listing Validation Schemas ───────────────────────────────────────

const createListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters long.',
    'any.required': 'Title is required.',
  }),
  description: Joi.string().trim().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters long.',
    'any.required': 'Description is required.',
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative.',
    'any.required': 'Price is required.',
  }),
  currency: Joi.string().default('GHS'),
  type: Joi.string().valid('product', 'service').required(),
  condition: Joi.string().valid('new', 'like_new', 'used', 'n/a').default('n/a'),
  category: Joi.string().required().messages({
    'any.required': 'Category is required.',
  }),
  university: Joi.string().trim().allow(''),
  campus: Joi.string().trim().allow(''),
  department: Joi.string().trim().allow(''),
  pickupLocation: Joi.string().trim().max(200).allow(''),
  whatsappNumber: Joi.string().trim().max(20).allow(''),
  tags: Joi.array().items(Joi.string().trim()).max(10).default([]),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200),
  description: Joi.string().trim().min(10).max(5000),
  price: Joi.number().min(0),
  condition: Joi.string().valid('new', 'like_new', 'used', 'n/a'),
  category: Joi.string(),
  campus: Joi.string().trim().allow(''),
  department: Joi.string().trim().allow(''),
  pickupLocation: Joi.string().trim().max(200).allow(''),
  whatsappNumber: Joi.string().trim().max(20).allow(''),
  tags: Joi.array().items(Joi.string().trim()).max(10),
});

// ─── Listing Query Validation Schema ──────────────────────────────────

const listingQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(''),
  category: Joi.string().trim().allow(''),
  university: Joi.string().trim().allow(''),
  condition: Joi.string().valid('new', 'like_new', 'used', 'n/a').allow(''),
  type: Joi.string().valid('product', 'service').allow(''),
  minPrice: Joi.number().min(0).allow(''),
  maxPrice: Joi.number().min(0).allow(''),
  sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'popular').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─── Review Validation Schema ─────────────────────────────────────────

const createReviewSchema = Joi.object({
  orderId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow(''),
});

module.exports = {
  validate,
  validateQuery,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  createListingSchema,
  updateListingSchema,
  listingQuerySchema,
  createReviewSchema,
};

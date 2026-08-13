const Listing = require('../models/Listing');
const User = require('../models/User');
const { LISTING_STATUS, PAGINATION } = require('../config/constants');
const path = require('path');
const fs = require('fs');

// ─── Cloudinary Support (optional — same pattern as user.controller.js) ──
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
 * Helper: upload a single image file — Cloudinary or local fallback.
 * Returns { url, publicId, thumbnail }.
 */
const uploadListingImage = async (file) => {
  if (cloudinary) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'student-marketplace/listings',
      transformation: [{ width: 800, quality: 'auto' }],
    });
    // Generate thumbnail
    const thumbnail = cloudinary.url(result.public_id, {
      width: 300,
      height: 225,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    });
    // Remove temp file after Cloudinary upload
    fs.unlink(file.path, () => {});
    return {
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail,
    };
  }

  // Local fallback — file already saved by multer to uploads/listings/
  const relativePath = path.posix.join('/uploads', 'listings', file.filename);
  return {
    url: relativePath,
    publicId: null,
    thumbnail: relativePath,
  };
};

/**
 * Helper: delete a Cloudinary image by publicId.
 */
const deleteCloudinaryImage = async (publicId) => {
  if (cloudinary && publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete Cloudinary image:', err.message);
    }
  }
};

// ─── POST /api/listings ───────────────────────────────────────────────
// Create a new listing
const createListing = async (req, res, next) => {
  try {
    // Controller-level verification check
    if (!req.user.isEmailVerified || req.user.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'You must be a verified student seller to create a listing.',
      });
    }

    const {
      title, description, price, currency,
      type, condition, category, campus,
      department, pickupLocation, whatsappNumber, tags,
    } = req.body;

    // Upload images (if any)
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadListingImage(file);
        images.push(uploaded);
      }
    }

    const listing = await Listing.create({
      sellerId: req.user._id,
      title,
      description,
      price,
      currency: currency || 'GHS',
      type,
      condition,
      category,
      university: req.user.university, // Auto-set from authenticated user
      campus: campus || '',
      department: department || '',
      pickupLocation: pickupLocation || '',
      whatsappNumber: whatsappNumber || req.user.whatsappNumber || '',
      tags: tags || [],
      images,
    });

    // Populate seller info for the response
    await listing.populate('seller', 'firstName lastName avatarUrl avgRating reviewCount verificationStatus whatsappNumber');

    res.status(201).json({
      success: true,
      message: 'Listing created successfully.',
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/listings ────────────────────────────────────────────────
// Browse / search listings (public)
const getListings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      university,
      condition,
      type,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query;

    // Build filter
    const filter = {
      status: LISTING_STATUS.ACTIVE,
    };

    // Full-text search
    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (university) {
      filter.university = university;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (type) {
      filter.type = type;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'popular':
        sortOption = { viewCount: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // If text search, include text score for relevance sorting
    if (search && sort === 'newest') {
      sortOption = { score: { $meta: 'textScore' }, createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    let query = Listing.find(filter);

    // Add text score projection for search relevance
    if (search) {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const [listings, total] = await Promise.all([
      query
        .populate('seller', 'firstName lastName avatarUrl avgRating reviewCount verificationStatus')
        .sort(sortOption)
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

// ─── GET /api/listings/mine ───────────────────────────────────────────
// Get authenticated user's own listings (all statuses)
const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      sellerId: req.user._id,
      status: { $ne: LISTING_STATUS.DELETED }, // Exclude soft-deleted
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/listings/:id ────────────────────────────────────────────
// Get single listing detail
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'firstName lastName avatarUrl avgRating reviewCount verificationStatus whatsappNumber university bio createdAt');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Don't show deleted listings
    if (listing.status === LISTING_STATUS.DELETED) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Increment view count (fire-and-forget)
    Listing.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    // Fetch similar listings (same category, exclude current)
    const similarListings = await Listing.find({
      _id: { $ne: listing._id },
      category: listing.category,
      status: LISTING_STATUS.ACTIVE,
    })
      .select('title price images pickupLocation university')
      .limit(4)
      .lean();

    res.json({
      success: true,
      data: {
        listing,
        similarListings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/listings/:id ────────────────────────────────────────────
// Update a listing (owner only)
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Ownership check
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing.',
      });
    }

    const allowedFields = [
      'title', 'description', 'price', 'condition',
      'category', 'campus', 'department', 'pickupLocation', 'whatsappNumber', 'tags',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'firstName lastName avatarUrl avgRating reviewCount verificationStatus whatsappNumber');

    res.json({
      success: true,
      message: 'Listing updated successfully.',
      data: updatedListing,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/listings/:id ─────────────────────────────────────────
// Soft-delete a listing (owner only)
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Ownership check
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing.',
      });
    }

    // Delete images from Cloudinary (if applicable)
    for (const image of listing.images) {
      if (image.publicId) {
        await deleteCloudinaryImage(image.publicId);
      }
    }

    // Soft delete — set status to deleted
    listing.status = LISTING_STATUS.DELETED;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/listings/:id/status ───────────────────────────────────
// Update listing status (owner only: active ↔ paused ↔ sold)
const updateListingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      LISTING_STATUS.ACTIVE,
      LISTING_STATUS.PAUSED,
      LISTING_STATUS.SOLD,
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Ownership check
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing.',
      });
    }

    listing.status = status;
    await listing.save();

    res.json({
      success: true,
      message: `Listing status updated to '${status}'.`,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
  updateListingStatus,
};

const Tag = require('../models/Tag');
const { CATEGORIES, TAG_TYPE } = require('../config/constants');

/**
 * @desc    Get all tags (optionally filtered by university or type)
 * @route   GET /api/tags
 * @access  Public
 */
const getTags = async (req, res, next) => {
  try {
    const { university, type } = req.query;
    const filter = {};
    if (university) filter.university = university;
    if (type) filter.type = type;

    const tags = await Tag.find(filter).sort({ usageCount: -1 }).limit(200).lean();

    res.json({ success: true, data: tags, count: tags.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the full category hierarchy (from constants)
 * @route   GET /api/tags/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: CATEGORIES,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trending tags (top 6 by usage count)
 *          Falls back to top-level category names if Tag collection is empty.
 * @route   GET /api/tags/trending
 * @access  Public
 */
const getTrendingTags = async (req, res, next) => {
  try {
    const { university } = req.query;
    const filter = {};
    if (university) filter.university = university;

    const tags = await Tag.find(filter)
      .sort({ usageCount: -1 })
      .limit(6)
      .lean();

    if (tags.length > 0) {
      return res.json({ success: true, data: tags });
    }

    // Fallback: return predefined category names as pseudo-tags
    const fallback = CATEGORIES.slice(0, 6).map((cat) => ({
      name: cat.name,
      type: TAG_TYPE.CATEGORY,
      usageCount: 0,
    }));

    res.json({ success: true, data: fallback });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTags, getCategories, getTrendingTags };

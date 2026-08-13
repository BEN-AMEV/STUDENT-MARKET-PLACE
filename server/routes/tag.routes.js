const express = require('express');
const router = express.Router();
const { getTags, getCategories, getTrendingTags } = require('../controllers/tag.controller');

// GET /api/tags — list all tags (filterable by university, type)
router.get('/', getTags);

// GET /api/tags/categories — full category hierarchy
router.get('/categories', getCategories);

// GET /api/tags/trending — top tags by usage count
router.get('/trending', getTrendingTags);

module.exports = router;

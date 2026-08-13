const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notification.controller');

// GET    /api/notifications                — list notifications (paginated)
router.get('/', protect, getNotifications);

// GET    /api/notifications/unread-count  — get unread count (for nav bell)
// NOTE: must be before /:id
router.get('/unread-count', protect, getUnreadCount);

// PATCH  /api/notifications/read-all      — mark all as read
// NOTE: must be before /:id
router.patch('/read-all', protect, markAllRead);

// DELETE /api/notifications               — clear all notifications
router.delete('/', protect, clearAll);

// PATCH  /api/notifications/:id/read      — mark one as read
router.patch('/:id/read', protect, markOneRead);

// DELETE /api/notifications/:id           — delete one notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;

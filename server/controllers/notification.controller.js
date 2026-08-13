const Notification = require('../models/Notification');
const { PAGINATION } = require('../config/constants');

// ─── GET /api/notifications ────────────────────────────────────────────────────
/**
 * List notifications for the current user (newest first, paginated).
 * Query: { page, limit, unreadOnly }
 */
const getNotifications = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = 30,
      unreadOnly,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip     = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
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

// ─── GET /api/notifications/unread-count ──────────────────────────────────────
/**
 * Returns just the unread count — used by the navbar bell badge.
 * Lightweight endpoint, called frequently.
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
/**
 * Mark a single notification as read.
 */
const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (!notification.isRead) {
      notification.isRead  = true;
      notification.readAt  = new Date();
      await notification.save();
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
/**
 * Mark ALL unread notifications for the current user as read.
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read.`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
/**
 * Delete a single notification.
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/notifications ─────────────────────────────────────────────────
/**
 * Clear all notifications for the current user.
 */
const clearAll = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id });
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} notification(s).`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: create a notification (used internally by other controllers) ─────
/**
 * Call this from order.controller, review.controller, etc. to fan out notifications.
 * Does NOT throw — fire-and-forget pattern.
 */
const createNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    await Notification.create({ userId, type, title, message, data });
  } catch (err) {
    console.error('[Notification] Failed to create:', err.message);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
  clearAll,
  createNotification, // exported for use in other controllers
};

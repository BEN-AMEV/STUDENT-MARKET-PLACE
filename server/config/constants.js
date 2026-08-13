module.exports = {
  // User roles
  ROLES: {
    STUDENT: 'student',
    ADMIN: 'admin',
  },

  // Listing types
  LISTING_TYPE: {
    PRODUCT: 'product',
    SERVICE: 'service',
  },

  // Listing conditions
  LISTING_CONDITION: {
    NEW: 'new',
    LIKE_NEW: 'like_new',
    USED: 'used',
    NOT_APPLICABLE: 'n/a', // for services
  },

  // Listing status
  LISTING_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    SOLD: 'sold',
    EXPIRED: 'expired',
    DELETED: 'deleted',
  },

  // Order status
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    ACCEPTED: 'accepted',
    PROCESSING: 'processing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
    REFUNDED: 'refunded',
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    HELD: 'held',
    RELEASED: 'released',
    REFUNDED: 'refunded',
    FAILED: 'failed',
  },

  // Payment methods
  PAYMENT_METHOD: {
    PAYSTACK: 'paystack',  // Online payment via Paystack (card, mobile money, bank transfer)
    CASH: 'cash',          // Cash on delivery / campus meetup
  },

  // Escrow status for 24-hour hold & payout lifecycle
  ESCROW_STATUS: {
    HOLDING: 'HOLDING',
    ELIGIBLE_FOR_PAYOUT: 'ELIGIBLE_FOR_PAYOUT',
    DISPUTED: 'DISPUTED',
    PAID_OUT: 'PAID_OUT',
    CANCELLED: 'CANCELLED',
  },

  // Platform commission (3%)
  PLATFORM_FEE_PCT: 3.0,

  // Ghana Mobile Money providers for Paystack Transfer Recipients
  GHANA_MOMO_PROVIDERS: [
    { name: 'MTN Mobile Money', code: 'MTN', type: 'mobile_money' },
    { name: 'Telecel Cash (Vodafone)', code: 'VOD', type: 'mobile_money' },
    { name: 'AirtelTigo Money', code: 'ATL', type: 'mobile_money' },
  ],

  // Verification status
  VERIFICATION_STATUS: {
    NOT_SUBMITTED: 'not_submitted',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Notification types
  NOTIFICATION_TYPE: {
    NEW_MESSAGE: 'new_message',
    NEW_ORDER: 'new_order',
    ORDER_UPDATE: 'order_update',
    NEW_REVIEW: 'new_review',
    LISTING_EXPIRED: 'listing_expired',
    VERIFICATION_UPDATE: 'verification_update',
    PAYMENT_RECEIVED: 'payment_received',
    DISPUTE_UPDATE: 'dispute_update',
  },

  // Tag types
  TAG_TYPE: {
    CATEGORY: 'category',
    LOCATION: 'location',
    CUSTOM: 'custom',
  },

  // Report reasons
  REPORT_REASON: {
    INAPPROPRIATE: 'inappropriate',
    SPAM: 'spam',
    FAKE: 'fake',
    HARASSMENT: 'harassment',
    SCAM: 'scam',
    OTHER: 'other',
  },

  // Listing categories
  CATEGORIES: [
    {
      name: 'Textbooks & Study Materials',
      slug: 'textbooks',
      subcategories: ['Textbooks', 'Notes & Past Papers', 'Lab Manuals'],
    },
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      subcategories: ['Phones & Accessories', 'Laptops & Tablets', 'Chargers & Cables'],
    },
    {
      name: 'Fashion & Clothing',
      slug: 'fashion',
      subcategories: ['Clothing', 'Shoes', 'Accessories'],
    },
    {
      name: 'Food & Beverages',
      slug: 'food',
      subcategories: ['Homemade Meals', 'Snacks & Drinks', 'Catering Services'],
    },
    {
      name: 'Services',
      slug: 'services',
      subcategories: ['Tutoring', 'Design & Creative', 'Writing & Editing', 'Tech & Programming', 'Photography & Video'],
    },
    {
      name: 'Events & Entertainment',
      slug: 'events',
      subcategories: ['Event Tickets', 'DJ & Music', 'Party Planning'],
    },
    {
      name: 'Housing & Roommates',
      slug: 'housing',
      subcategories: ['Room Rentals', 'Roommate Finder', 'Furniture'],
    },
    {
      name: 'Miscellaneous',
      slug: 'miscellaneous',
      subcategories: ['Lost & Found', 'Free Items', 'Other'],
    },
  ],

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Token expiry
  TOKEN_EXPIRY: {
    ACCESS: '15m',
    REFRESH: '7d',
    OTP: 10 * 60 * 1000, // 10 minutes in ms
    PASSWORD_RESET: 60 * 60 * 1000, // 1 hour in ms
  },

  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_LISTING_IMAGES: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

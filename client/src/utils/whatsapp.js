/**
 * WhatsApp utility helpers
 *
 * Builds a wa.me deep-link that opens WhatsApp with a pre-filled message.
 * Handles both full international numbers (e.g. "+233501234567", "233501234567")
 * and local Ghanaian numbers starting with "0" (e.g. "0501234567").
 */

const DEFAULT_COUNTRY_CODE = '233'; // Ghana

/**
 * Sanitize and normalise a phone number to international format (digits only,
 * no leading "+").
 *
 * @param {string} raw - The raw phone number string entered by the user.
 * @param {string} [countryCode]  - Fallback country code (digits only, no "+").
 * @returns {string|null}  Normalised number or null if invalid.
 */
export function normalisePhone(raw, countryCode = DEFAULT_COUNTRY_CODE) {
  if (!raw) return null;

  // Strip all non-digit characters except leading +
  const stripped = raw.trim().replace(/[\s\-().]/g, '');

  // Already has full international prefix (e.g. +233XXXXXXXXX)
  if (stripped.startsWith('+')) {
    const digits = stripped.slice(1);
    return digits.length >= 7 ? digits : null;
  }

  // Starts with country code digits (e.g. 233XXXXXXXXX)
  if (stripped.startsWith(countryCode)) {
    return stripped.length >= 7 ? stripped : null;
  }

  // Local number starting with 0  (e.g. 0501234567 → 233501234567)
  if (stripped.startsWith('0')) {
    const withCode = countryCode + stripped.slice(1);
    return withCode.length >= 7 ? withCode : null;
  }

  // Bare number — prepend country code
  const withCode = countryCode + stripped;
  return withCode.length >= 7 ? withCode : null;
}

/**
 * Build a WhatsApp wa.me deep-link URL.
 *
 * @param {string} phone - Raw or normalised phone number.
 * @param {string} [message] - Optional pre-filled message text.
 * @returns {string|null}  The full wa.me URL, or null if the number is invalid.
 */
export function buildWhatsAppUrl(phone, message = '') {
  const normalised = normalisePhone(phone);
  if (!normalised) return null;

  const base = `https://wa.me/${normalised}`;
  if (!message.trim()) return base;

  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Build a pre-filled WhatsApp message for a buyer enquiring about a listing.
 *
 * @param {object} opts
 * @param {string} opts.sellerName
 * @param {string} opts.listingTitle
 * @param {number|string} opts.price
 * @param {string} [opts.currency]
 * @returns {string}
 */
export function buildListingEnquiryMessage({ sellerName, listingTitle, price, currency = '₵' }) {
  return (
    `Hi ${sellerName}, I'm interested in your listing "${listingTitle}" ` +
    `(${currency}${Number(price).toLocaleString()}) on CampusMarket. ` +
    `Is it still available?`
  );
}

/**
 * Build a pre-filled WhatsApp message after an order has been placed.
 *
 * @param {object} opts
 * @param {string} opts.sellerName
 * @param {string} opts.listingTitle
 * @param {string} [opts.orderRef]  - Short order reference / ID suffix.
 * @returns {string}
 */
export function buildOrderContactMessage({ sellerName, listingTitle, orderRef = '' }) {
  const refPart = orderRef ? ` (Order ref: ${orderRef})` : '';
  return (
    `Hi ${sellerName}, I just placed an order for "${listingTitle}"${refPart} on CampusMarket. ` +
    `Please let me know the pickup / delivery details. Thank you!`
  );
}

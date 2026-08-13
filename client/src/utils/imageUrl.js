const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api\/?$/, '');

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&fit=crop';

/**
 * Resolves local relative upload URLs (e.g. /uploads/listings/xxx.png)
 * to absolute backend URLs (e.g. https://student-market-place-api.onrender.com/uploads/listings/xxx.png).
 * Leaves absolute URLs (Cloudinary, Unsplash, http://, https://, data:, blob:) untouched.
 * Also safely handles image objects { url, thumbnail } or null/undefined.
 */
export const resolveImageUrl = (imageInput, fallback = DEFAULT_FALLBACK) => {
  if (!imageInput) return fallback;

  let url = imageInput;
  if (typeof imageInput === 'object') {
    url = imageInput.thumbnail || imageInput.url || '';
  }

  if (typeof url !== 'string' || !url.trim()) return fallback;

  url = url.trim();

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${cleanPath}`;
};

export default resolveImageUrl;

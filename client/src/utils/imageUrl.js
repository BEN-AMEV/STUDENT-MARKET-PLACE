const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Resolves local relative upload URLs (e.g. /uploads/listings/xxx.png)
 * to absolute backend URLs (e.g. http://localhost:5000/uploads/listings/xxx.png).
 * Leaves absolute URLs (Cloudinary, Unsplash, http://, https://, data:, blob:) untouched.
 */
export const resolveImageUrl = (url, fallback = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&fit=crop') => {
  if (!url) return fallback;
  if (typeof url !== 'string') return fallback;
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

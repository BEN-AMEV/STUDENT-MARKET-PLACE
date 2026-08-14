import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import { buildWhatsAppUrl, buildListingEnquiryMessage } from '../utils/whatsapp';
import toast from 'react-hot-toast';
import './ListingDetail.css';

/**
 * Helper: format a date into a "time ago" string.
 */
const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `Posted ${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Posted ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Posted ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return `Posted on ${date.toLocaleDateString()}`;
};

/**
 * Helper: map backend condition enum to display label.
 */
const conditionLabel = (val) => {
  const map = { new: 'New', like_new: 'Like New', used: 'Used', 'n/a': 'Service' };
  return map[val] || val;
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [listing, setListing] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/listings/${id}`);
        setListing(data.data.listing);
        setSimilarListings(data.data.similarListings || []);
        setActiveImageIndex(0);
        setIsFavorited(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
    toast.success(!isFavorited ? 'Added to favorites!' : 'Removed from favorites.');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase.');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { listingId: id, listing } });
  };

  const handleContactWhatsApp = () => {
    const phone = listing.whatsappNumber || listing.seller?.whatsappNumber;
    if (!phone) {
      toast.error('This seller has not provided a WhatsApp number.');
      return;
    }
    const sellerName = listing.seller?.firstName || 'Seller';
    const message = buildListingEnquiryMessage({
      sellerName,
      listingTitle: listing.title,
      price: listing.price,
    });
    const url = buildWhatsAppUrl(phone, message);
    if (!url) {
      toast.error('Invalid phone number on this listing.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: '16px' }}>Loading listing details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-outline)', opacity: 0.5 }}>
          error_outline
        </span>
        <h3 className="text-headline-sm" style={{ marginTop: '16px' }}>Listing Not Found</h3>
        <p className="color-on-surface-variant" style={{ maxWidth: '350px', margin: '8px auto 24px auto' }}>
          {error || 'This listing may have been removed or does not exist.'}
        </p>
        <Link to="/explore" className="btn btn-primary">Browse Listings</Link>
      </div>
    );
  }

  // Build image list — use image URLs from the API
  const imageUrls = listing.images && listing.images.length > 0
    ? listing.images.map((img) => resolveImageUrl(img.url || img))
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=450&fit=crop']; // Fallback

  const seller = listing.seller || {};
  const sellerName = seller.firstName ? `${seller.firstName} ${seller.lastName}` : 'Unknown Seller';
  const sellerRating = seller.avgRating ? `${seller.avgRating.toFixed(1)} (${seller.reviewCount || 0} Reviews)` : 'No reviews yet';
  const isVerified = seller.verificationStatus === 'approved';

  return (
    <div className="detail-container animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="detail-breadcrumbs">
        <Link to="/">Home</Link>
        <span className="material-symbols-outlined detail-breadcrumbs-separator">chevron_right</span>
        <Link to={`/explore?category=${encodeURIComponent(listing.category)}`}>{listing.category}</Link>
        <span className="material-symbols-outlined detail-breadcrumbs-separator">chevron_right</span>
        <span className="detail-breadcrumbs-current">{listing.title}</span>
      </nav>

      {/* Main Grid */}
      <div className="detail-grid">
        {/* Left Gallery & Description */}
        <section className="detail-gallery-column">
          <div className="detail-main-image-wrapper">
            <img
              src={imageUrls[activeImageIndex]}
              alt={listing.title}
              className="detail-main-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop';
              }}
            />
            <button
              type="button"
              className={`detail-fav-btn ${isFavorited ? 'active' : ''}`}
              onClick={handleFavoriteToggle}
              aria-label="Add to favorites"
            >
              <span className={`material-symbols-outlined ${isFavorited ? 'icon-filled' : ''}`}>
                favorite
              </span>
            </button>
          </div>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="detail-thumbnails custom-scrollbar">
              {imageUrls.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`detail-thumbnail ${activeImageIndex === index ? 'active' : ''}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&h=150&fit=crop';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="card card-padded detail-desc-card">
            <h3 className="text-headline-sm detail-desc-title">Product Description</h3>
            <p className="text-body-lg detail-desc-text">{listing.description}</p>
            <div className="detail-desc-specs">
              <div className="detail-spec-item">
                <span className="material-symbols-outlined detail-spec-icon">verified_user</span>
                <span className="text-metadata">Quality Assured</span>
              </div>
              <div className="detail-spec-item">
                <span className="material-symbols-outlined detail-spec-icon">local_shipping</span>
                <span className="text-metadata">On-Campus Meetup</span>
              </div>
              <div className="detail-spec-item">
                <span className="material-symbols-outlined detail-spec-icon">visibility</span>
                <span className="text-metadata">{listing.viewCount || 0} views</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Details Sidebar */}
        <aside className="detail-sidebar-column">
          <div className="card card-padded detail-info-card">
            <div className="detail-meta-row">
              <span className="chip chip-secondary">{conditionLabel(listing.condition)}</span>
              <span className="text-metadata color-outline">{timeAgo(listing.createdAt)}</span>
            </div>

            <h1 className="text-headline-md detail-title">{listing.title}</h1>

            <div className="detail-price-row">
              <span className="detail-price">₵{listing.price.toLocaleString()}</span>
            </div>

            <div className="detail-cta-group">
              <button onClick={handleBuyNow} className="btn btn-primary btn-full detail-cta-btn">
                <span className="material-symbols-outlined">shopping_cart</span>
                Buy Now
              </button>
              <button
                onClick={handleContactWhatsApp}
                className="btn btn-full detail-cta-btn detail-whatsapp-btn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </button>
            </div>

            <hr className="divider" />

            {/* Meetup / Location */}
            <div className="detail-location-section">
              <span className="material-symbols-outlined detail-location-icon">location_on</span>
              <div>
                <p className="detail-location-title">{listing.university}</p>
                <p className="detail-location-desc">{listing.pickupLocation || 'Contact seller for meetup details'}</p>
              </div>
            </div>

            {/* Static Map Placeholder */}
            <div className="detail-map-box">
              <div
                className="detail-map-bg"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=300&fit=crop')"
                }}
              ></div>
              <div className="detail-map-marker-pulse"></div>
              <div className="detail-map-marker"></div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="card card-padded detail-seller-card">
            <h4 className="text-label-caps color-outline">Seller Information</h4>
            <div className="detail-seller-header">
              <div className="detail-seller-avatar-wrapper">
                {seller.avatarUrl ? (
                  <img
                    src={seller.avatarUrl}
                    alt={sellerName}
                    className="detail-seller-avatar"
                  />
                ) : (
                  <div
                    className="detail-seller-avatar"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)',
                      fontSize: '20px', fontWeight: 'bold',
                    }}
                  >
                    {seller.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {isVerified && (
                  <div className="detail-seller-badge-check">
                    <span className="material-symbols-outlined text-white">check</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-headline-sm detail-seller-name">{sellerName}</h4>
                <div className="detail-seller-rating">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '16px' }}>
                    star
                  </span>
                  <span className="text-label-caps">{sellerRating}</span>
                </div>
              </div>
            </div>
            <div className="detail-seller-tag-row">
              {isVerified && <span className="chip chip-outline text-metadata">Verified Student</span>}
              <span className="chip chip-outline text-metadata">{listing.university}</span>
            </div>
            {seller._id && (
              <Link to={`/explore?sellerId=${seller._id}`} className="detail-seller-link">
                View Seller's Other Items
              </Link>
            )}
          </div>

          {/* Safety Card */}
          <div className="detail-safety-card">
            <span className="material-symbols-outlined detail-safety-icon">security</span>
            <p className="detail-safety-text">
              <strong>Safety First:</strong> Always meet in public campus areas during daylight hours and verify the item before making any payment.
            </p>
          </div>
        </aside>
      </div>

      {/* Similar Items */}
      {similarListings.length > 0 && (
        <section className="detail-similar">
          <h2 className="text-headline-md detail-similar-title">Similar Items You Might Like</h2>
          <div className="detail-similar-grid">
            {similarListings.map((item) => (
                <Link key={item._id} to={`/listings/${item._id}`} className="detail-similar-card">
                  <div className="detail-similar-image">
                    <img
                      src={resolveImageUrl(item.images?.[0])}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=225&fit=crop';
                      }}
                    />
                  </div>
                <div className="detail-similar-body">
                  <h4 className="detail-similar-name truncate">{item.title}</h4>
                  <p className="detail-similar-price">₵{item.price.toLocaleString()}</p>
                  <p className="detail-similar-location">{item.pickupLocation || item.university}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky action bar — Buy Now + WhatsApp always visible at bottom */}
      <div className="detail-mobile-sticky-bar">
        <span className="detail-mobile-price">₵{listing.price.toLocaleString()}</span>
        <div className="detail-cta-group">
          <button onClick={handleBuyNow} className="btn btn-primary detail-cta-btn" id="mobile-buy-now-btn">
            <span className="material-symbols-outlined">shopping_cart</span>
            Buy Now
          </button>
          <button
            onClick={handleContactWhatsApp}
            className="btn detail-cta-btn detail-whatsapp-btn"
            id="mobile-whatsapp-btn"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;

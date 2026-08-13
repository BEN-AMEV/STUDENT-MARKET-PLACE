import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUrl';
import { buildWhatsAppUrl, buildListingEnquiryMessage } from '../utils/whatsapp';
import './StudentProfile.css';

// ─── Star display helper ───────────────────────────────────────────────────────
const StarRow = ({ rating, size = 16, showEmpty = false }) => (
  <div className="profile-review-stars">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`material-symbols-outlined ${star <= Math.round(rating) ? 'icon-filled' : ''}`}
        style={{ fontSize: `${size}px`, opacity: star <= Math.round(rating) ? 1 : showEmpty ? 0.25 : 0 }}
      >
        star
      </span>
    ))}
  </div>
);

// ─── Time ago helper ───────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
};

// ─── Component ─────────────────────────────────────────────────────────────────
const StudentProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [favorites, setFavorites] = useState({});

  // ── Fetch profile + listings ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoadingProfile(true);
    Promise.all([
      api.get(`/users/${userId}`),
      api.get(`/users/${userId}/listings`),
    ])
      .then(([profileRes, listingsRes]) => {
        setProfile(profileRes.data.data);
        setListings(listingsRes.data.data || []);
      })
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setLoadingProfile(false));
  }, [userId]);

  // ── Fetch reviews when tab is opened ────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'reviews' || !userId) return;
    setLoadingReviews(true);
    api.get(`/reviews/user/${userId}`)
      .then(({ data }) => {
        setReviews(data.data);
        setReviewStats(data.stats);
      })
      .catch(() => toast.error('Could not load reviews.'))
      .finally(() => setLoadingReviews(false));
  }, [activeTab, userId]);

  const handleFavoriteToggle = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContactWhatsApp = () => {
    const phone = profile?.whatsappNumber;
    if (!phone) {
      toast.error('This seller has not added a WhatsApp number to their profile.');
      return;
    }
    const message = buildListingEnquiryMessage({
      sellerName: profile.firstName,
      listingTitle: 'your listings',
      price: '',
    }).replace('(₵) on CampusMarket. ', ' on CampusMarket. ');
    const url = buildWhatsAppUrl(phone, `Hi ${profile.firstName}, I saw your profile on CampusMarket and I'd like to enquire about your items. Are you available?`);
    if (!url) {
      toast.error('Invalid phone number.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: '16px' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.4 }}>person_off</span>
        <h3 className="text-headline-sm" style={{ marginTop: '16px' }}>Profile Not Found</h3>
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: '24px' }}>Back to Explore</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;
  const sellerName = `${profile.firstName} ${profile.lastName}`;
  const isVerified = profile.verificationStatus === 'approved';
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <div className="profile-container animate-fade-in">
      {/* Banner */}
      <div className="profile-banner" />

      {/* Main Layout */}
      <div className="profile-layout">
        {/* ── Left: Profile Card ──────────────────────────────── */}
        <aside>
          <div className="card card-padded profile-card">
            <div className="profile-avatar-wrapper">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={sellerName} className="profile-avatar-large" />
              ) : (
                <div className="profile-avatar-large profile-avatar-initials">
                  {profile.firstName?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-headline-md profile-username">{sellerName}</h2>
              <div className="profile-rating-stars" style={{ marginTop: '4px', justifyContent: 'center' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '18px' }}>star</span>
                <span className="text-label-caps" style={{ fontWeight: 700 }}>
                  {profile.avgRating > 0
                    ? `${profile.avgRating.toFixed(1)} (${profile.reviewCount} Review${profile.reviewCount !== 1 ? 's' : ''})`
                    : 'No reviews yet'}
                </span>
              </div>
            </div>

            <div className="profile-badges">
              {isVerified && <span className="chip chip-primary text-metadata">Verified Student</span>}
              {profile.reviewCount >= 10 && <span className="chip chip-secondary text-metadata">Top Seller</span>}
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-meta-list">
              <div className="profile-meta-item">
                <span className="material-symbols-outlined">account_balance</span>
                <span>{profile.university}</span>
              </div>
              {profile.department && (
                <div className="profile-meta-item">
                  <span className="material-symbols-outlined">school</span>
                  <span>{profile.department}{profile.year ? ` (Year ${profile.year})` : ''}</span>
                </div>
              )}
              <div className="profile-meta-item">
                <span className="material-symbols-outlined">calendar_today</span>
                <span>Joined {memberSince}</span>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <button
                onClick={handleContactWhatsApp}
                className="btn btn-full profile-whatsapp-btn"
                style={{ marginTop: '8px' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </button>
            )}
            {isOwnProfile && (
              <Link to="/profile" className="btn btn-outline btn-full" style={{ marginTop: '8px' }}>
                <span className="material-symbols-outlined">edit</span>
                Edit Profile
              </Link>
            )}
          </div>
        </aside>

        {/* ── Right: Tabs ─────────────────────────────────────── */}
        <section>
          <div className="card card-padded profile-tabs-card">
            {/* Tab header */}
            <div className="profile-tabs-header">
              <button
                className={`profile-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                onClick={() => setActiveTab('listings')}
              >
                Listings ({listings.length})
              </button>
              <button
                className={`profile-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({profile.reviewCount || 0})
              </button>
            </div>

            {/* TAB: Listings */}
            {activeTab === 'listings' && (
              listings.length === 0 ? (
                <div className="profile-empty-state">
                  <span className="material-symbols-outlined">storefront</span>
                  <p>No active listings yet.</p>
                </div>
              ) : (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {listings.map(item => (
                    <Link key={item._id} to={`/listings/${item._id}`} className="product-card animate-scale-in">
                      <div className="product-card-image">
                        <img
                          src={resolveImageUrl(item.images?.[0]?.thumbnail || item.images?.[0]?.url)}
                          alt={item.title}
                        />
                        <button
                          type="button"
                          className={`product-card-fav ${favorites[item._id] ? 'active' : ''}`}
                          onClick={(e) => handleFavoriteToggle(e, item._id)}
                          aria-label="Add to favorites"
                        >
                          <span className={`material-symbols-outlined ${favorites[item._id] ? 'icon-filled' : ''}`}>favorite</span>
                        </button>
                        {isVerified && (
                          <div className="badge badge-verified" style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>verified</span>
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="product-card-body">
                        <span className="product-card-category">{item.category}</span>
                        <h3 className="product-card-title">{item.title}</h3>
                        <div className="product-card-footer">
                          <span className="product-card-price">₵{item.price?.toLocaleString()}</span>
                          <div className="product-card-location">
                            <span className="material-symbols-outlined">location_on</span>
                            <span>{item.pickupLocation || item.campus || item.university}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* TAB: Reviews */}
            {activeTab === 'reviews' && (
              loadingReviews ? (
                <div className="text-center" style={{ padding: '40px 0' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: 'var(--color-primary)' }}>
                    progress_activity
                  </span>
                </div>
              ) : (
                <div>
                  {/* Rating summary */}
                  {reviewStats && reviewStats.total > 0 && (
                    <div className="profile-rating-summary">
                      <div className="profile-rating-big">
                        <span className="profile-rating-number">{reviewStats.avgRating.toFixed(1)}</span>
                        <StarRow rating={reviewStats.avgRating} size={20} showEmpty />
                        <span className="profile-rating-count">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="profile-rating-bars">
                        {reviewStats.distribution.map(({ star, count }) => (
                          <div key={star} className="profile-rating-bar-row">
                            <span className="profile-rating-bar-label">{star}</span>
                            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>star</span>
                            <div className="profile-rating-bar-track">
                              <div
                                className="profile-rating-bar-fill"
                                style={{ width: reviewStats.total ? `${(count / reviewStats.total) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="profile-rating-bar-count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review cards */}
                  {reviews.length === 0 ? (
                    <div className="profile-empty-state">
                      <span className="material-symbols-outlined">rate_review</span>
                      <p>No reviews yet.</p>
                    </div>
                  ) : (
                    <div className="profile-reviews-list">
                      {reviews.map(rev => {
                        const reviewer = rev.reviewer || {};
                        const reviewerName = reviewer.firstName
                          ? `${reviewer.firstName} ${reviewer.lastName}`
                          : 'Anonymous';
                        return (
                          <div key={rev._id} className="profile-review-card animate-fade-in-up">
                            <div className="profile-review-header">
                              <div className="profile-reviewer">
                                <div className="profile-reviewer-avatar-wrap">
                                  {reviewer.avatarUrl ? (
                                    <img src={reviewer.avatarUrl} alt={reviewerName} className="profile-reviewer-avatar" />
                                  ) : (
                                    <div className="profile-reviewer-avatar profile-reviewer-initials">
                                      {reviewer.firstName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="profile-reviewer-name">{reviewerName}</h4>
                                  <span className="text-metadata color-outline">{timeAgo(rev.createdAt)}</span>
                                </div>
                              </div>
                              <StarRow rating={rev.rating} size={15} />
                            </div>
                            {rev.comment && <p className="profile-review-comment">{rev.comment}</p>}
                            {rev.sellerResponse && (
                              <div className="profile-review-reply">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
                                  reply
                                </span>
                                <p><strong>{sellerName}:</strong> {rev.sellerResponse}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentProfile;

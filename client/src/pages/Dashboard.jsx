import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUrl';
import { buildWhatsAppUrl, buildOrderContactMessage } from '../utils/whatsapp';
import './Dashboard.css';

// ── Helper: format date ─────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Star Rating Picker ────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="dash-star-picker" aria-label="Star rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`dash-star-btn ${star <= value ? 'selected' : ''}`}
        onClick={() => onChange(star)}
        aria-label={`${star} star`}
      >
        <span className={`material-symbols-outlined ${star <= value ? 'icon-filled' : ''}`}>star</span>
      </button>
    ))}
  </div>
);

// ─── Status chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ status, escrowStatus }) => {
  const map = {
    pending_payment: { label: 'Pending Payment', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
    paid:            { label: escrowStatus === 'HOLDING' ? 'Escrow Holding (24h)' : 'Paid', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    accepted:        { label: 'Accepted',        color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    processing:      { label: 'Processing',      color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    completed:       { label: 'Completed',       color: '#059669', bg: 'rgba(5,150,105,0.12)' },
    cancelled:       { label: 'Cancelled',       color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    disputed:        { label: 'Dispute Frozen',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  };
  const { label, color, bg } = map[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color, background: bg }}>
      {label}
    </span>
  );
};

// ─── Dispute Modal ────────────────────────────────────────────────────────────
const DisputeModal = ({ order, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const backdropRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the complaint.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${order._id}/dispute`, {
        reason: reason.trim(),
      });
      toast.success('Complaint filed! Escrow payout is frozen for admin review. ⚖️');
      onSuccess(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" ref={backdropRef} onClick={(e) => e.target === backdropRef.current && onClose()}>
      <div className="modal-box animate-scale-in dash-review-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="dash-review-modal-header">
          <span className="material-symbols-outlined dash-review-modal-icon" style={{ color: '#dc2626' }}>gavel</span>
          <div>
            <h3 className="dash-review-modal-title">File a Complaint / Dispute</h3>
            <p className="dash-review-modal-sub">
              Freezes the 24-hour seller payout for <strong>{order.listing?.title || 'this order'}</strong> until resolved.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginTop: '16px' }}>
            <label className="dash-review-label" htmlFor="dispute-reason">
              What went wrong?
            </label>
            <textarea
              id="dispute-reason"
              className="dash-review-textarea"
              rows={4}
              placeholder="Describe the issue (e.g. seller did not show up, item damaged, not as described)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              required
            />
          </div>

          <div className="dash-review-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626' }} disabled={submitting || !reason.trim()}>
              {submitting ? 'Submitting...' : 'Freeze Escrow & Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Leave a Review Modal ─────────────────────────────────────────────────────
const ReviewModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const backdropRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', {
        orderId: order._id,
        rating,
        comment: comment.trim(),
      });
      toast.success('Review submitted! 🎉');
      onSuccess(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" ref={backdropRef} onClick={(e) => e.target === backdropRef.current && onClose()}>
      <div className="modal-box animate-scale-in dash-review-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="dash-review-modal-header">
          <span className="material-symbols-outlined dash-review-modal-icon">rate_review</span>
          <div>
            <h3 className="dash-review-modal-title">Leave a Review</h3>
            <p className="dash-review-modal-sub">
              How was your experience buying <strong>{order.listing?.title || 'this item'}</strong>?
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dash-review-rating-section">
            <label className="dash-review-label">Your Rating</label>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="dash-review-rating-hint">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="dash-review-label" htmlFor="review-comment">
              Comment <span style={{ fontWeight: 400, color: 'var(--color-outline)' }}>(optional)</span>
            </label>
            <textarea
              id="review-comment"
              className="dash-review-textarea"
              rows={4}
              placeholder="Describe your experience — condition of the item, reliability of the seller, pickup experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-outline)', textAlign: 'right' }}>
              {comment.length}/1000
            </p>
          </div>

          <div className="dash-review-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
              {submitting ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Submitting...</>
              ) : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSelling, setLoadingSelling] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [reviewModal, setReviewModal] = useState(null); // order object
  const [disputeModal, setDisputeModal] = useState(null); // order object

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('Confirm that you have received this item/service? This will complete the order and release escrow funds to the seller.')) {
      return;
    }
    try {
      const { data } = await api.post(`/orders/${orderId}/confirm`);
      toast.success('Order confirmed! Thank you.');
      setOrders(prev => prev.map(o => o._id === orderId ? data.data : o));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order.');
    }
  };

  const handleDisputeSuccess = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setDisputeModal(null);
  };

  // Fetch buying orders
  useEffect(() => {
    if (activeTab !== 'orders') return;
    setLoadingOrders(true);
    api.get('/orders?role=buying')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => toast.error('Could not load orders.'))
      .finally(() => setLoadingOrders(false));
  }, [activeTab]);

  // Fetch selling orders
  useEffect(() => {
    if (activeTab !== 'selling') return;
    setLoadingSelling(true);
    api.get('/orders?role=selling')
      .then(({ data }) => setSellingOrders(data.data || []))
      .catch(() => toast.error('Could not load selling orders.'))
      .finally(() => setLoadingSelling(false));
  }, [activeTab]);

  // Fetch saved listings (favourites) — graceful fallback if endpoint not ready
  useEffect(() => {
    if (activeTab !== 'saved') return;
    setLoadingSaved(true);
    api.get('/listings?saved=true&limit=20')
      .then(({ data }) => setSavedListings(data.data?.listings || data.data || []))
      .catch(() => setSavedListings([]))
      .finally(() => setLoadingSaved(false));
  }, [activeTab]);

  const handleReviewSuccess = (review) => {
    setReviewedOrders(prev => new Set([...prev, review.orderId || reviewModal._id]));
    setReviewModal(null);
  };

  return (
    <div className="dash-page animate-fade-in">
      {/* Welcome banner */}
      <div className="dash-hero">
        <div className="dash-hero-content">
          <h2 className="text-headline-lg">Welcome back, {user?.firstName}! 👋</h2>
          <p className="text-body-lg" style={{ opacity: 0.9, marginTop: '4px' }}>
            Your student marketplace hub — manage listings, orders, and reviews.
          </p>
        </div>
        <span className="material-symbols-outlined dash-hero-icon">school</span>
      </div>

      {/* Tab Nav */}
      <div className="dash-tab-nav">
        {[  
        { key: 'profile',  label: 'My Profile',   icon: 'person' },
        { key: 'orders',   label: 'Buying',        icon: 'shopping_bag' },
        { key: 'selling',  label: 'Selling',       icon: 'storefront' },
        { key: 'saved',    label: 'Saved',         icon: 'bookmark' },
      ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`dash-tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile ────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="dash-card">
          {/* Profile header */}
          <div className="dash-profile-header">
            <div className="dash-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" />
              ) : (
                <span>{user?.firstName?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 className="text-headline-sm">{user?.firstName} {user?.lastName}</h3>
                {user?.isVerified && (
                  <span className="badge badge-verified" title="Student Verified">
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>verified</span>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-body-sm color-on-surface-variant">{user?.email}</p>
              <p className="text-metadata color-outline" style={{ marginTop: '4px' }}>
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <hr className="divider" />

          {/* Details grid */}
          <div className="dash-details-grid">
            {[
              { icon: 'account_balance', label: 'University',     value: user?.university   || 'Not set' },
              { icon: 'school',          label: 'Department',     value: user?.department   || 'Not set' },
              { icon: 'calendar_today',  label: 'Year of Study',  value: user?.year ? `Year ${user.year}` : 'Not set' },
              { icon: 'star',            label: 'Seller Rating',  value: user?.avgRating > 0 ? `${user.avgRating.toFixed(1)} / 5 (${user.reviewCount} reviews)` : 'No reviews yet' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="dash-detail-item">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>{icon}</span>
                <div>
                  <p className="text-metadata color-outline">{label}</p>
                  <p className="text-body-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="divider" />

          {/* Verification banner */}
          {!user?.isVerified && (
            <div className="dash-verify-banner">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontSize: '24px' }}>gpp_maybe</span>
              <div style={{ flexGrow: 1 }}>
                <h4 className="text-body-sm font-semibold" style={{ color: 'var(--color-tertiary)' }}>Student Verification Required</h4>
                <p className="text-metadata color-on-surface-variant">
                  Verify your account to unlock selling, messaging, and escrow payments.
                </p>
              </div>
              <Link to="/profile" className="btn btn-ghost btn-small" style={{ borderColor: 'var(--color-tertiary)', color: 'var(--color-tertiary)' }}>
                Verify ID
              </Link>
            </div>
          )}

      {/* ── Tab: Selling Orders ─────────────────────────── */}
      {activeTab === 'selling' && (
        <div>
          {loadingSelling ? (
            <div className="text-center" style={{ padding: '60px 0' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>progress_activity</span>
              <p style={{ marginTop: '12px' }}>Loading sales...</p>
            </div>
          ) : sellingOrders.length === 0 ? (
            <div className="dash-card dash-empty-state">
              <span className="material-symbols-outlined">storefront</span>
              <h3>No sales yet</h3>
              <p>Orders from buyers for your listings will appear here.</p>
              <Link to="/listings/create" className="btn btn-primary" style={{ marginTop: '16px' }}>Post an Item</Link>
            </div>
          ) : (
            <div className="dash-orders-list">
              {sellingOrders.map(order => {
                const listing = order.listing || {};
                const buyer   = order.buyer  || {};
                const imgUrl  = resolveImageUrl(listing.images?.[0]);
                return (
                  <div key={order._id} className="dash-order-card animate-fade-in-up">
                    <img
                      src={imgUrl}
                      alt={listing.title}
                      className="dash-order-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&fit=crop';
                      }}
                    />
                    <div className="dash-order-info">
                      <h4 className="dash-order-title">{listing.title || 'Unnamed Item'}</h4>
                      <p className="dash-order-seller">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                        Buyer: {buyer.firstName ? `${buyer.firstName} ${buyer.lastName}` : 'Unknown'}
                      </p>
                      <div className="dash-order-meta">
                        <StatusChip status={order.orderStatus} />
                        <span className="dash-order-amount">GHS {(order.amount + order.platformFee).toLocaleString()}</span>
                      </div>
                      <p className="dash-order-date">{fmtDate(order.createdAt)}</p>
                    </div>
                    <div className="dash-order-actions">
                      {order.orderStatus === 'disputed' && (
                        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>gavel</span>
                          {' '}Under Review
                        </span>
                      )}
                      {order.orderStatus === 'paid' && (
                        <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                          Arrange pickup with buyer
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Saved Listings ─────────────────────────── */}
      {activeTab === 'saved' && (
        <div>
          {loadingSaved ? (
            <div className="text-center" style={{ padding: '60px 0' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>progress_activity</span>
            </div>
          ) : savedListings.length === 0 ? (
            <div className="dash-card dash-empty-state">
              <span className="material-symbols-outlined">bookmark_border</span>
              <h3>No saved listings</h3>
              <p>Tap the bookmark icon on any listing to save it here.</p>
              <Link to="/explore" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Listings</Link>
            </div>
          ) : (
            <div className="dash-saved-grid">
              {savedListings.map(item => (
                <Link key={item._id} to={`/listings/${item._id}`} className="dash-saved-card product-card animate-scale-in">
                  <div className="product-card-image">
                    <img
                      src={resolveImageUrl(item.images?.[0]?.thumbnail || item.images?.[0]?.url)}
                      alt={item.title}
                    />
                  </div>
                  <div className="product-card-body">
                    <span className="product-card-category">{item.category}</span>
                    <h3 className="product-card-title">{item.title}</h3>
                    <div className="product-card-footer">
                      <span className="product-card-price">₵{item.price?.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

          {/* Quick actions */}
          <div className="dash-quick-actions">
            <Link to="/explore" className="btn btn-outline flex-grow">Browse Listings</Link>
            {user?.isEmailVerified && user?.verificationStatus === 'approved' ? (
              <Link to="/listings/create" className="btn btn-primary flex-grow">Post an Item</Link>
            ) : (
              <Link to="/profile" className="btn btn-primary flex-grow">Get Verified to Sell</Link>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Orders ─────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          {loadingOrders ? (
            <div className="text-center" style={{ padding: '60px 0' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>
                progress_activity
              </span>
              <p style={{ marginTop: '12px' }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="dash-card dash-empty-state">
              <span className="material-symbols-outlined">shopping_bag</span>
              <h3>No orders yet</h3>
              <p>When you buy items on CampusMarket, they'll appear here.</p>
              <Link to="/explore" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Listings</Link>
            </div>
          ) : (
            <div className="dash-orders-list">
              {orders.map(order => {
                const listing = order.listing || {};
                const seller  = order.seller  || {};
                const imgUrl  = resolveImageUrl(listing.images?.[0]);
                const canReview = order.orderStatus === 'completed' && !reviewedOrders.has(order._id);
                return (
                  <div key={order._id} className="dash-order-card animate-fade-in-up">
                    <img
                      src={imgUrl}
                      alt={listing.title}
                      className="dash-order-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&fit=crop';
                      }}
                    />
                    <div className="dash-order-info">
                      <h4 className="dash-order-title">{listing.title || 'Unnamed Item'}</h4>
                      <p className="dash-order-seller">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                        {seller.firstName ? `${seller.firstName} ${seller.lastName}` : 'Unknown Seller'}
                      </p>
                      <div className="dash-order-meta">
                        <StatusChip status={order.orderStatus} escrowStatus={order.escrowStatus} />
                        <span className="dash-order-amount">GHS {(order.amount || order.totalAmount || 0).toLocaleString()}</span>
                      </div>
                      <p className="dash-order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="dash-order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {/* If order is paid and in 24h escrow */}
                      {order.orderStatus === 'paid' && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handleConfirmOrder(order._id)}
                            title="Confirm you have received the item"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                            Confirm Received
                          </button>
                          <button
                            className="btn btn-ghost btn-small"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => setDisputeModal(order)}
                            title="Freeze escrow payout if there is an issue"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>gavel</span>
                            Report Issue
                          </button>
                        </div>
                      )}

                      {/* WhatsApp contact */}
                      {(seller.whatsappNumber || listing.whatsappNumber) && (
                        <button
                          className="btn btn-ghost btn-small"
                          style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            const phone = seller.whatsappNumber || listing.whatsappNumber;
                            const url = buildWhatsAppUrl(
                              phone,
                              buildOrderContactMessage({
                                sellerName: seller.firstName || 'Seller',
                                listingTitle: listing.title || 'your item',
                                orderRef: order._id?.slice(-6)?.toUpperCase(),
                              })
                            );
                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                          WhatsApp Seller
                        </button>
                      )}

                      {canReview && (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => setReviewModal(order)}
                        >
                          <span className="material-symbols-outlined">rate_review</span>
                          Review
                        </button>
                      )}
                      {reviewedOrders.has(order._id) && (
                        <span className="dash-reviewed-chip">
                          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>check_circle</span>
                          Reviewed
                        </span>
                      )}
                      <Link
                        to={`/users/${seller._id}`}
                        className="btn btn-ghost btn-small"
                        style={{ fontSize: '12px' }}
                      >
                        Seller Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          order={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <DisputeModal
          order={disputeModal}
          onClose={() => setDisputeModal(null)}
          onSuccess={handleDisputeSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;

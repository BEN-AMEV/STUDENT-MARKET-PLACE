import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { buildWhatsAppUrl, buildOrderContactMessage } from '../utils/whatsapp';
import { resolveImageUrl } from '../utils/imageUrl';
import './Checkout.css';

// ─── Load Paystack Inline JS dynamically ──────────────────────────────────────
const loadPaystackScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('paystack-inline-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-inline-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ─── Component ────────────────────────────────────────────────────────────────
const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { listingId, listing: passedListing } = location.state || {};

  const [listing, setListing] = useState(passedListing || null);
  const [loadingListing, setLoadingListing] = useState(!passedListing);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Check if returning from Paystack redirect with reference query param
  const searchParams = new URLSearchParams(location.search);
  const urlRef = searchParams.get('reference') || searchParams.get('trxref');
  const urlOrderId = searchParams.get('orderId');

  const [verifyingUrlPayment, setVerifyingUrlPayment] = useState(!!urlRef);

  // Auto-verify payment if returning from Paystack redirect
  useEffect(() => {
    if (!urlRef) return;
    setVerifyingUrlPayment(true);
    api.get(`/orders/verify-payment?reference=${urlRef}${urlOrderId ? `&orderId=${urlOrderId}` : ''}`)
      .then(({ data }) => {
        setOrderSuccess(data.data);
        toast.success('Payment confirmed! 🎉');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Payment verification failed.');
      })
      .finally(() => setVerifyingUrlPayment(false));
  }, [urlRef, urlOrderId]);

  // Fetch listing if not passed via state
  useEffect(() => {
    if (!listing && listingId) {
      setLoadingListing(true);
      api.get(`/listings/${listingId}`)
        .then(({ data }) => setListing(data.data.listing))
        .catch(() => toast.error('Could not load listing details.'))
        .finally(() => setLoadingListing(false));
    }
  }, [listing, listingId]);

  // Guard: no listing context & not verifying payment → redirect to explore
  useEffect(() => {
    if (!listingId && !passedListing && !urlRef && !verifyingUrlPayment && !orderSuccess) {
      toast.error('No listing selected. Redirecting...');
      navigate('/explore');
    }
  }, [listingId, passedListing, urlRef, verifyingUrlPayment, orderSuccess, navigate]);

  const total = listing ? listing.price : 0;

  // ── Handle Paystack payment via Backend Initialization ──────────────────
  const handlePaystackPayment = useCallback(async (order) => {
    try {
      // 1. Initialize transaction via backend API (uses Paystack Secret Key)
      const { data: initRes } = await api.post(`/orders/${order._id}/initiate-payment`);
      const { reference, access_code, authorization_url } = initRes.data;

      // 2. Load Paystack Inline SDK script
      const scriptLoaded = await loadPaystackScript();
      const publicKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();

      if (scriptLoaded && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          access_code,
          onClose: () => {
            toast('Payment window closed. Your order is saved — you can pay anytime from your Dashboard.', { icon: 'ℹ️' });
            setSubmitting(false);
          },
          callback: async (response) => {
            try {
              const refToVerify = response?.reference || reference;
              const { data: verifyData } = await api.get(
                `/orders/verify-payment?reference=${refToVerify}&orderId=${order._id}`
              );
              setOrderSuccess(verifyData.data);
              toast.success('Payment confirmed! 🎉');
            } catch (err) {
              const msg = err.response?.data?.message || 'Payment verification failed.';
              toast.error(msg);
              setSubmitting(false);
            }
          },
        });

        handler.openIframe();
      } else if (authorization_url) {
        // Fallback: Redirect directly to Paystack's official hosted checkout page
        toast('Redirecting to Paystack secure checkout...', { icon: '🔄' });
        window.location.href = authorization_url;
      } else {
        toast.error('Could not initialize payment gateway.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('[Paystack Payment Error]:', err);
      const msg = err.response?.data?.message || 'Failed to initialize payment gateway. Check your keys or connection.';
      toast.error(msg);
      setSubmitting(false);
    }
  }, []);

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error('Please agree to the terms before placing your order.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the order
      const { data } = await api.post('/orders', {
        listingId: listing._id,
        paymentMethod,
      });
      const order = data.data;

      if (paymentMethod === 'paystack') {
        // 2a. Open Paystack popup
        await handlePaystackPayment(order);
        // setSubmitting(false) is handled in onClose / callback
      } else {
        // 2b. Cash — order created, show success immediately
        setOrderSuccess(order);
        toast.success('Order placed! Arrange payment with the seller.');
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // ── Success state ───────────────────────────────────────────────────────────
  if (orderSuccess) {
    const isPaid = orderSuccess.orderStatus === 'paid';
    return (
      <div className="checkout-success-wrapper animate-fade-in">
        <div className="checkout-success-card">
          <div className="checkout-success-icon">
            <span className="material-symbols-outlined">{isPaid ? 'check_circle' : 'pending'}</span>
          </div>
          <h1 className="checkout-success-title">
            {isPaid ? 'Payment Confirmed!' : 'Order Placed!'}
          </h1>
          <p className="checkout-success-sub">
            {isPaid
              ? <>Payment for <strong>{listing?.title}</strong> was successful.</>
              : <>Your order for <strong>{listing?.title}</strong> has been sent. Arrange payment with the seller.</>
            }
          </p>

          <div className="checkout-success-detail-grid">
            <div className="checkout-success-detail-item">
              <span className="checkout-success-detail-label">Order ID</span>
              <span className="checkout-success-detail-value checkout-mono">
                #{orderSuccess._id?.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="checkout-success-detail-item">
              <span className="checkout-success-detail-label">Amount</span>
              <span className="checkout-success-detail-value">
                GHS {orderSuccess.amount?.toLocaleString()}
              </span>
            </div>
            <div className="checkout-success-detail-item">
              <span className="checkout-success-detail-label">Payment</span>
              <span className="checkout-success-detail-value checkout-capitalize">
                {orderSuccess.paymentMethod === 'paystack' ? 'Paystack' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="checkout-success-detail-item">
              <span className="checkout-success-detail-label">Status</span>
              <span className={`checkout-success-status-chip ${isPaid ? 'paid' : ''}`}>
                {isPaid ? 'Paid ✓' : 'Awaiting Payment'}
              </span>
            </div>
          </div>

          {isPaid && orderSuccess.paymentReference && (
            <p className="checkout-success-ref">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt</span>
              Reference: <span className="checkout-mono">{orderSuccess.paymentReference}</span>
            </p>
          )}

          <p className="checkout-success-hint">
            <span className="material-symbols-outlined checkout-success-hint-icon">info</span>
            {isPaid
              ? 'The seller has been notified. Message them to arrange pickup/delivery.'
              : 'Message the seller to confirm your meetup and payment details.'}
          </p>

          <div className="checkout-success-actions">
            <button
              className="checkout-whatsapp-btn"
              onClick={() => {
                const phone = listing?.seller?.whatsappNumber || listing?.whatsappNumber;
                if (!phone) {
                  toast.error('The seller has not provided a WhatsApp number.');
                  return;
                }
                const orderRef = orderSuccess?._id?.slice(-6)?.toUpperCase();
                const url = buildWhatsAppUrl(
                  phone,
                  buildOrderContactMessage({
                    sellerName: listing?.seller?.firstName || 'Seller',
                    listingTitle: listing?.title || 'your item',
                    orderRef,
                  })
                );
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact Seller on WhatsApp
            </button>
            <Link to="/dashboard" className="btn btn-outline">
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loadingListing || verifyingUrlPayment) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: '16px' }}>{verifyingUrlPayment ? 'Verifying payment status...' : 'Loading checkout...'}</p>
      </div>
    );
  }

  if (!listing) return null;

  const imageUrl = resolveImageUrl(
    listing.images?.[0],
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=225&fit=crop'
  );

  const sellerName = listing.seller
    ? `${listing.seller.firstName} ${listing.seller.lastName}`
    : 'Unknown Seller';

  return (
    <div className="checkout-page animate-fade-in">
      {/* Breadcrumb */}
      <nav className="checkout-breadcrumb">
        <Link to="/">Home</Link>
        <span className="material-symbols-outlined">chevron_right</span>
        <Link to={`/listings/${listing._id}`}>Listing</Link>
        <span className="material-symbols-outlined">chevron_right</span>
        <span>Checkout</span>
      </nav>

      <h1 className="checkout-page-title">
        <span className="material-symbols-outlined">shopping_bag</span>
        Complete Your Order
      </h1>

      <div className="checkout-grid">
        {/* ── Left: Form ──────────────────────────────────────── */}
        <section className="checkout-form-section">

          {/* Step 1: Buyer Info */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-step-badge">1</div>
              <h2 className="checkout-card-title">Your Information</h2>
            </div>
            <div className="checkout-buyer-info">
              <div className="checkout-buyer-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.firstName} />
                ) : (
                  <span>{user?.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <p className="checkout-buyer-name">{user?.firstName} {user?.lastName}</p>
                <p className="checkout-buyer-meta">{user?.email}</p>
                <p className="checkout-buyer-meta">{user?.university}</p>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-step-badge">2</div>
              <h2 className="checkout-card-title">Payment Method</h2>
            </div>

            <div className="checkout-payment-options">
              {/* Paystack Option */}
              <label
                className={`checkout-payment-option ${paymentMethod === 'paystack' ? 'selected' : ''}`}
                htmlFor="pay-paystack"
              >
                <input
                  type="radio"
                  id="pay-paystack"
                  name="paymentMethod"
                  value="paystack"
                  checked={paymentMethod === 'paystack'}
                  onChange={() => setPaymentMethod('paystack')}
                  className="checkout-radio-hidden"
                />
                <div className="checkout-payment-option-icon checkout-paystack-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.647 4.353a8.32 8.32 0 010 11.773l-3.53 3.529a.555.555 0 01-.785 0L3.647 8.059a.555.555 0 010-.786l3.529-3.529a8.32 8.32 0 0112.471.609z" fill="#00C3F7"/>
                    <path d="M16.118 19.647a8.32 8.32 0 01-11.773 0L.815 16.118a.555.555 0 010-.785l11.686-11.686a.555.555 0 01.786 0l3.529 3.529a8.32 8.32 0 01-.698 12.471z" fill="#011B33" fillOpacity=".9"/>
                  </svg>
                </div>
                <div className="checkout-payment-option-body">
                  <span className="checkout-payment-option-label">Pay with Paystack</span>
                  <span className="checkout-payment-option-desc">Card · MTN MoMo · Vodafone Cash · AirtelTigo · Bank</span>
                </div>
                <div className={`checkout-radio-indicator ${paymentMethod === 'paystack' ? 'checked' : ''}`} />
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={`checkout-payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                htmlFor="pay-cash"
              >
                <input
                  type="radio"
                  id="pay-cash"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="checkout-radio-hidden"
                />
                <div className="checkout-payment-option-icon">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="checkout-payment-option-body">
                  <span className="checkout-payment-option-label">Cash on Delivery</span>
                  <span className="checkout-payment-option-desc">Pay in cash when you meet the seller on campus</span>
                </div>
                <div className={`checkout-radio-indicator ${paymentMethod === 'cash' ? 'checked' : ''}`} />
              </label>
            </div>

            {/* Paystack info banner */}
            {paymentMethod === 'paystack' && (
              <div className="checkout-paystack-notice animate-fade-in">
                <span className="material-symbols-outlined">lock</span>
                <p>You'll be redirected to <strong>Paystack's secure payment popup</strong> after placing your order. Supports MTN Mobile Money, Vodafone Cash, AirtelTigo, and all major cards.</p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="checkout-cash-notice animate-fade-in">
                <span className="material-symbols-outlined">handshake</span>
                <p>You'll pay in cash when you meet the seller on campus. Contact the seller on WhatsApp after ordering to coordinate pickup.</p>
              </div>
            )}
          </div>

          {/* Step 3: Confirm */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-step-badge">3</div>
              <h2 className="checkout-card-title">Confirm & Place Order</h2>
            </div>

            <div className="checkout-safety-notice">
              <span className="material-symbols-outlined checkout-safety-icon">security</span>
              <p>Always meet in <strong>public campus areas</strong> during daylight hours. Inspect the item before completing payment.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="checkout-terms-label" htmlFor="agree-terms">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="checkout-checkbox"
                />
                <span>
                  I agree to the <Link to="/explore" className="checkout-link">Terms of Service</Link> and understand that CampusMarket facilitates transactions under our 24-Hour Escrow Protection policy.
                </span>
              </label>

              <button
                type="submit"
                id="place-order-btn"
                className="btn btn-primary btn-full checkout-submit-btn"
                disabled={submitting || !agreeTerms}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    {paymentMethod === 'paystack' ? 'Opening Payment...' : 'Placing Order...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      {paymentMethod === 'paystack' ? 'lock' : 'check_circle'}
                    </span>
                    {paymentMethod === 'paystack'
                      ? `Pay GHS ${total.toLocaleString()} with Paystack`
                      : `Place Order · GHS ${total.toLocaleString()}`
                    }
                  </>
                )}
              </button>

              {paymentMethod === 'paystack' && (
                <p className="checkout-secure-note">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                  Payments are held in escrow for 24 hours. CampusMarket never stores your card details.
                </p>
              )}
            </form>
          </div>
        </section>

        {/* ── Right: Order Summary ─────────────────────────────── */}
        <aside className="checkout-summary-section">
          <div className="checkout-summary-card sticky-summary">
            <h2 className="checkout-summary-title">Order Summary</h2>

            {/* Listing preview */}
            <div className="checkout-summary-listing">
              <div className="checkout-summary-listing-img">
                <img
                  src={imageUrl}
                  alt={listing.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=225&fit=crop';
                  }}
                />
              </div>
              <div className="checkout-summary-listing-info">
                <p className="checkout-summary-listing-title">{listing.title}</p>
                <p className="checkout-summary-listing-seller">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                  {sellerName}
                </p>
                <span className={`checkout-condition-chip checkout-condition-${listing.condition}`}>
                  {listing.condition === 'n/a' ? 'Service' : listing.condition?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <hr className="checkout-divider" />

            {/* Price breakdown */}
            <div className="checkout-price-breakdown">
              <div className="checkout-price-row">
                <span>Item price</span>
                <span>GHS {listing.price.toLocaleString()}</span>
              </div>
              <div className="checkout-price-row">
                <span className="checkout-fee-label" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
                  24h Escrow Protection
                </span>
                <span style={{ color: '#059669', fontWeight: 600 }}>Free for Buyers</span>
              </div>
              <hr className="checkout-divider" />
              <div className="checkout-price-row checkout-total-row">
                <span>Total</span>
                <span className="checkout-total-amount">GHS {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Seller info */}
            <div className="checkout-summary-seller">
              <div className="checkout-summary-seller-avatar">
                {listing.seller?.avatarUrl ? (
                  <img src={listing.seller.avatarUrl} alt={sellerName} />
                ) : (
                  <span>{listing.seller?.firstName?.charAt(0)?.toUpperCase() || 'S'}</span>
                )}
              </div>
              <div>
                <p className="checkout-summary-seller-label">Sold by</p>
                <p className="checkout-summary-seller-name">{sellerName}</p>
                {listing.seller?.verificationStatus === 'approved' && (
                  <span className="checkout-verified-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified</span>
                    Verified Student
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="checkout-summary-location">
              <span className="material-symbols-outlined checkout-location-icon">location_on</span>
              <div>
                <p className="checkout-summary-location-uni">{listing.university}</p>
                {listing.pickupLocation && (
                  <p className="checkout-summary-location-pickup">{listing.pickupLocation}</p>
                )}
              </div>
            </div>

            {/* Paystack badge */}
            {paymentMethod === 'paystack' && (
              <div className="checkout-paystack-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>lock</span>
                <span>Secured by Paystack</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;

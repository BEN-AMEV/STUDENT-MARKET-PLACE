import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUrl';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isVerifiedSeller = user?.isEmailVerified && user?.verificationStatus === 'approved';

  if (!isVerifiedSeller) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '120px', paddingBottom: '60px', textAlign: 'center' }}>
        <div className="card card-padded" style={{ maxWidth: '540px', margin: '0 auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-tertiary)' }}>
            lock
          </span>
          <h2 className="text-headline-sm" style={{ marginTop: '16px' }}>Seller Dashboard Locked</h2>
          <p className="text-body-md color-on-surface-variant" style={{ marginTop: '8px' }}>
            Only verified student accounts can access the seller dashboard and manage listings.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/profile')}
          >
            Get Verified to Sell
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryTab, setInventoryTab] = useState('active');

  // Inventory lists from API
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesOrders, setSalesOrders] = useState([]);

  // Fetch user's listings and sales orders from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, ordersRes] = await Promise.all([
          api.get('/listings/mine'),
          api.get('/orders?role=selling').catch(() => ({ data: { data: [] } })),
        ]);
        setAllListings(listingsRes.data?.data || []);
        setSalesOrders(ordersRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load your listings.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter listings by status for each tab
  const activeListings = allListings.filter(l => l.status === 'active');
  const pausedListings = allListings.filter(l => l.status === 'paused');
  const soldListings = allListings.filter(l => l.status === 'sold');

  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/listings/${id}`);
        setAllListings(prev => prev.filter(item => item._id !== id));
        toast.success('Listing deleted successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete listing.');
      }
    }
  };

  const handleTogglePause = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.patch(`/listings/${id}/status`, { status: newStatus });
      setAllListings(prev =>
        prev.map(item => item._id === id ? { ...item, status: newStatus } : item)
      );
      toast.success(`Listing ${newStatus === 'paused' ? 'paused' : 'reactivated'}!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await api.patch(`/listings/${id}/status`, { status: 'sold' });
      setAllListings(prev =>
        prev.map(item => item._id === id ? { ...item, status: 'sold' } : item)
      );
      toast.success('Listing marked as sold!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleEditListing = (id) => {
    navigate(`/listings/${id}`);
  };

  const getInventoryList = () => {
    if (inventoryTab === 'active') return activeListings;
    if (inventoryTab === 'paused') return pausedListings;
    return soldListings;
  };

  const getImage = (item) => {
    if (item.images && item.images.length > 0) {
      return resolveImageUrl(item.images[0]);
    }
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&h=112&fit=crop';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Listed today';
    if (diffDays === 1) return 'Listed yesterday';
    if (diffDays < 7) return `Listed ${diffDays} days ago`;
    if (diffDays < 30) return `Listed ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `Listed on ${date.toLocaleDateString()}`;
  };

  // Escrow & Earnings calculations
  const paidSales = salesOrders.filter(o => ['paid', 'completed'].includes(o.orderStatus));
  const totalGrossSales = paidSales.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0);
  const totalCommission = paidSales.reduce((sum, o) => sum + (o.platformFeeAmount || o.platformFee || 0), 0);
  const totalNetEarnings = paidSales.reduce((sum, o) => sum + (o.sellerPayoutAmount || (o.amount ? +(o.amount * 0.97).toFixed(2) : 0)), 0);

  const escrowHoldingOrders = paidSales.filter(o => o.escrowStatus === 'HOLDING');
  const escrowHoldingAmount = escrowHoldingOrders.reduce((sum, o) => sum + (o.sellerPayoutAmount || 0), 0);

  const paidOutOrders = paidSales.filter(o => o.escrowStatus === 'PAID_OUT' || o.paymentStatus === 'released');
  const paidOutAmount = paidOutOrders.reduce((sum, o) => sum + (o.sellerPayoutAmount || 0), 0);

  // ─── Render Earnings Subview ─────────────────────────────────
  const renderEarningsTab = () => {
    const isPayoutConnected = !!user?.payoutDetails?.paystackRecipientCode;

    return (
      <div className="animate-fade-in">
        {/* Top Payout Account Status Banner */}
        {!isPayoutConnected ? (
          <div className="card card-padded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#eab308' }}>warning</span>
                <div>
                  <h4 className="text-body-md font-semibold" style={{ margin: 0 }}>Payout Account Not Connected</h4>
                  <p className="text-body-sm color-on-surface-variant" style={{ margin: 0 }}>
                    Please add your Mobile Money number so our 24h automated worker can transfer your sales earnings.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => navigate('/profile')}
              >
                Connect MoMo Account
              </button>
            </div>
          </div>
        ) : (
          <div className="card card-padded" style={{ backgroundColor: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#25D366' }}>verified</span>
                <div>
                  <h4 className="text-body-md font-semibold" style={{ margin: 0 }}>
                    Auto-Payout Active: {user.payoutDetails.accountName} ({user.payoutDetails.bankCode} • {user.payoutDetails.accountNumber})
                  </h4>
                  <p className="text-metadata color-outline" style={{ margin: 0 }}>
                    Matured escrow funds transfer directly to your Mobile Money/Bank.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => navigate('/profile')}
              >
                Edit Payout Details
              </button>
            </div>
          </div>
        )}

        {/* 4 Metrics Grid */}
        <section className="dash-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="dash-stat-card">
            <span className="text-metadata color-outline">Total Net Earnings</span>
            <h3 className="dash-stat-value" style={{ color: 'var(--color-primary)' }}>₵{totalNetEarnings.toLocaleString()}</h3>
            <span className="dash-stat-subtext">97% Seller Allocation</span>
          </div>

          <div className="dash-stat-card">
            <span className="text-metadata color-outline">24h Escrow Holding</span>
            <h3 className="dash-stat-value" style={{ color: '#eab308' }}>₵{escrowHoldingAmount.toLocaleString()}</h3>
            <span className="dash-stat-subtext">{escrowHoldingOrders.length} order(s) in holding</span>
          </div>

          <div className="dash-stat-card">
            <span className="text-metadata color-outline">Transferred to MoMo</span>
            <h3 className="dash-stat-value" style={{ color: '#25D366' }}>₵{paidOutAmount.toLocaleString()}</h3>
            <span className="dash-stat-subtext">Completed transfers</span>
          </div>

          <div className="dash-stat-card">
            <span className="text-metadata color-outline">Platform Commission</span>
            <h3 className="dash-stat-value" style={{ color: 'var(--color-outline)' }}>₵{totalCommission.toLocaleString()}</h3>
            <span className="dash-stat-subtext">3% Platform Fee</span>
          </div>
        </section>

        {/* Escrow Explanation Card */}
        <div className="card card-padded" style={{ marginTop: '24px', marginBottom: '24px', backgroundColor: 'var(--color-surface-container-low)' }}>
          <h4 className="text-body-md font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>shield_locked</span>
            How the 24-Hour Campus Escrow Works
          </h4>
          <p className="text-body-sm color-on-surface-variant" style={{ marginTop: '6px', lineHeight: '1.6' }}>
            When a student buys your item online with Paystack, 100% of the funds are deposited into our secure escrow holding. A 24-hour protection timer starts immediately. Once 24 hours pass without a dispute (or as soon as the buyer confirms delivery), our automated worker initiates a Paystack transfer of your 97% net earnings directly to your registered Mobile Money or Bank account.
          </p>
        </div>

        {/* Sales & Escrow Orders Table */}
        <div className="card card-padded" style={{ marginTop: '24px' }}>
          <div className="dash-section-header">
            <div>
              <h3 className="dash-section-title">Sales & Payout History</h3>
              <p className="dash-section-subtitle">Real-time status of your escrow holdings and payouts</p>
            </div>
          </div>

          <div className="dash-table-wrapper">
            {salesOrders.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3 }}>receipt_long</span>
                <p className="color-outline" style={{ marginTop: '12px' }}>No sales orders recorded yet.</p>
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th className="dash-table-th">Item & Buyer</th>
                    <th className="dash-table-th">Gross Amount</th>
                    <th className="dash-table-th">Your Net (97%)</th>
                    <th className="dash-table-th">Escrow Status</th>
                    <th className="dash-table-th">Payout Details</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map(order => {
                    const listing = order.listing || {};
                    const buyer = order.buyer || {};
                    const netAmount = order.sellerPayoutAmount || (order.amount ? +(order.amount * 0.97).toFixed(2) : 0);

                    const isPaidOut = order.escrowStatus === 'PAID_OUT' || order.paymentStatus === 'released';
                    const isHolding = order.escrowStatus === 'HOLDING';
                    const isDisputed = order.escrowStatus === 'DISPUTED' || order.orderStatus === 'disputed';

                    return (
                      <tr key={order._id} className="dash-table-tr">
                        <td className="dash-table-td">
                          <div className="dash-table-item-cell">
                            <div>
                              <p className="dash-table-item-title">{listing.title || 'Product'}</p>
                              <p className="text-metadata color-outline">
                                Buyer: {buyer.firstName ? `${buyer.firstName} ${buyer.lastName}` : 'Buyer'} • {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="dash-table-td">
                          <span className="dash-table-item-title">₵{(order.amount || order.totalAmount || 0).toLocaleString()}</span>
                        </td>
                        <td className="dash-table-td">
                          <span className="dash-table-item-title" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                            ₵{netAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="dash-table-td">
                          {isPaidOut && (
                            <span className="badge badge-status-live" style={{ background: '#25D366', color: '#fff' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                              Paid Out to MoMo
                            </span>
                          )}
                          {isHolding && (
                            <span className="badge badge-status-pending" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#b45309' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>timer</span>
                              24h Escrow Hold
                            </span>
                          )}
                          {isDisputed && (
                            <span className="badge" style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>gavel</span>
                              Disputed (Frozen)
                            </span>
                          )}
                          {!isPaidOut && !isHolding && !isDisputed && (
                            <span className="badge badge-status-pending">{order.orderStatus}</span>
                          )}
                        </td>
                        <td className="dash-table-td">
                          {isPaidOut && (
                            <span className="text-metadata color-outline" style={{ fontFamily: 'monospace' }}>
                              Ref: {order.paystackTransferReference || 'Completed'}
                            </span>
                          )}
                          {isHolding && order.payoutEligibleAt && (
                            <span className="text-metadata color-outline">
                              Eligible: {new Date(order.payoutEligibleAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {isDisputed && (
                            <span className="text-metadata" style={{ color: '#dc2626' }}>
                              Admin Reviewing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dash-layout animate-fade-in">
      {/* Sidebar navigation */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <span className="dash-sidebar-logo">CampusMarket</span>
        </div>
        <nav className="dash-sidebar-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`dash-sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined icon-filled">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`dash-sidebar-link ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`dash-sidebar-link ${activeTab === 'earnings' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">payments</span>
            <span>Earnings</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="dash-sidebar-link"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
        </nav>
        <div className="dash-sidebar-user">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="dash-sidebar-user-avatar" />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {user?.firstName?.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <p className="text-body-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-metadata color-outline">Seller • {user?.avgRating ? `${user.avgRating.toFixed(1)}★` : 'New'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        {/* Top Header */}
        <header className="dash-top-header">
          <div>
            <h1 className="text-headline-md dash-page-title">
              {activeTab === 'dashboard' ? 'Seller Hub' : activeTab === 'inventory' ? 'Manage Inventory' : 'Earnings & Escrow Payouts'}
            </h1>
            <p className="text-body-sm color-on-surface-variant">
              {activeTab === 'dashboard'
                ? 'Track your campus listings, sales, and escrow payouts'
                : activeTab === 'inventory'
                ? 'Organize, edit, or pause your active listings'
                : 'Monitor your 24-hour escrow hold and automated Mobile Money transfers'}
            </p>
          </div>
          <div className="dash-header-actions">
            <Link to="/listings/create" className="btn btn-primary dash-cta-btn">
              <span className="material-symbols-outlined">add</span>
              List an Item
            </Link>
          </div>
        </header>

        {/* Body content */}
        <main className="dash-body">
          {activeTab === 'earnings' && renderEarningsTab()}

          {(activeTab === 'dashboard' || activeTab === 'inventory') && (
            <>
              {/* Metric Cards (only on main dashboard) */}
              {activeTab === 'dashboard' && (
                <section className="dash-stats-grid">
                  <div className="dash-stat-card">
                    <span className="text-metadata color-outline">Total Net Sales</span>
                    <h3 className="dash-stat-value">₵{totalNetEarnings.toLocaleString()}</h3>
                    <span className="dash-stat-subtext">97% Net Payout</span>
                  </div>

                  <div className="dash-stat-card">
                    <span className="text-metadata color-outline">Active Listings</span>
                    <h3 className="dash-stat-value">{activeListings.length}</h3>
                    <span className="dash-stat-subtext">{allListings.length} total items</span>
                  </div>

                  <div className="dash-stat-card">
                    <span className="text-metadata color-outline">24h Escrow in Holding</span>
                    <h3 className="dash-stat-value" style={{ color: '#eab308' }}>₵{escrowHoldingAmount.toLocaleString()}</h3>
                    <span className="dash-stat-subtext">{escrowHoldingOrders.length} order(s)</span>
                  </div>

                  <div className="dash-stat-card">
                    <span className="text-metadata color-outline">Average Rating</span>
                    <h3 className="dash-stat-value">
                      {user?.avgRating ? user.avgRating.toFixed(1) : '5.0'}
                      <span style={{ fontSize: '18px', color: 'var(--color-primary)' }}>★</span>
                    </h3>
                    <span className="dash-stat-subtext">{user?.reviewCount || 0} reviews</span>
                  </div>
                </section>
              )}

              {/* Inventory Table Section */}
              <section className="dash-inventory-section card card-padded">
                <div className="dash-section-header">
                  <div>
                    <h3 className="dash-section-title">Product Inventory</h3>
                    <p className="dash-section-subtitle">Manage your live products and services on campus</p>
                  </div>

                  <div className="dash-tabs-pills">
                    <button
                      onClick={() => setInventoryTab('active')}
                      className={`dash-pill ${inventoryTab === 'active' ? 'active' : ''}`}
                    >
                      Active ({activeListings.length})
                    </button>
                    <button
                      onClick={() => setInventoryTab('paused')}
                      className={`dash-pill ${inventoryTab === 'paused' ? 'active' : ''}`}
                    >
                      Paused ({pausedListings.length})
                    </button>
                    <button
                      onClick={() => setInventoryTab('sold')}
                      className={`dash-pill ${inventoryTab === 'sold' ? 'active' : ''}`}
                    >
                      Sold ({soldListings.length})
                    </button>
                  </div>
                </div>

                <div className="dash-table-wrapper">
                  {loading ? (
                    <div className="text-center" style={{ padding: '48px 0' }}>
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '36px', color: 'var(--color-primary)' }}>
                        progress_activity
                      </span>
                      <p style={{ marginTop: '12px' }}>Loading your listings...</p>
                    </div>
                  ) : (
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th className="dash-table-th">Item Details</th>
                          <th className="dash-table-th">Price</th>
                          <th className="dash-table-th">Status</th>
                          <th className="dash-table-th">Engagement</th>
                          <th className="dash-table-th" style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getInventoryList().length === 0 ? (
                          <tr>
                            <td colSpan="5" className="dash-table-td text-center" style={{ padding: '32px 0' }}>
                              <p className="color-outline">
                                {inventoryTab === 'active'
                                  ? 'No active listings. Create your first listing!'
                                  : `No ${inventoryTab} listings.`
                                }
                              </p>
                              {inventoryTab === 'active' && (
                                <Link to="/listings/create" className="btn btn-primary btn-small" style={{ marginTop: '12px' }}>
                                  Create Listing
                                </Link>
                              )}
                            </td>
                          </tr>
                        ) : (
                          getInventoryList().map(item => (
                            <tr key={item._id} className="dash-table-tr">
                              <td className="dash-table-td">
                                <div className="dash-table-item-cell">
                                  <div
                                    className="dash-table-item-image"
                                    style={{ backgroundImage: `url(${getImage(item)})` }}
                                  ></div>
                                  <div>
                                    <p className="dash-table-item-title">{item.title}</p>
                                    <p className="text-metadata color-outline">
                                      {item.category} • {formatDate(item.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="dash-table-td">
                                <span className="dash-table-item-title">₵{item.price.toLocaleString()}</span>
                              </td>
                              <td className="dash-table-td">
                                <span
                                  className={`badge ${
                                    item.status === 'active' ? 'badge-status-live' :
                                    item.status === 'sold' ? 'badge-status-pending' :
                                    'badge-status-pending'
                                  }`}
                                >
                                  {item.status === 'active' ? 'Live' :
                                   item.status === 'paused' ? 'Paused' :
                                   item.status === 'sold' ? 'Sold' : item.status}
                                </span>
                              </td>
                              <td className="dash-table-td">
                                <div className="dash-table-engagement">
                                  <div className="dash-table-engagement-item">
                                    <span className="material-symbols-outlined">visibility</span>
                                    <span>{item.viewCount || 0} views</span>
                                  </div>
                                </div>
                              </td>
                              <td className="dash-table-td" style={{ textAlign: 'right' }}>
                                {item.status !== 'sold' && (
                                  <>
                                    <button
                                      onClick={() => handleTogglePause(item._id, item.status)}
                                      className="dash-action-btn"
                                      title={item.status === 'active' ? 'Pause Listing' : 'Reactivate Listing'}
                                    >
                                      <span className="material-symbols-outlined">
                                        {item.status === 'active' ? 'pause' : 'play_arrow'}
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => handleMarkSold(item._id)}
                                      className="dash-action-btn"
                                      title="Mark as Sold"
                                      style={{ marginLeft: '8px' }}
                                    >
                                      <span className="material-symbols-outlined">sell</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleEditListing(item._id)}
                                  className="dash-action-btn"
                                  title="View Listing"
                                  style={{ marginLeft: '8px' }}
                                >
                                  <span className="material-symbols-outlined">open_in_new</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(item._id)}
                                  className="dash-action-btn delete"
                                  title="Delete Listing"
                                  style={{ marginLeft: '8px' }}
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Bottom Cards Row */}
              <section className="dash-bottom-grid">
                {/* Boost Banner */}
                <div className="dash-promo-banner group">
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <h4 className="text-headline-sm dash-promo-title">Boost Your Sales</h4>
                    <p className="dash-promo-desc">
                      Learn how to take better product photos and write descriptions that sell 2x faster on campus.
                    </p>
                    <button className="btn btn-primary dash-promo-btn" onClick={() => toast.success('Seller guide coming soon!')}>
                      Read Seller Guide
                    </button>
                  </div>
                  <span className="material-symbols-outlined dash-promo-bg-icon">lightbulb</span>
                </div>

                {/* Account Status Card */}
                <div className="card card-padded">
                  <div className="dash-status-box">
                    <div className="dash-status-icon-box">
                      <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <div>
                      <h4 className="text-headline-sm dash-status-title">Student Verified Account</h4>
                      <p className="dash-status-desc">
                        Your university status is active and in good standing. Buyers see the verified badge on all your listings.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;

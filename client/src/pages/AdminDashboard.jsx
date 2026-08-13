import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const TABS = ['Verifications', 'Users', 'Listings', 'Disputes', 'Analytics'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Verifications');

  // ─── Verification state ───────────────────────────────────────
  const [verifications, setVerifications] = useState([]);
  const [verifLoading, setVerifLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [lightboxImage, setLightboxImage] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // ─── Users state ──────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });

  // ─── Listings state ───────────────────────────────────────────
  const [adminListings, setAdminListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsPagination, setListingsPagination] = useState({ page: 1, pages: 1, total: 0 });

  // ─── Analytics state ────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Disputes state ─────────────────────────────────
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeNote, setDisputeNote] = useState({});   // { [orderId]: noteString }
  const [resolvingId, setResolvingId] = useState(null);

  // ─── Verification helpers ─────────────────────────────────────
  const fetchVerifications = async (status = 'pending') => {
    setVerifLoading(true);
    try {
      const { data } = await api.get(`/admin/verifications?status=${status}`);
      setVerifications(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load verifications.');
    } finally {
      setVerifLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        api.get('/admin/verifications?status=pending'),
        api.get('/admin/verifications?status=approved'),
        api.get('/admin/verifications?status=rejected'),
      ]);
      setCounts({
        pending: pending.data.count,
        approved: approved.data.count,
        rejected: rejected.data.count,
      });
    } catch {
      // Counts are non-critical
    }
  };

  useEffect(() => {
    fetchVerifications(activeFilter);
    fetchCounts();
  }, [activeFilter]);

  const handleApprove = async (userId) => {
    setProcessingId(userId);
    try {
      await api.patch(`/admin/verifications/${userId}`, { action: 'approve' });
      toast.success('User verification approved!');
      setVerifications((prev) => prev.filter((u) => u._id !== userId));
      fetchCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId) => {
    if (rejectingId !== userId) {
      setRejectingId(userId);
      setRejectNote('');
      return;
    }
    setProcessingId(userId);
    try {
      await api.patch(`/admin/verifications/${userId}`, {
        action: 'reject',
        note: rejectNote || 'Verification rejected.',
      });
      toast.success('User verification rejected.');
      setVerifications((prev) => prev.filter((u) => u._id !== userId));
      setRejectingId(null);
      setRejectNote('');
      fetchCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject.');
    } finally {
      setProcessingId(null);
    }
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectNote('');
  };

  // ─── Users helpers ────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1, search = userSearch) => {
    setUsersLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
      setUsersPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === 'Users') fetchUsers(1);
  }, [activeTab]);

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      await api.patch(`/admin/users/${userId}`, { action, reason });
      toast.success(`User ${action}ed successfully.`);
      fetchUsers(usersPagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} user.`);
    }
  };

  // ─── Listings helpers ─────────────────────────────────────────
  const fetchAdminListings = useCallback(async (page = 1) => {
    setListingsLoading(true);
    try {
      const { data } = await api.get('/admin/listings', { params: { page, limit: 15 } });
      setAdminListings(data.data || []);
      setListingsPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load listings.');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Listings') fetchAdminListings(1);
  }, [activeTab]);

  const handleListingAction = async (listingId, action) => {
    try {
      await api.patch(`/admin/listings/${listingId}`, { action });
      toast.success(`Listing ${action}d.`);
      fetchAdminListings(listingsPagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  // ─── Analytics helpers ────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'Analytics') {
      setAnalyticsLoading(true);
      api.get('/admin/analytics/overview')
        .then(({ data }) => setAnalytics(data.data))
        .catch(() => toast.error('Failed to load analytics.'))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab]);

  // ─── Disputes helpers ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'Disputes') return;
    setDisputesLoading(true);
    api.get('/admin/disputes')
      .then(({ data }) => setDisputes(data.data || []))
      .catch(() => toast.error('Failed to load disputes.'))
      .finally(() => setDisputesLoading(false));
  }, [activeTab]);

  const handleResolveDispute = async (orderId, resolution) => {
    setResolvingId(orderId);
    try {
      await api.patch(`/admin/disputes/${orderId}`, {
        resolution,
        note: disputeNote[orderId] || '',
      });
      toast.success(resolution === 'refund_buyer' ? 'Refund approved.' : 'Funds released to seller.');
      setDisputes(prev => prev.filter(d => d._id !== orderId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setResolvingId(null);
    }
  };



  // ─── Shared helpers ───────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const statusBadge = (status) => {
    const map = {
      active: { label: 'Active', color: '#059669' },
      paused: { label: 'Paused', color: '#D97706' },
      sold: { label: 'Sold', color: '#6366F1' },
      expired: { label: 'Expired', color: '#9CA3AF' },
      deleted: { label: 'Removed', color: '#DC2626' },
    };
    const s = map[status] || { label: status, color: '#6B7280' };
    return (
      <span style={{
        padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
        backgroundColor: `${s.color}18`, color: s.color,
      }}>
        {s.label}
      </span>
    );
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="admin-page animate-fade-in">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">
              <span className="material-symbols-outlined icon-filled">admin_panel_settings</span>
              Admin Dashboard
            </h1>
            <p className="admin-subtitle">
              Manage verifications, users, listings and view platform analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Top-level Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
            {tab === 'Verifications' && counts.pending > 0 && (
              <span style={{
                marginLeft: '8px', backgroundColor: 'var(--color-tertiary)', color: '#fff',
                borderRadius: '99px', fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700,
              }}>
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* VERIFICATIONS TAB                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'Verifications' && (
        <>
          {/* Stats */}
          <div className="admin-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--pending">
                <span className="material-symbols-outlined">hourglass_top</span>
              </div>
              <div>
                <div className="admin-stat-value">{counts.pending}</div>
                <div className="admin-stat-label">Pending</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--approved">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <div className="admin-stat-value">{counts.approved}</div>
                <div className="admin-stat-label">Approved</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--rejected">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div>
                <div className="admin-stat-value">{counts.rejected}</div>
                <div className="admin-stat-label">Rejected</div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="admin-filter-tabs">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                className={`admin-filter-tab ${activeFilter === status ? 'active' : ''}`}
                onClick={() => { setActiveFilter(status); setRejectingId(null); }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="admin-filter-count">{counts[status]}</span>
              </button>
            ))}
          </div>

          {/* Queue */}
          {verifLoading ? (
            <div className="admin-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>
                progress_activity
              </span>
            </div>
          ) : verifications.length === 0 ? (
            <div className="admin-queue-empty">
              <span className="material-symbols-outlined">
                {activeFilter === 'pending' ? 'task_alt' : activeFilter === 'approved' ? 'verified_user' : 'block'}
              </span>
              <h4>{activeFilter === 'pending' ? 'All caught up!' : `No ${activeFilter} verifications`}</h4>
              <p>
                {activeFilter === 'pending'
                  ? 'There are no pending verifications to review.'
                  : `There are no ${activeFilter} verifications at this time.`}
              </p>
            </div>
          ) : (
            <div className="admin-queue">
              {verifications.map((user) => (
                <div key={user._id} className="admin-verif-card">
                  <div className="admin-verif-card-body">
                    {user.studentIdImageUrl ? (
                      <div
                        className="admin-verif-image"
                        onClick={() => setLightboxImage(resolveUrl(user.studentIdImageUrl))}
                      >
                        <img src={resolveUrl(user.studentIdImageUrl)} alt={`${user.firstName}'s Student ID`} />
                        <div className="admin-verif-image-overlay">
                          <span className="material-symbols-outlined">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-verif-no-image">
                        <span className="material-symbols-outlined">image_not_supported</span>
                      </div>
                    )}
                    <div className="admin-verif-info">
                      <div className="admin-verif-name">{user.firstName} {user.lastName}</div>
                      <div className="admin-verif-email">{user.email}</div>
                      <div className="admin-verif-details">
                        <span className="admin-verif-detail">
                          <span className="material-symbols-outlined">school</span>
                          {user.university}
                        </span>
                        {user.department && (
                          <span className="admin-verif-detail">
                            <span className="material-symbols-outlined">apartment</span>
                            {user.department}
                          </span>
                        )}
                        {user.studentId && (
                          <span className="admin-verif-detail">
                            <span className="material-symbols-outlined">badge</span>
                            {user.studentId}
                          </span>
                        )}
                        <span className="admin-verif-detail">
                          <span className="material-symbols-outlined">calendar_month</span>
                          {formatDate(user.updatedAt)}
                        </span>
                      </div>

                      {activeFilter !== 'pending' && (
                        <>
                          <span className={`admin-verif-status admin-verif-status--${user.verificationStatus}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              {user.verificationStatus === 'approved' ? 'check_circle' : 'cancel'}
                            </span>
                            {user.verificationStatus === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                          {user.verificationNote && (
                            <p className="admin-verif-note">Note: {user.verificationNote}</p>
                          )}
                        </>
                      )}

                      {activeFilter === 'pending' && (
                        <div className="admin-verif-actions">
                          <button
                            className="btn btn-approve"
                            onClick={() => handleApprove(user._id)}
                            disabled={processingId === user._id}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                            {processingId === user._id ? 'Processing…' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-reject"
                            onClick={() => handleReject(user._id)}
                            disabled={processingId === user._id}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                            {rejectingId === user._id ? 'Confirm Reject' : 'Reject'}
                          </button>
                          {rejectingId === user._id && (
                            <>
                              <button
                                className="btn btn-ghost"
                                onClick={cancelReject}
                                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                              >
                                Cancel
                              </button>
                              <div className="admin-reject-section">
                                <input
                                  type="text"
                                  className="admin-reject-input"
                                  placeholder="Reason for rejection…"
                                  value={rejectNote}
                                  onChange={(e) => setRejectNote(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleReject(user._id); }}
                                  autoFocus
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* USERS TAB                                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'Users' && (
        <div>
          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); fetchUsers(1, userSearch); }}
            style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}
          >
            <input
              type="text"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-on-surface)',
                fontSize: '0.9rem',
              }}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {usersLoading ? (
            <div className="admin-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>progress_activity</span>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-queue-empty">
              <span className="material-symbols-outlined">person_off</span>
              <h4>No users found</h4>
              <p>Try adjusting your search query.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-outline-variant)' }}>
                      {['Name', 'Email', 'University', 'Verification', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '12px' }}>
                          <strong>{u.firstName} {u.lastName}</strong>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-on-surface-variant)' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>{u.university}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                            backgroundColor: u.verificationStatus === 'approved' ? '#05996918' : u.verificationStatus === 'pending' ? '#D9770618' : '#6B728018',
                            color: u.verificationStatus === 'approved' ? '#059669' : u.verificationStatus === 'pending' ? '#D97706' : '#6B7280',
                          }}>
                            {u.verificationStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {u.isSuspended ? (
                            <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>Suspended</span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }}>Active</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-on-surface-variant)' }}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {u.isSuspended ? (
                            <button
                              className="btn btn-ghost btn-small"
                              style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#059669', borderColor: '#059669' }}
                              onClick={() => handleUserAction(u._id, 'unsuspend')}
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              className="btn btn-ghost btn-small"
                              style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#DC2626', borderColor: '#DC2626' }}
                              onClick={() => { if (window.confirm(`Suspend ${u.firstName} ${u.lastName}?`)) handleUserAction(u._id, 'suspend', 'Suspended by admin.'); }}
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  {Array.from({ length: usersPagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => fetchUsers(p)}
                      className={`btn ${p === usersPagination.page ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '36px', padding: '6px 10px' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              <p style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)', fontSize: '0.825rem' }}>
                Showing {users.length} of {usersPagination.total} users
              </p>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LISTINGS TAB                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'Listings' && (
        <div>
          {listingsLoading ? (
            <div className="admin-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>progress_activity</span>
            </div>
          ) : adminListings.length === 0 ? (
            <div className="admin-queue-empty">
              <span className="material-symbols-outlined">inventory_2</span>
              <h4>No listings found</h4>
              <p>No listings exist on the platform yet.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-outline-variant)' }}>
                      {['Title', 'Category', 'Price', 'Seller', 'Status', 'Listed', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminListings.map((listing) => (
                      <tr key={listing._id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '12px', maxWidth: '200px' }}>
                          <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.title}
                          </strong>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-on-surface-variant)' }}>{listing.category}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>₵{listing.price?.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          {listing.seller ? `${listing.seller.firstName} ${listing.seller.lastName}` : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>{statusBadge(listing.status)}</td>
                        <td style={{ padding: '12px', color: 'var(--color-on-surface-variant)' }}>
                          {formatDate(listing.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            {listing.status !== 'active' && (
                              <button
                                className="btn btn-ghost btn-small"
                                style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#059669', borderColor: '#059669' }}
                                onClick={() => handleListingAction(listing._id, 'approve')}
                              >
                                Restore
                              </button>
                            )}
                            {listing.status === 'active' && (
                              <button
                                className="btn btn-ghost btn-small"
                                style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#D97706', borderColor: '#D97706' }}
                                onClick={() => handleListingAction(listing._id, 'flag')}
                              >
                                Flag
                              </button>
                            )}
                            {listing.status !== 'deleted' && (
                              <button
                                className="btn btn-ghost btn-small"
                                style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#DC2626', borderColor: '#DC2626' }}
                                onClick={() => { if (window.confirm('Remove this listing?')) handleListingAction(listing._id, 'remove'); }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {listingsPagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  {Array.from({ length: listingsPagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => fetchAdminListings(p)}
                      className={`btn ${p === listingsPagination.page ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '36px', padding: '6px 10px' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              <p style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)', fontSize: '0.825rem' }}>
                Showing {adminListings.length} of {listingsPagination.total} listings
              </p>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DISPUTES TAB                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'Disputes' && (
        <div>
          {disputesLoading ? (
            <div className="admin-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>progress_activity</span>
            </div>
          ) : disputes.length === 0 ? (
            <div className="admin-queue-empty">
              <span className="material-symbols-outlined">gavel</span>
              <h4>No open disputes</h4>
              <p>Disputed orders will appear here for review.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {disputes.map(dispute => {
                const buyer   = dispute.buyer  || {};
                const seller  = dispute.seller || {};
                const listing = dispute.listing || {};
                const isResolving = resolvingId === dispute._id;
                const imgUrl = resolveUrl(listing.images?.[0]?.thumbnail || listing.images?.[0]?.url || '');
                return (
                  <div key={dispute._id} className="card card-padded" style={{ borderLeft: '4px solid #dc2626' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={listing.title}
                          style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=150&fit=crop';
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{listing.title || 'Unknown Item'}</h3>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '2px 10px', borderRadius: '999px' }}>
                            DISPUTED
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-outline)', marginTop: '4px' }}>
                          Order ID: <code style={{ fontSize: '11px' }}>{dispute._id}</code>
                          {' · '}GHS {((dispute.amount || 0) + (dispute.platformFee || 0)).toLocaleString()}
                          {dispute.disputedAt && ` · Disputed ${new Date(dispute.disputedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                    </div>

                    {/* Parties */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      {[
                        { label: '🛒 Buyer', person: buyer },
                        { label: '🏪 Seller', person: seller },
                      ].map(({ label, person }) => (
                        <div key={label} style={{ background: 'var(--color-surface-container-low)', borderRadius: '8px', padding: '10px 12px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-outline)', marginBottom: '4px' }}>{label}</p>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{person.firstName} {person.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{person.email}</p>
                          {person.university && <p style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>{person.university}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Dispute reason */}
                    {dispute.disputeReason && (
                      <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buyer's Reason</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface)' }}>{dispute.disputeReason}</p>
                      </div>
                    )}

                    {/* Evidence */}
                    {dispute.disputeEvidence?.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-outline)', marginBottom: '6px' }}>EVIDENCE</p>
                        <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                          {dispute.disputeEvidence.map((ev, i) => (
                            <li key={i}><strong>{ev.type}:</strong> {ev.content}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Admin note */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-outline)', marginBottom: '6px' }}>
                        ADMIN NOTE (optional — sent to both parties)
                      </label>
                      <textarea
                        rows={2}
                        style={{
                          width: '100%', fontFamily: 'inherit', fontSize: '0.8rem',
                          padding: '8px 10px', border: '1.5px solid var(--color-border-base)',
                          borderRadius: '8px', background: 'var(--color-surface-container-lowest)',
                          color: 'var(--color-on-surface)', resize: 'vertical', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Add context for your decision..."
                        value={disputeNote[dispute._id] || ''}
                        onChange={e => setDisputeNote(prev => ({ ...prev, [dispute._id]: e.target.value }))}
                      />
                    </div>

                    {/* Resolution buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-small"
                        disabled={isResolving}
                        onClick={() => window.confirm('Approve REFUND to buyer?') && handleResolveDispute(dispute._id, 'refund_buyer')}
                        style={{ background: '#2563eb', borderColor: '#2563eb' }}
                      >
                        {isResolving ? '...' : '💰 Refund Buyer'}
                      </button>
                      <button
                        className="btn btn-primary btn-small"
                        disabled={isResolving}
                        onClick={() => window.confirm('Release funds to SELLER?') && handleResolveDispute(dispute._id, 'release_to_seller')}
                      >
                        {isResolving ? '...' : '✅ Release to Seller'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ANALYTICS TAB                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'Analytics' && (

        <div>
          {analyticsLoading ? (
            <div className="admin-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>progress_activity</span>
            </div>
          ) : !analytics ? (
            <div className="admin-queue-empty">
              <span className="material-symbols-outlined">bar_chart</span>
              <h4>No analytics data</h4>
              <p>Stats will appear once there is platform activity.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Total Users', value: analytics.totalUsers, icon: 'group', color: '#6366F1' },
                { label: 'Verified Users', value: analytics.verifiedUsers, icon: 'verified_user', color: '#059669' },
                { label: 'Pending Verifications', value: analytics.pendingVerifications, icon: 'hourglass_top', color: '#D97706' },
                { label: 'Total Listings', value: analytics.totalListings, icon: 'inventory_2', color: '#0EA5E9' },
                { label: 'Active Listings', value: analytics.activeListings, icon: 'storefront', color: '#10B981' },
                { label: 'New Users This Month', value: analytics.newUsersThisMonth, icon: 'person_add', color: '#8B5CF6' },
                { label: 'New Listings This Month', value: analytics.newListingsThisMonth, icon: 'add_box', color: '#F43F5E' },
              ].map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="card card-padded"
                  style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                    backgroundColor: `${color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ color, fontSize: '24px' }}>
                      {icon}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-on-surface)', lineHeight: 1 }}>
                      {value ?? '—'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div className="admin-lightbox" onClick={() => setLightboxImage(null)}>
          <button className="admin-lightbox-close" onClick={() => setLightboxImage(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={lightboxImage} alt="Student ID" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

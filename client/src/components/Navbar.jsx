import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, deleteAccount } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // Notification bell state
  const [unreadCount, setUnreadCount]       = useState(0);
  const [bellOpen, setBellOpen]             = useState(false);
  const [notifications, setNotifications]   = useState([]);
  const [loadingNotifs, setLoadingNotifs]   = useState(false);
  const bellRef = useRef(null);

  // User is a verified seller if email is verified AND student ID is approved
  const isVerifiedSeller =
    user?.isEmailVerified && user?.verificationStatus === 'approved';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowDeleteConfirm(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll notification unread count every 60s when logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () =>
      api.get('/notifications/unread-count')
        .then(({ data }) => setUnreadCount(data.data?.count || 0))
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch full notifications when bell panel opens
  useEffect(() => {
    if (!bellOpen || !isAuthenticated) return;
    setLoadingNotifs(true);
    api.get('/notifications?limit=15')
      .then(({ data }) => {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, [bellOpen, isAuthenticated]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setShowDeleteConfirm(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch {
      // Error is set in the store
    } finally {
      setIsDeleting(false);
      setDropdownOpen(false);
      setShowDeleteConfirm(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  // ── Notification handlers ─────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkOneRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  // Notification icon map
  const notifIcon = (type) => ({
    new_order:          'shopping_bag',
    order_update:       'package_2',
    payment_received:   'payments',
    new_review:         'star',
    dispute_update:     'gavel',
    listing_expired:    'timer_off',
    verification_update:'verified_user',
  }[type] || 'notifications');

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="material-symbols-outlined icon-filled navbar-logo-icon">
            location_on
          </span>
          <h1 className="navbar-logo-text">CampusMarket</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-links hide-mobile">
          <Link
            to="/"
            className={`navbar-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/explore"
            className={`navbar-link ${isActive('/explore') ? 'active' : ''}`}
          >
            Explore
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              {isVerifiedSeller && (
                <Link
                  to="/sell"
                  className={`navbar-link ${isActive('/sell') ? 'active' : ''}`}
                >
                  Sell
                </Link>
              )}
              <Link
                to="/profile"
                className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}
              >
                Profile
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'text-bottom' }}>
                    shield
                  </span>
                  {' '}Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button className="btn-icon" aria-label="Search">
            <span className="material-symbols-outlined">search</span>
          </button>

          {isAuthenticated ? (
            <>
              {isVerifiedSeller && (
                <Link to="/listings/create" className="btn btn-label btn-primary navbar-list-btn hide-mobile">
                  LIST ITEM
                </Link>
              )}

              {/* ── Notification Bell ─────────────────────────── */}
              <div className="navbar-bell-wrap" ref={bellRef}>
                <button
                  className="btn-icon navbar-bell-btn"
                  aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
                  onClick={() => setBellOpen(prev => !prev)}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="navbar-bell-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="navbar-notif-panel animate-fade-in" role="menu">
                    <div className="navbar-notif-header">
                      <h3 className="navbar-notif-title">Notifications</h3>
                      {unreadCount > 0 && (
                        <button className="navbar-notif-markall" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {loadingNotifs ? (
                      <div className="navbar-notif-loading">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="navbar-notif-empty">
                        <span className="material-symbols-outlined">notifications_off</span>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <ul className="navbar-notif-list">
                        {notifications.map(notif => (
                          <li
                            key={notif._id}
                            className={`navbar-notif-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => !notif.isRead && handleMarkOneRead(notif._id)}
                          >
                            <div className="navbar-notif-icon-wrap">
                              <span className="material-symbols-outlined">
                                {notifIcon(notif.type)}
                              </span>
                            </div>
                            <div className="navbar-notif-body">
                              <p className="navbar-notif-msg-title">{notif.title}</p>
                              <p className="navbar-notif-msg">{notif.message}</p>
                              <span className="navbar-notif-time">
                                {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!notif.isRead && <div className="navbar-notif-dot" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="navbar-user-menu" ref={dropdownRef}>
                <button
                  className="navbar-avatar-btn"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev);
                    setShowDeleteConfirm(false);
                  }}
                  title={`Logged in as ${user?.firstName}`}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="navbar-avatar"
                    />
                  ) : (
                    <div className="navbar-avatar-placeholder">
                      {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-name">{user?.firstName} {user?.lastName}</p>
                      <p className="navbar-dropdown-email">{user?.email}</p>
                    </div>
                    <div className="navbar-dropdown-divider" />

                    <Link
                      to="/dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined navbar-dropdown-icon">dashboard</span>
                      My Dashboard
                    </Link>

                    <Link
                      to={`/users/${user?._id}`}
                      className="navbar-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined navbar-dropdown-icon">person</span>
                      Public Profile
                    </Link>

                    <Link
                      to="/profile"
                      className="navbar-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined navbar-dropdown-icon">settings</span>
                      Account Settings
                    </Link>

                    {isVerifiedSeller && (
                      <Link
                        to="/sell"
                        className="navbar-dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="material-symbols-outlined navbar-dropdown-icon">storefront</span>
                        Seller Hub
                      </Link>
                    )}

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="navbar-dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="material-symbols-outlined navbar-dropdown-icon">shield</span>
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="navbar-dropdown-divider" />

                    <button
                      className="navbar-dropdown-item"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined navbar-dropdown-icon">logout</span>
                      Log Out
                    </button>

                    <div className="navbar-dropdown-divider" />

                    {!showDeleteConfirm ? (
                      <button
                        className="navbar-dropdown-item navbar-dropdown-item--danger"
                        onClick={handleDeleteAccount}
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined navbar-dropdown-icon">delete_forever</span>
                        Delete Account
                      </button>
                    ) : (
                      <div className="navbar-dropdown-confirm">
                        <p className="navbar-dropdown-confirm-text">
                          Are you sure? This action is permanent and cannot be undone.
                        </p>
                        <div className="navbar-dropdown-confirm-actions">
                          <button
                            className="btn btn-ghost btn-small"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-small navbar-dropdown-confirm-delete"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-label btn-primary navbar-list-btn hide-mobile">
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

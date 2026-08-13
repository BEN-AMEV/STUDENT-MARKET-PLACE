import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './MobileNav.css';

const MobileNav = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // User is a verified seller if email is verified AND student ID is approved
  const isVerifiedSeller =
    user?.isEmailVerified && user?.verificationStatus === 'approved';

  // Determine where the Sell button should link
  const sellLink = isAuthenticated
    ? isVerifiedSeller
      ? '/sell'
      : '/profile'
    : '/login';

  // Don't show on auth pages
  const authPaths = ['/login', '/register', '/verify-email', '/forgot-password'];
  const isAuthPage = authPaths.some(p => location.pathname.startsWith(p));
  if (isAuthPage) return null;

  return (
    <nav className="mobile-nav">
      <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <span className={`material-symbols-outlined ${isActive('/') ? 'icon-filled' : ''}`}>
          home
        </span>
        <span className="mobile-nav-label">Home</span>
      </Link>

      <Link to="/explore" className={`mobile-nav-item ${isActive('/explore') ? 'active' : ''}`}>
        <span className="material-symbols-outlined">explore</span>
        <span className="mobile-nav-label">Explore</span>
      </Link>

      <Link to={sellLink} className="mobile-nav-item mobile-nav-sell" style={{ position: 'relative' }}>
        <span className="material-symbols-outlined mobile-nav-sell-icon">add_circle</span>
        {isAuthenticated && !isVerifiedSeller && (
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              top: '2px',
              right: '12px',
              fontSize: '12px',
              color: 'var(--color-outline)',
              background: 'var(--color-surface)',
              borderRadius: '50%',
              padding: '1px',
            }}
          >
            lock
          </span>
        )}
        <span className="mobile-nav-label">Sell</span>
      </Link>

      <Link to={isAuthenticated ? '/dashboard' : '/login'} className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
        <span className={`material-symbols-outlined ${isActive('/dashboard') ? 'icon-filled' : ''}`}>dashboard</span>
        <span className="mobile-nav-label">Dashboard</span>
      </Link>

      <Link to={isAuthenticated ? '/profile' : '/login'} className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}>
        <span className="material-symbols-outlined">person</span>
        <span className="mobile-nav-label">Profile</span>
      </Link>
    </nav>
  );
};

export default MobileNav;

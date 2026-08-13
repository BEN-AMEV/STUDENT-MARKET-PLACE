import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';

/**
 * VerifiedRoute — Wraps routes that require a verified seller.
 * - Not authenticated → redirects to /login
 * - Authenticated but unverified → redirects to /profile with a toast
 * - Authenticated + verified → renders child routes
 */
const VerifiedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const hasToasted = useRef(false);

  const isVerifiedSeller =
    user?.isEmailVerified && user?.verificationStatus === 'approved';

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isVerifiedSeller && !hasToasted.current) {
      hasToasted.current = true;
      toast('You need to be a verified seller to access this feature. Submit your student ID for verification.', {
        icon: '🔒',
        duration: 5000,
      });
    }
  }, [isLoading, isAuthenticated, isVerifiedSeller]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isVerifiedSeller) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default VerifiedRoute;

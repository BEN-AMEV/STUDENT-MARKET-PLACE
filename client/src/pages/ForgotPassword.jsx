import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-page">
        <div className="auth-bg-blob auth-bg-blob-1"></div>
        <div className="auth-bg-blob auth-bg-blob-2"></div>

        <main className="auth-container animate-fade-in">
          <div className="auth-identity">
            <div className="auth-logo-box">
              <span className="material-symbols-outlined icon-filled auth-logo-icon">
                mark_email_read
              </span>
            </div>
            <h1 className="text-headline-lg auth-app-name">Check Your Email</h1>
            <p className="color-on-surface-variant">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
          </div>

          <div className="auth-card" style={{ textAlign: 'center' }}>
            <p className="text-body-lg color-on-surface-variant" style={{ marginBottom: 'var(--space-lg)' }}>
              Please check your spam or junk folder if you don't receive the email within a few minutes.
            </p>
            <Link to="/login" className="btn btn-primary btn-full">
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <main className="auth-container animate-fade-in">
        <div className="auth-identity">
          <div className="auth-logo-box">
            <span className="material-symbols-outlined icon-filled auth-logo-icon">lock_reset</span>
          </div>
          <h1 className="text-headline-lg auth-app-name">Forgot Password?</h1>
          <p className="color-on-surface-variant">
            Enter your university email below and we'll send you a password reset link.
          </p>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">University Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">alternate_email</span>
                <input
                  id="email"
                  type="email"
                  className="input-field has-icon-left"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>
                    progress_activity
                  </span>
                  Sending...
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <hr className="divider" />
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <p className="text-body-sm color-on-surface-variant">
              Remember your password?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;

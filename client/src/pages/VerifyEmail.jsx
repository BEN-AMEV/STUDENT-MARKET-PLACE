import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, isLoading } = useAuthStore();

  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Go back on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code.');
      return;
    }

    try {
      await verifyEmail(email, otpString);
      toast.success('Email verified! Welcome to CampusMarket.');
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <main className="auth-container animate-fade-in">
        <div className="auth-identity">
          <div className="auth-logo-box">
            <span className="material-symbols-outlined icon-filled auth-logo-icon">mail</span>
          </div>
          <h1 className="text-headline-lg auth-app-name">Verify Your Email</h1>
          <p className="color-on-surface-variant">
            We sent a 6-digit verification code to <strong>{email}</strong>
          </p>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" style={{ textAlign: 'center', marginBottom: '8px' }}>
                Verification Code
              </label>
              <div
                onPaste={handlePaste}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  margin: '8px 0',
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="input-field"
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      borderRadius: 'var(--radius-md)',
                      padding: 0,
                    }}
                    autoFocus={index === 0}
                  />
                ))}
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
                  Verifying...
                </>
              ) : (
                <>
                  <span>Verify Email</span>
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
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  opacity: resendCooldown > 0 ? 0.6 : 1,
                  textDecoration: 'underline',
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-footer">
          <p className="text-metadata color-outline auth-footer-text">
            Need to change your email?{' '}
            <Link to="/register" className="auth-footer-link">
              Register again
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;

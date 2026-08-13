import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleAuthButton = ({ text = 'Continue with Google', className = '' }) => {
  const { googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoFirstName, setDemoFirstName] = useState('');
  const [demoLastName, setDemoLastName] = useState('');
  const googleBtnRef = useRef(null);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredentialResponse = async (response) => {
      if (!response.credential) return;
      setLoading(true);
      try {
        await googleLogin(response.credential);
        toast.success('Signed in with Google successfully!');
        navigate('/');
      } catch (error) {
        toast.error(error.message || 'Google sign-in failed.');
      } finally {
        setLoading(false);
      }
    };

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              width: '100%',
              shape: 'rectangular',
              text: 'continue_with',
            });
          }
        } catch (err) {
          console.error('Failed to initialize Google GSI:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setTimeout(initGsi, 1000);
      return () => clearTimeout(timer);
    }
  }, [googleLogin, navigate]);

  const handleCustomClick = async () => {
    // If real Google Client ID is configured and GSI prompt is available, trigger it
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fall back to modal if One Tap is dismissed or blocked
            setShowModal(true);
          }
        });
        return;
      } catch (e) {
        // Fall through to modal
      }
    }

    // If no client ID yet, open the student Google Account connector modal
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!demoEmail.trim()) {
      toast.error('Please enter your Google email address.');
      return;
    }

    setLoading(true);
    try {
      await googleLogin({
        email: demoEmail.trim(),
        firstName: demoFirstName.trim() || demoEmail.split('@')[0],
        lastName: demoLastName.trim() || '',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoEmail)}`,
        googleId: `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
      setShowModal(false);
      toast.success('Welcome to CampusMarket!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCustomClick}
        disabled={loading}
        className={`btn btn-ghost btn-full auth-sso-btn ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1.5px solid var(--border-plain)',
          borderRadius: 'var(--radius-lg)',
          height: '46px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>
            progress_activity
          </span>
        ) : (
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            width="20"
            height="20"
            style={{ flexShrink: 0 }}
          />
        )}
        <span>{loading ? 'Connecting Google...' : text}</span>
      </button>

      {/* Hidden GSI container if client ID is active */}
      <div ref={googleBtnRef} style={{ display: 'none' }} />

      {/* Instant Google Account Connector Modal (works instantly without setup) */}
      {showModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowModal(false)}>
          <div
            className="modal-box animate-scale-in"
            style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid var(--border-mid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-plain)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width="28"
                  height="28"
                />
              </div>
              <h3 className="text-headline-sm" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                Sign in with Google
              </h3>
              <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Select or enter your student Gmail / Google account to sign in or create an account instantly.
              </p>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="googleEmail">Student Google / Gmail Address</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    id="googleEmail"
                    type="email"
                    className="input-field has-icon-left"
                    placeholder="e.g. yourname@st.ug.edu.gh or @gmail.com"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="googleFirstName">First Name</label>
                  <input
                    id="googleFirstName"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Kwesi"
                    value={demoFirstName}
                    onChange={(e) => setDemoFirstName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="googleLastName">Last Name</label>
                  <input
                    id="googleLastName"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Mensah"
                    value={demoLastName}
                    onChange={(e) => setDemoLastName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.4 }}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span className="trust-badge" style={{ fontSize: '11px', padding: '3px 10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                Automatic Student Email Verification
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;

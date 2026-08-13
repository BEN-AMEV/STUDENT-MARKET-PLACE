import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';
import './Login.css'; // Shared auth styles

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    university: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      const res = await register(formData);
      if (res?.devBypassed) {
        toast.success('Account created and auto-verified (Dev Bypass)!');
        navigate('/');
      } else {
        toast.success('Account created! Check your email for a verification code.');
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="register-page">
      {/* Background Decoration */}
      <div className="register-bg-decor">
        <div className="register-bg-circle-1"></div>
        <div className="register-bg-circle-2"></div>
      </div>

      {/* Top AppBar */}
      <header className="navbar" style={{ position: 'fixed' }}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--color-primary)' }}>
              location_on
            </span>
            <h1 style={{
              fontSize: 'var(--font-size-headline-md)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              letterSpacing: '-0.01em'
            }}>
              CampusMarket
            </h1>
          </Link>

          <nav className="navbar-links hide-mobile">
            <Link to="/" className="navbar-link">Home</Link>
            <Link to="/explore" className="navbar-link">Explore</Link>
            <span className="navbar-link active" style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '4px' }}>
              Create Account
            </span>
          </nav>

          <button className="btn-icon" aria-label="Search">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="register-main">
        <div className="register-grid">
          {/* Left: Benefits */}
          <section className="register-benefits animate-fade-in">
            <div>
              <span className="register-benefits-tag">
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>verified</span>
                Exclusive Student Network
              </span>
            </div>

            <h2 className="text-headline-lg register-benefits-headline">
              Unlock a safer, smarter way to trade on campus.
            </h2>
            <p className="text-body-lg color-on-surface-variant register-benefits-desc">
              Join thousands of verified students buying and selling everything from textbooks to furniture with peace of mind.
            </p>

            {/* Features Grid */}
            <div className="register-features-grid">
              {/* Feature 1 */}
              <div className="register-feature-card">
                <div className="register-feature-icon-box primary-bg">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3 className="text-headline-sm">Verified .edu Only</h3>
                <p>
                  We strictly verify university emails to ensure every user is an actual student or faculty member.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="register-feature-card">
                <div className="register-feature-icon-box secondary-bg">
                  <span className="material-symbols-outlined">shield_person</span>
                </div>
                <h3 className="text-headline-sm">Safe Campus Meetups</h3>
                <p>
                  Integrated campus map highlights designated safe swap zones monitored by university security.
                </p>
              </div>

              {/* CTA Feature */}
              <div className="register-feature-cta">
                <div style={{ flex: 1 }}>
                  <h3 className="text-headline-sm">Build Your Campus Reputation</h3>
                  <p>
                    Every successful trade boosts your student rating, making it easier to sell items faster and buy with confidence.
                  </p>
                </div>
                <div className="register-avatars">
                  <div className="register-avatar">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="Student" />
                  </div>
                  <div className="register-avatar">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="Student" />
                  </div>
                  <div className="register-avatar">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" alt="Student" />
                  </div>
                  <div className="register-avatar-count">+12k</div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Form */}
          <section className="register-form-side animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="register-form-card">
              <div className="register-form-header">
                <h2 className="text-headline-md">Join CampusMarket</h2>
                <p>Ready to start trading? It only takes a minute.</p>
              </div>

              <form className="register-form" onSubmit={handleSubmit}>
                {/* Name Row */}
                <div className="register-name-row">
                  <div className="input-group">
                    <label className="input-label" htmlFor="firstName">First Name</label>
                    <div className="input-wrapper">
                      <span className="material-symbols-outlined input-icon">person</span>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        className="input-field has-icon-left"
                        placeholder="Jane"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="lastName">Last Name</label>
                    <div className="input-wrapper">
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        className="input-field"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* University */}
                <div className="input-group">
                  <label className="input-label" htmlFor="university">University</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">account_balance</span>
                    <select
                      id="university"
                      name="university"
                      className="input-field has-icon-left"
                      value={formData.university}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select your university</option>
                      <option value="University of Ghana">University of Ghana</option>
                      <option value="KNUST">KNUST</option>
                      <option value="University of Cape Coast">University of Cape Coast</option>
                      <option value="Ashesi University">Ashesi University</option>
                      <option value="UPSA">UPSA</option>
                      <option value="Ghana Institute of Management">GIMPA</option>
                      <option value="Central University">Central University</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div className="input-group">
                  <label className="input-label" htmlFor="regEmail">University Email</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input
                      id="regEmail"
                      type="email"
                      name="email"
                      className="input-field has-icon-left"
                      placeholder="jane.doe@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <span className="input-hint">
                    <span className="material-symbols-outlined">info</span>
                    We'll send a verification code to this email.
                  </span>
                </div>

                {/* Password */}
                <div className="input-group">
                  <label className="input-label" htmlFor="regPassword">Password</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <input
                      id="regPassword"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="input-field has-icon-left has-icon-right"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms">
                    I agree to the{' '}
                    <a href="#" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Privacy Policy</a>.
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isLoading}
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>
                        progress_activity
                      </span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* SSO Divider */}
              <div className="auth-divider" style={{ marginTop: '20px', paddingTop: '16px' }}>
                <hr className="divider" />
              </div>

              <GoogleAuthButton text="Sign up with Google" style={{ marginTop: '16px' }} />

              <div className="register-form-divider">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    Log in
                  </Link>
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="register-trust-badges">
              <div className="register-trust-badge">
                <span className="material-symbols-outlined">verified_user</span>
                <span>Secure SSL</span>
              </div>
              <div className="register-trust-dot"></div>
              <div className="register-trust-badge">
                <span className="material-symbols-outlined">lock_reset</span>
                <span>Encrypted</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Register;
